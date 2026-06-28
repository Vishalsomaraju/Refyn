/**
 * memoryService.js
 * Mnemo — Hindsight persistent memory integration
 *
 * Every time a user reviews code:
 *  1. BEFORE analysis  → load their memory (past patterns, recurring issues)
 *  2. AFTER analysis   → extract new patterns and save them back
 *
 * The memory panel in the frontend reads from getMemorySummary().
 * The analyze prompt gets enriched with past patterns so reviews get
 * smarter over time — this is the core demo story.
 */

const HINDSIGHT_BASE_URL = "https://api.hindsight.vectorize.io/v1/default/banks";
const MAX_MEMORIES_TO_INJECT = 5; // keep prompt injection short

import fs from 'fs';
import path from 'path';

const LOCAL_MEMORY_FILE = path.join(process.cwd(), 'hindsight_mock.json');

const hindsightFetch = async (endpointPath, options = {}) => {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  if (!apiKey) {
    console.warn("[Memory] HINDSIGHT_API_KEY not set — memory disabled");
    return null;
  }

  // Local fallback mock
  const pathParts = endpointPath.split('?')[0].split('/');
  const userId = decodeURIComponent(pathParts[1] || "");
  const action = pathParts[3] || "";

  try {
    const res = await fetch(`${HINDSIGHT_BASE_URL}${endpointPath}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Memory] Hindsight API failed (${err.message}). Falling back to local storage.`);
    
    // Read local memory
    let memoryDb = {};
    if (fs.existsSync(LOCAL_MEMORY_FILE)) {
      memoryDb = JSON.parse(fs.readFileSync(LOCAL_MEMORY_FILE, 'utf-8'));
    }

    if (action === 'retain') {
      const body = JSON.parse(options.body);
      if (!memoryDb[userId]) memoryDb[userId] = [];
      if (body.items) memoryDb[userId].push(...body.items);
      fs.writeFileSync(LOCAL_MEMORY_FILE, JSON.stringify(memoryDb, null, 2));
      return { success: true };
    } else {
      return {
        items: memoryDb[userId] || [],
        total: (memoryDb[userId] || []).length
      };
    }
  }
};

// ─── Load Memory ──────────────────────────────────────────────────────────────
/**
 * Loads all stored memories for a user.
 * Returns { memories: string[], rawMemories: object[] }
 *
 * memories → human-readable bullet points for the frontend panel
 * rawMemories → full objects for the prompt injection
 */
export const loadMemory = async (userId) => {
  if (!userId) return { memories: [], rawMemories: [] };

  const data = await hindsightFetch(`/${encodeURIComponent(userId)}/memories/recall`, {
    method: "POST",
    body: JSON.stringify({
      query: "recurring coding issues and patterns",
      limit: 20
    })
  });

  if (!data || !data.items) return { memories: [], rawMemories: [] };

  const memories = data.items.map((m) => m.content || m.text || m.summary || "");
  const filtered = memories.filter(Boolean);

  return {
    memories: filtered,
    rawMemories: data.items,
    sessionCount: data.total || filtered.length,
  };
};

// ─── Save Memory ──────────────────────────────────────────────────────────────
/**
 * Extracts patterns from analysis results and saves them to Hindsight.
 * Called AFTER a successful analysis.
 */
export const saveMemory = async (userId, analysisData, language) => {
  if (!userId || !analysisData) return;

  const patterns = extractPatterns(analysisData, language);
  if (patterns.length === 0) return;

  // Hindsight retain expects { items: [...] }
  const items = patterns.map((pattern) => ({
    content: pattern,
    tags: ["mnemo-code-review", language]
  }));

  try {
    await hindsightFetch(`/${encodeURIComponent(userId)}/memories/retain`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  } catch(e) {
    console.warn(`[Memory] retain error`, e);
  }
  console.log(`[Memory] Saved ${patterns.length} patterns for user: ${userId}`);
};

// ─── Pattern Extractor ────────────────────────────────────────────────────────
/**
 * Turns raw analysis output into memorable insight strings.
 * These are what show up in the memory panel.
 */
const extractPatterns = (analysisData, language) => {
  const patterns = [];
  const issues = analysisData.issues || [];

  if (!issues.length) return patterns;

  // Group issues by category
  const byCategory = {};
  issues.forEach((issue) => {
    const cat = issue.category || issue.type || "general";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(issue);
  });

  // Build pattern strings
  Object.entries(byCategory).forEach(([category, categoryIssues]) => {
    if (categoryIssues.length >= 1) {
      const example = categoryIssues[0];
      const desc = example.title || example.message || example.description || category;
      patterns.push(
        `In ${language}: recurring ${category} issue — "${desc}" (found ${categoryIssues.length}x in this session)`
      );
    }
  });

  // Score trend
  if (analysisData.score !== undefined) {
    patterns.push(
      `Code quality score: ${analysisData.score}/100 for ${language} (${new Date().toLocaleDateString()})`
    );
  }

  return patterns.slice(0, 4); // cap at 4 patterns per review
};

// ─── Memory Summary for Frontend ─────────────────────────────────────────────
/**
 * Returns a clean summary object ready for the React memory panel.
 * Call this after loadMemory() to format for the UI.
 */
export const getMemorySummary = (memories, userId) => {
  if (!memories || memories.length === 0) {
    return {
      userId,
      hasMemory: false,
      insights: [],
      message: "No patterns recorded yet. Start reviewing code to build your profile.",
    };
  }

  return {
    userId,
    hasMemory: true,
    insights: memories.slice(0, 8), // show max 8 in panel
    totalMemories: memories.length,
    message: `${memories.length} pattern${memories.length !== 1 ? "s" : ""} remembered across your sessions`,
  };
};

// ─── Prompt Enrichment ────────────────────────────────────────────────────────
/**
 * Injects past memory context into the AI prompt.
 * The model uses this to give more personalized, pattern-aware reviews.
 */
export const buildMemoryContext = (memories) => {
  if (!memories || memories.length === 0) return "";

  const top = memories.slice(0, MAX_MEMORIES_TO_INJECT);
  return `
DEVELOPER HISTORY (from past sessions — use this to personalize the review):
${top.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Pay special attention to these recurring patterns and flag them proactively if present.
`.trim();
};
