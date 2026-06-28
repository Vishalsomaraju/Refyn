import express from "express";

import Groq from "groq-sdk";

const router = express.Router();


const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Strip markdown fences if AI wraps code in them
function extractCode(text) {
  if (!text) return "";
  const fenced = text.match(/```(?:\w*)\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

// ── Sequential cascade: Llama → Mixtral → Ollama ──
// Priority per project spec. Ollama is always the last resort.
async function cascadeFix(systemPrompt, userPrompt, offline = false) {
  const errors = [];

  // 2. Groq Llama 3.3 70B — secondary (skip if offline)
  if (!offline && groq) {
    try {
      console.log("[SmartFix] trying Llama 3.3 70B...");
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });
      const text = result.choices[0]?.message?.content;
      if (text?.trim()) {
        console.log("[SmartFix] ✓ Llama responded");
        return { fixedCode: extractCode(text), usedModel: "llama" };
      }
    } catch (e) {
      console.warn("[SmartFix] ✗ Llama failed:", e.message);
      errors.push("Llama: " + e.message);
    }
  }

  // 3. Groq Mixtral 8x7B — tertiary (skip if offline)
  if (!offline && groq) {
    try {
      console.log("[SmartFix] trying Mixtral 8x7B...");
      const result = await groq.chat.completions.create({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });
      const text = result.choices[0]?.message?.content;
      if (text?.trim()) {
        console.log("[SmartFix] ✓ Mixtral responded");
        return { fixedCode: extractCode(text), usedModel: "mixtral" };
      }
    } catch (e) {
      console.warn("[SmartFix] ✗ Mixtral failed:", e.message);
      errors.push("Mixtral: " + e.message);
    }
  }

  // 4. Ollama — always available, last resort, works offline
  try {
    console.log("[SmartFix] trying Ollama (last resort)...");
    const res = await fetch(
      `${process.env.OLLAMA_URL || "http://localhost:11434"}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5-coder:latest",
          prompt: systemPrompt + "\n\n" + userPrompt,
          stream: false,
          options: { num_predict: 4096, temperature: 0.1 },
        }),
      },
    );
    const data = await res.json();
    if (data.response?.trim()) {
      console.log("[SmartFix] ✓ Ollama responded");
      return { fixedCode: extractCode(data.response), usedModel: "ollama" };
    }
  } catch (e) {
    console.warn("[SmartFix] ✗ Ollama failed:", e.message);
    errors.push("Ollama: " + e.message);
  }

  // All failed
  throw new Error("All models failed:\n" + errors.join("\n"));
}

// ── Route: POST /api/smartfix ──
router.post("/", async (req, res) => {
  const { code, language = "python", issue, offline = false } = req.body;

  console.log(
    "[SmartFix] issue:",
    issue?.title,
    "| lang:",
    language,
    "| offline:",
    offline,
  );

  if (!code?.trim()) return res.status(400).json({ error: "No code provided" });
  if (!issue) return res.status(400).json({ error: "No issue provided" });

  const systemPrompt = `You are an expert ${language} developer fixing a specific bug.
Return ONLY the complete corrected code.
No explanations. No markdown fences. No comments about what changed.
Just the raw code, complete and runnable from first line to last.`;

  const userPrompt = `Fix this issue in my code:

ISSUE: ${issue.title}
SEVERITY: ${issue.severity || "WARNING"}
${issue.line ? `LINE: ${issue.line}` : ""}
DESCRIPTION: ${issue.description || ""}
${issue.fix ? `HOW TO FIX: ${issue.fix}` : ""}

FULL CODE TO FIX:
${code}

Return the complete fixed code only. Start immediately with the code.`;

  const start = Date.now();
  try {
    const result = await cascadeFix(systemPrompt, userPrompt, offline);
    const elapsed = Date.now() - start;
    console.log(
      `[SmartFix] done in ${elapsed}ms via ${result.usedModel}, length=${result.fixedCode?.length}`,
    );
    return res.json(result);
  } catch (err) {
    console.error("[SmartFix] all models failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
