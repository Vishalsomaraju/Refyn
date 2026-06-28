/**
 * openRouterService.js (NEW for Refyn)
 * 
 * OpenRouter as backup when Groq fails.
 * Uses free-tier models — no credit burn.
 * Same response shape as groqService.js — drop-in compatible.
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Free models on OpenRouter (no credit required)
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "google/gemma-4-31b-it:free"
];

const parseJSON = (text) => {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ||
                  text.match(/```\s*([\s\S]*?)```/) ||
                  text.match(/(\{[\s\S]*\})/);
    return JSON.parse(match ? match[1] : text);
  } catch {
    return null;
  }
};

const callOpenRouter = async (prompt, model) => {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://refyn.dev",
      "X-Title": "Refyn Code Review",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

export const analyzeWithOpenRouter = async (code, language, memoryContext = "") => {
  if (!process.env.OPENROUTER_API_KEY) {
    return { success: false, error: "OpenRouter API key not set" };
  }

  const prompt = `
You are an expert code reviewer. Analyze the following ${language} code and return ONLY a JSON object.

${memoryContext ? `DEVELOPER HISTORY:\n${memoryContext}\n` : ""}

Code to review:
\`\`\`${language}
${code}
\`\`\`

Return ONLY this JSON structure, no other text:
{
  "score": <0-100>,
  "breakdown": {
    "security": <0-100>,
    "bugs": <0-100>,
    "performance": <0-100>,
    "quality": <0-100>
  },
  "issues": [
    {
      "id": "issue_1",
      "title": "<short title>",
      "severity": "<CRITICAL|WARNING|INFO>",
      "category": "<security|bugs|performance|quality>",
      "line": <line number>,
      "description": "<what is wrong>",
      "fix": "<how to fix it>"
    }
  ],
  "optimizedCode": "<full improved version of the code>",
  "summary": "<2-3 sentence overall assessment>"
}`;

  // Try free models in order
  for (const model of FREE_MODELS) {
    try {
      console.log(`[OpenRouter] Trying model: ${model}`);
      const raw = await callOpenRouter(prompt, model);
      const parsed = parseJSON(raw);

      if (!parsed || typeof parsed.score !== "number") {
        console.warn(`[OpenRouter] ${model} returned unparseable response`);
        continue;
      }

      console.log(`[OpenRouter] Success with ${model}`);
      return { success: true, data: { ...parsed, usedModel: `openrouter/${model}` } };
    } catch (err) {
      console.warn(`[OpenRouter] ${model} failed: ${err.message}`);
    }
  }

  return { success: false, error: "All OpenRouter models failed" };
};

export const fixWithOpenRouter = async (systemPrompt, userPrompt) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not set");
  }

  // Try free models in order
  for (const model of FREE_MODELS) {
    try {
      console.log(`[OpenRouter Fix] Trying model: ${model}`);
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://refyn.dev",
          "X-Title": "Refyn Code Review",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      
      if (text?.trim()) {
        console.log(`[OpenRouter Fix] Success with ${model}`);
        return { fixedCode: text, usedModel: `openrouter` };
      }
    } catch (err) {
      console.warn(`[OpenRouter Fix] ${model} failed: ${err.message}`);
    }
  }

  throw new Error("All OpenRouter models failed for fix");
};
