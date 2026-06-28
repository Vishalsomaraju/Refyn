/**
 * aiRouter.js  (UPDATED for Mnemo)
 *
 * DROP-IN REPLACEMENT for the old aiRouter.js
 *
 * What changed vs CodeRefine original:
 *  - CascadeFlow routing: complexity score decides which model runs FIRST
 *    (no more "try Gemini, hope it works, fallback waterfall")
 *  - Memory context: Hindsight memories injected into the prompt
 *  - Response now includes: usedModel, complexityScore, cost, latency,
 *    routingReason, savings — all needed for the frontend stats bar
 *
 * What stayed the same:
 *  - analyzeWithGemini / analyzeWithGroq / analyzeWithMixtral / analyzeWithOllama
 *    are called identically — no changes needed in those service files
 *  - modelMode "manual", "all", "offline" still work exactly as before
 */

// Gemini removed as requested
import { analyzeWithGroq, analyzeWithMixtral } from "./groqService.js";
import { analyzeWithOllama } from "./ollamaService.js";
import { analyzeWithOpenRouter } from "./openRouterService.js";
import {
  routeModel,
  calculateCost,
  calculateSavings,
} from "./cascadeService.js";
import { loadMemory, saveMemory, buildMemoryContext } from "./memoryService.js";

// ─── Model caller map ─────────────────────────────────────────────────────────
const MODEL_FN = {
  groq: analyzeWithGroq,
  mixtral: analyzeWithMixtral,
  openrouter: analyzeWithOpenRouter,
  ollama: analyzeWithOllama,
};

// Fallback order if the cascade-selected model fails
const FALLBACK_ORDER = ["groq", "mixtral", "openrouter", "ollama"];

// ─── Main export ──────────────────────────────────────────────────────────────
export const smartAnalyze = async (code, language, options = {}) => {
  const {
    modelMode = "auto",
    selectedModel = "openrouter",
    offline = false,
    userId = null, // NEW — passed from analyze route
  } = options;

  const startTime = Date.now();

  // ── Offline mode (unchanged) ──────────────────────────────────────────────
  if (offline) {
    const result = await analyzeWithOllama(code, language);
    return enrichResult(result, "ollama", startTime, code, null);
  }

  // ── Load Hindsight memory ─────────────────────────────────────────────────
  let memoryData = { memories: [], rawMemories: [] };
  if (userId) {
    try {
      memoryData = await loadMemory(userId);
      console.log(
        `[Router] Loaded ${memoryData.memories.length} memories for: ${userId}`,
      );
    } catch (e) {
      console.warn("[Router] Memory load failed (non-fatal):", e.message);
    }
  }

  const memoryContext = buildMemoryContext(memoryData.memories);

  // ── Manual mode (unchanged, just adds memory) ─────────────────────────────
  if (modelMode === "manual") {
    const fn = MODEL_FN[selectedModel] || analyzeWithOpenRouter;
    const result = await fn(code, language, memoryContext);
    if (result.success) {
      await trySaveMemory(userId, result.data, language);
      return enrichResult(result, selectedModel, startTime, code, memoryData);
    }
    // fallback to Ollama if manual model fails
    const fallback = await analyzeWithOllama(code, language);
    return enrichResult(fallback, "ollama", startTime, code, memoryData);
  }

  // ── All/parallel mode (unchanged logic, adds memory) ─────────────────────
  if (modelMode === "all") {
    const [openrouter, groq, mixtral, ollama] = await Promise.allSettled([
      analyzeWithOpenRouter(code, language, memoryContext),
      analyzeWithGroq(code, language, memoryContext),
      analyzeWithMixtral(code, language, memoryContext),
      analyzeWithOllama(code, language),
    ]);
    const merged = crossValidate([openrouter, groq, mixtral, ollama]);
    await trySaveMemory(userId, merged.data, language);
    return enrichResult(merged, "all", startTime, code, memoryData);
  }

  // ── AUTO mode — CascadeFlow routing ──────────────────────────────────────
  const routing = routeModel(code, language);
  console.log(
    `[Cascade] Score: ${routing.complexityScore} → Model: ${routing.model} | ${routing.reason}`,
  );

  // Try the cascade-selected model first
  const primaryFn = MODEL_FN[routing.model];
  try {
    const primary = await primaryFn(code, language, memoryContext);
    if (primary.success) {
      await trySaveMemory(userId, primary.data, language);
      return enrichResult(
        primary,
        routing.model,
        startTime,
        code,
        memoryData,
        routing,
      );
    }
    console.log(
      `[Cascade] ${routing.model} failed, starting fallback chain...`,
    );
  } catch (e) {
    console.error(`[Cascade] ${routing.model} threw:`, e.message);
  }

  // Fallback chain (skip the already-tried model)
  for (const model of FALLBACK_ORDER) {
    if (model === routing.model) continue;
    try {
      const fn = MODEL_FN[model];
      const result = await fn(code, language, memoryContext);
      if (result.success) {
        console.log(`[Cascade] Fallback succeeded with: ${model}`);
        await trySaveMemory(userId, result.data, language);
        return enrichResult(result, model, startTime, code, memoryData, {
          ...routing,
          model,
          reason: `${routing.model} unavailable — fell back to ${model}`,
        });
      }
    } catch (e) {
      console.error(`[Cascade] ${model} threw:`, e.message);
    }
  }

  return { success: false, error: "All models failed to analyze." };
};

