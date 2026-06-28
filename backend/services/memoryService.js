/**
 * memoryService.js (REWRITTEN for Refyn)
 *
 * Uses official @vectorize-io/hindsight-client SDK.
 * Memory bank: "refyn" (one bank for the whole app, userId scoped in content)
 *
 * Flow:
 *  BEFORE analysis → recall(userId query) → inject into prompt
 *  AFTER analysis  → retain(patterns) → saved to Hindsight
 */

import { HindsightClient } from "@vectorize-io/hindsight-client";

const MEMORY_BANK = "default"; // Hindsight memory bank name
const MAX_MEMORIES_TO_INJECT = 5;

// ─── Client singleton ─────────────────────────────────────────────────────────
let _client = null;

const getClient = () => {
  if (_client) return _client;
  const apiKey = process.env.HINDSIGHT_API_KEY;
  if (!apiKey) {
    console.warn("[Memory] HINDSIGHT_API_KEY not set — memory disabled");
    return null;
  }
  _client = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey,
  });
  return _client;
};

// ─── Load Memory ──────────────────────────────────────────────────────────────
/**
 * Recalls past patterns for a user before analysis.
 * Returns { memories: string[], sessionCount: number }
 */
export const loadMemory = async (userId) => {
  if (!userId) return { memories: [], sessionCount: 0 };
  const client = getClient();
  if (!client) return { memories: [], sessionCount: 0 };

  try {
    const results = await client.recall(
      MEMORY_BANK,
      `code review patterns and issues for developer ${userId}`,
    );

    const rawResults = results?.results || [];

    // results is an array of memory strings or objects
    const memories = rawResults
      .map((r) => (typeof r === "string" ? r : r.content || r.text || ""))
      .filter(Boolean);

    console.log(`[Memory] Recalled ${memories.length} memories for: ${userId}`);
    return { memories, sessionCount: memories.length };
  } catch (err) {
    console.warn("[Memory] Recall failed (non-fatal):", err.message);
    return { memories: [], sessionCount: 0 };
  }
};

// ─── Save Memory ──────────────────────────────────────────────────────────────
/**
 * Retains patterns from analysis results into Hindsight.
 * Called AFTER a successful analysis.
 */
export const saveMemory = async (userId, analysisData, language) => {
  if (!userId || !analysisData) return;
  const client = getClient();
  if (!client) return;

  const patterns = extractPatterns(analysisData, language, userId);
  if (patterns.length === 0) return;

  try {
    // Retain all patterns as one memory entry per review session
    const memoryText = patterns.join(" | ");
    await client.retain(MEMORY_BANK, memoryText);
    console.log(`[Memory] Retained ${patterns.length} patterns for: ${userId}`);
  } catch (err) {
    console.warn("[Memory] Retain failed (non-fatal):", err.message);
  }
};

// ─── Pattern Extractor ────────────────────────────────────────────────────────
const extractPatterns = (analysisData, language, userId) => {
  const patterns = [];
  const issues = analysisData.issues || [];

  if (!issues.length && analysisData.score === undefined) return patterns;

  // Group by category
  const byCategory = {};
  issues.forEach((issue) => {
    const cat = issue.category || issue.type || "general";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(issue);
  });

  Object.entries(byCategory).forEach(([category, categoryIssues]) => {
    const example = categoryIssues[0];
    const desc = example.title || example.message || category;
    patterns.push(
      `Developer ${userId} has recurring ${category} issue in ${language}: "${desc}" (${categoryIssues.length}x)`,
    );
  });

  if (analysisData.score !== undefined) {
    patterns.push(
      `Developer ${userId} scored ${analysisData.score}/100 on ${language} code review on ${new Date().toLocaleDateString()}`,
    );
  }

  return patterns.slice(0, 4);
};

// ─── Memory Summary for Frontend ─────────────────────────────────────────────
export const getMemorySummary = (memories, userId) => {
  if (!memories || memories.length === 0) {
    return {
      userId,
      hasMemory: false,
      insights: [],
      message:
        "No patterns recorded yet. Start reviewing code to build your profile.",
    };
  }

  return {
    userId,
    hasMemory: true,
    insights: memories.slice(0, 8),
    totalMemories: memories.length,
    message: `${memories.length} pattern${memories.length !== 1 ? "s" : ""} remembered across your sessions`,
  };
};

// ─── Prompt Enrichment ────────────────────────────────────────────────────────
export const buildMemoryContext = (memories) => {
  if (!memories || memories.length === 0) return "";

  const top = memories.slice(0, MAX_MEMORIES_TO_INJECT);
  return `
DEVELOPER HISTORY (from past sessions — use this to personalize the review):
${top.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Pay special attention to these recurring patterns and flag them proactively if present.
`.trim();
};
