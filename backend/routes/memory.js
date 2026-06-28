/**
 * memory.js route (NEW for Mnemo)
 *
 * Exposes Hindsight memory to the frontend.
 * The memory panel calls GET /api/memory/:userId on page load
 * to show what the system remembers about this user.
 */

import express from "express";
import { loadMemory, getMemorySummary } from "../services/memoryService.js";

const router = express.Router();

// GET /api/memory/:userId
// Returns memory summary for the memory panel
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId.trim().length < 2) {
    return res.status(400).json({ success: false, error: "Invalid userId" });
  }

  try {
    const { memories, sessionCount } = await loadMemory(userId);
    const summary = getMemorySummary(memories, userId);

    res.json({
      success: true,
      data: {
        ...summary,
        sessionCount: sessionCount || 0,
      },
    });
  } catch (error) {
    console.error("[Memory Route] Error:", error.message);
    // Return empty memory on error — don't break the UI
    res.json({
      success: true,
      data: getMemorySummary([], userId),
    });
  }
});

export default router;