// ─── Result enricher ──────────────────────────────────────────────────────────
/**
 * Adds stats to every result object so the frontend stats bar
 * always has: usedModel, latency, cost, savings, complexityScore,
 * routingReason, memoryInsights
 */
const enrichResult = (
  result,
  model,
  startTime,
  code,
  memoryData,
  routing = null,
) => {
  if (!result.success) return result;

  const latency = Date.now() - startTime;
  const estimatedTokens = Math.ceil(code.length / 4);
  const cost = calculateCost(model, estimatedTokens);
  const savings = calculateSavings(model, estimatedTokens);

  return {
    ...result,
    usedModel: model,
    stats: {
      usedModel: model,
      latency,
      cost,
      savings,
      complexityScore: routing?.complexityScore ?? null,
      routingReason: routing?.reason ?? `Manual: ${model}`,
      estimatedTokens,
    },
    memoryInsights: memoryData?.memories || [],
    memorySessionCount: memoryData?.sessionCount || 0,
  };
};

// ─── Memory save (non-blocking) ───────────────────────────────────────────────
const trySaveMemory = async (userId, data, language) => {
  if (!userId || !data) return;
  try {
    await saveMemory(userId, data, language);
  } catch (e) {
    console.warn("[Router] Memory save failed (non-fatal):", e.message);
  }
};

// ─── Cross-validate (unchanged from original) ─────────────────────────────────
const crossValidate = (results) => {
  const successful = results
    .filter((r) => r.status === "fulfilled" && r.value.success)
    .map((r) => r.value.data);

  if (successful.length === 0)
    return { success: false, error: "All models failed" };
  if (successful.length === 1) {
    return {
      success: true,
      data: { ...successful[0], confidence: "low", modelsUsed: 1 },
    };
  }

  const avgScore = Math.round(
    successful.reduce((s, r) => s + r.score, 0) / successful.length,
  );
  const allIssues = successful.flatMap((r) => r.issues || []);
  const issueMap = {};
  allIssues.forEach((issue) => {
    const key = `${issue.line}-${issue.category}`;
    if (!issueMap[key]) issueMap[key] = { ...issue, count: 0 };
    issueMap[key].count++;
  });

  const mergedIssues = Object.values(issueMap).map((issue) => ({
    ...issue,
    confidence:
      issue.count >= 3 ? "high" : issue.count === 2 ? "medium" : "low",
  }));

  return {
    success: true,
    data: {
      score: avgScore,
      scores: successful[0].scores,
      issues: mergedIssues,
      optimizedCode: successful[0].optimizedCode,
      summary: successful[0].summary,
      usedModel: "all",
      modelsUsed: successful.length,
    },
  };
};

// Removed smartFixWithGemini export
