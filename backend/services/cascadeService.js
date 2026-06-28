/**
 * cascadeService.js
 * Mnemo — CascadeFlow-inspired intelligent routing layer
 *
 * Replaces the dumb waterfall in aiRouter.js with a complexity-aware
 * routing system. Simple code → cheap/fast model. Complex security/logic
 * bugs → Gemini quality gate. Saves cost, fixes the rate-limit problem.
 */

// ─── Model cost per 1k tokens (approx) ───────────────────────────────────────
const MODEL_COSTS = {
  groq: 0.00002, // llama3-70b
  mixtral: 0.000024, // mixtral-8x7b
  openrouter: 0.00002,
  ollama: 0.0, // local = free
};

// ─── Complexity Scorer ────────────────────────────────────────────────────────
/**
 * Scores code complexity from 0-100.
 * This runs BEFORE the model call so we pick the right model cheaply.
 */
export const scoreComplexity = (code, language) => {
  let score = 0;
  const lines = code.split("\n").length;
  const len = code.length;

  // Length signals
  if (lines > 200) score += 30;
  else if (lines > 100) score += 20;
  else if (lines > 50) score += 10;
  else score += 5;

  // Security-sensitive patterns — always escalate
  const securityPatterns = [
    /eval\s*\(/,
    /exec\s*\(/,
    /subprocess/,
    /os\.system/,
    /child_process/,
    /dangerouslySetInnerHTML/,
    /innerHTML\s*=/,
    /SQL|mysql|postgres|sqlite/i,
    /password|secret|token|apikey|api_key/i,
    /\.env/,
    /crypto\./,
    /jwt/i,
    /auth/i,
  ];
  const securityHits = securityPatterns.filter((p) => p.test(code)).length;
  score += securityHits * 8;

  // Complexity patterns
  const complexPatterns = [
    /async\s+function|await\s+/g,
    /Promise\./g,
    /class\s+\w+/g,
    /try\s*{[\s\S]*?catch/g,
    /\brecursi/gi,
    /\bO\(n[²2^]|\bO\(2\^n/g, // algorithmic complexity hints
  ];
  complexPatterns.forEach((p) => {
    const matches = (code.match(p) || []).length;
    score += matches * 3;
  });

  // Multi-file / import density
  const importCount = (code.match(/^(import|require|from)\s/gm) || []).length;
  score += importCount * 2;

  return Math.min(score, 100);
};

// ─── Route Decision ───────────────────────────────────────────────────────────
/**
 * Returns { model, reason, complexityScore, estimatedCost }
 * based on complexity score and current availability.
 */
export const routeModel = (
  code,
  language,
  availableModels = ["groq", "mixtral", "openrouter", "ollama"],
) => {
  const complexityScore = scoreComplexity(code, language);
  const linesOfCode = code.split("\n").length;
  const estimatedTokens = Math.ceil(code.length / 4);

  let model, reason;

  // Routing tiers
  if (complexityScore >= 60) {
    // High complexity → Mixtral for thorough analysis
    model = availableModels.includes("mixtral") ? "mixtral" : "groq";
    reason =
      complexityScore >= 80
        ? "Security-sensitive or highly complex code — routing to Mixtral for deep analysis"
        : "Moderate-to-high complexity — Mixtral selected for accuracy";
  } else if (complexityScore >= 30) {
    // Medium complexity → Groq (fast, good enough)
    model = availableModels.includes("groq") ? "groq" : "openrouter";
    reason = "Medium complexity — Groq selected for speed/cost balance";
  } else {
    // Simple code → cheapest available
    model = availableModels.includes("groq")
      ? "groq"
      : availableModels.includes("mixtral")
        ? "mixtral"
        : "openrouter";
    reason = "Simple code — using fastest/cheapest model";
  }

  const estimatedCost = (estimatedTokens / 1000) * (MODEL_COSTS[model] || 0);

  return {
    model,
    reason,
    complexityScore,
    estimatedCost: parseFloat(estimatedCost.toFixed(6)),
    estimatedTokens,
    linesOfCode,
  };
};

// ─── Cost Tracker ─────────────────────────────────────────────────────────────
/**
 * Calculates actual cost after a model call completes.
 * Pass in the model name and rough token count.
 */
export const calculateCost = (model, tokens) => {
  const rate = MODEL_COSTS[model] || 0;
  return parseFloat(((tokens / 1000) * rate).toFixed(6));
};

/**
 * Compares what a premium model would have cost
 * vs what CascadeFlow routing actually cost.
 * Returns savings as a percentage string.
 */
export const calculateSavings = (actualModel, tokens) => {
  const actualCost = calculateCost(actualModel, tokens);
  const baselineCost = (tokens / 1000) * 0.000075; // premium cost baseline
  if (baselineCost === 0) return "0%";
  const savings = ((baselineCost - actualCost) / baselineCost) * 100;
  return `${Math.round(Math.max(savings, 0))}%`;
};
