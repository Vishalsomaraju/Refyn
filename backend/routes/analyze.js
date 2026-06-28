/**
 * analyze.js route (UPDATED for Mnemo)
 *
 * Only change from original: accepts userId in request body
 * and passes it through to smartAnalyze so memory works.
 * Response now includes stats + memoryInsights from aiRouter.
 */

import express from "express";
import { smartAnalyze } from "../services/aiRouter.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { code, language, modelMode, selectedModel, offline, userId } =
    req.body;

  if (!code || !language) {
    return res
      .status(400)
      .json({ success: false, error: "code and language are required" });
  }
  if (code.length > 50000) {
    return res
      .status(400)
      .json({ success: false, error: "Code too long (max 50,000 chars)" });
  }

  try {
    const result = await smartAnalyze(code, language, {
      modelMode,
      selectedModel,
      offline,
      userId: userId || null, // pass through — memory is no-op if null
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Analysis failed. Please try again.",
      });
    }

    res.json({
      success: true,
      data: {
        analysis: result.data,
        usedModel: result.usedModel || result.data?.usedModel || "unknown",
        stats: result.stats || null, // for frontend stats bar
        memoryInsights: result.memoryInsights || [], // for memory panel
        memorySessionCount: result.memorySessionCount || 0,
      },
    });
  } catch (error) {
    console.error("[Analyze Route] Uncaught error:", error.message);
    res.status(500).json({
      success: false,
      error: "Analysis failed unexpectedly: " + error.message,
    });
  }
});

export default router;
