import { buildReviewPrompt } from "../prompts/reviewPrompt.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// ── Robust JSON extractor ─────────────────────────────────────────────────────
// Doesn't rely on the model stripping markdown — finds the first { and last }
const parseJSON = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON object found in model response. Raw: ${text.slice(0, 200)}`,
    );
  }

  const jsonStr = text.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Second attempt: remove control characters that sometimes sneak in
    const cleaned = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, " ") // strip control chars
      .replace(/,\s*}/g, "}") // trailing commas in objects
      .replace(/,\s*]/g, "]"); // trailing commas in arrays
    return JSON.parse(cleaned);
  }
};

// ── Main analysis ─────────────────────────────────────────────────────────────
export const analyzeWithOllama = async (code, language) => {
  try {
    const prompt = buildReviewPrompt(code, language);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder",
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 4096, // bumped — 2048 can truncate large responses
          top_p: 0.9,
          repeat_penalty: 1.1,
        },
      }),
      // Removed signal to prevent timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();

    // Log raw output during development so you can see exactly what Ollama returns
    console.log(
      "[OllamaService] raw response preview:",
      result.response?.slice(0, 300),
    );

    if (!result.response) {
      throw new Error("Ollama returned empty response field");
    }

    const data = parseJSON(result.response);

    // Sanity-check the parsed object has the fields we expect
    if (typeof data.score === "undefined" || !Array.isArray(data.issues)) {
      throw new Error(
        `Parsed JSON missing required fields. Keys found: ${Object.keys(data).join(", ")}`,
      );
    }

    return { success: true, data, usedModel: "ollama" };
  } catch (error) {
    console.error(`[OllamaService] analyze failed for ${language}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ── Smart fix ─────────────────────────────────────────────────────────────────
export const smartFixWithOllama = async (code, language, issues) => {
  try {
    const { buildSmartFixPrompt } =
      await import("../prompts/smartFixPrompt.js");
    const prompt = buildSmartFixPrompt(code, language, issues);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder",
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 4096 },
      }),
      // Removed signal to prevent timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    console.log(
      "[OllamaService] smartfix raw preview:",
      result.response?.slice(0, 300),
    );

    if (!result.response) throw new Error("Ollama returned empty response");

    const data = parseJSON(result.response);
    return { success: true, data, usedModel: "ollama" };
  } catch (error) {
    console.error(`[OllamaService] smartfix failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatWithOllama = async (messages) => {
  try {
    // Chat uses /api/chat endpoint with messages array format
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder",
        messages,
        stream: false,
        options: { temperature: 0.3, num_predict: 1024 },
      }),
      // Removed signal to prevent timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const content = result.message?.content;

    if (!content) throw new Error("Ollama chat returned empty message content");

    return { success: true, content, usedModel: "ollama" };
  } catch (error) {
    console.error(`[OllamaService] chat failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// ── Status check ──────────────────────────────────────────────────────────────
export const checkOllamaStatus = async () => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      // Removed signal to prevent timeout
    });

    if (!response.ok) return { online: false, hasQwen: false };

    const data = await response.json();
    const hasQwen = data.models?.some((m) =>
      m.name.toLowerCase().includes("qwen2.5-coder"),
    );

    return { online: true, hasQwen, models: data.models?.map((m) => m.name) };
  } catch {
    return { online: false, hasQwen: false };
  }
};
