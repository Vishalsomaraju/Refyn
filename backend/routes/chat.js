import express from "express";

import { chatWithGroq, chatWithMixtral } from "../services/groqService.js";
import { chatWithOllama } from "../services/ollamaService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { code, language, analysis, messages, offline } = req.body;
  if (!code || !messages) {
    return res
      .status(400)
      .json({ success: false, error: "code and messages are required" });
  }
  if (code.length > 50000) {
    return res
      .status(400)
      .json({ success: false, error: "Code too long (max 50,000 chars)" });
  }
  if (messages.length > 50) {
    return res
      .status(400)
      .json({ success: false, error: "Too many messages in history (max 50)" });
  }

  try {
    let result = { success: false };

    // ─── Offline mode: Ollama only ───
    if (offline) {
      const systemMsg = {
        role: "system",
        content: `You are a helpful AI code mentor. The user's ${language} code scored ${analysis?.score || '?'}/100. Answer questions about their code concisely. Reference line numbers when relevant.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
      };
      result = await chatWithOllama([systemMsg, ...messages]);
      if (result.success && result.content) {
        result = { success: true, data: { reply: result.content } };
      }
    }

    // ─── Online: Full 4-model cascade fallback ───
    if (!result.success && !offline) {

      // 2) Try Groq (Llama 3)
      console.log("[Chat] Trying Groq Llama...");
      result = await chatWithGroq(code, language, analysis || {}, messages);
    }

    if (!result.success && !offline) {
      // 3) Try Mixtral
      console.log("[Chat] Groq failed, trying Mixtral...");
      result = await chatWithMixtral(code, language, analysis || {}, messages);
    }

    if (!result.success) {
      // 4) Final fallback: Ollama (local)
      console.log("[Chat] All cloud models failed. Fallback to Ollama...");
      const systemMsg = {
        role: "system",
        content: `You are a helpful AI code mentor. The user's ${language} code scored ${analysis?.score || '?'}/100. Answer questions about their code concisely.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
      };
      result = await chatWithOllama([systemMsg, ...messages]);
      if (result.success && result.content) {
        result = { success: true, data: { reply: result.content } };
      }
    }

    if (!result.success) {
      return res
        .status(500)
        .json({ success: false, error: "Chat failed on all available models." });
    }

    // Normalize response shape
    const reply = result.data?.reply || result.content || "No response";
    res.json({ success: true, data: { reply } });
  } catch (error) {
    console.error("[Chat Route] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
