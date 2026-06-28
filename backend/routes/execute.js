/**
 * execute.js route (UPDATED for Refyn)
 *
 * Execution chain:
 *   OFFLINE mode  → local runner only
 *   ONLINE mode   → Piston → Judge0 → local runner
 *
 * Response shape is identical to the original — frontend needs zero changes.
 */

import express from "express";
import {
  runWithPiston,
  runWithJudge0,
  runLocally,
} from "../services/judge0Service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { code, language = "python", stdin = "", offline = false } = req.body;

  console.log(
    `[Execute] language: ${language} | length: ${code?.length} | offline: ${offline}`,
  );

  if (!code?.trim()) {
    return res.json({
      status: "error",
      output: "",
      stderr: "No code provided",
      time: null,
    });
  }

  // ── Offline: local only ───────────────────────────────────────────────────
  if (offline) {
    console.log("[Execute] Offline mode — running locally");
    const result = await runLocally(code, language, stdin);
    console.log(
      `[Execute] Local result: ${result.status} via ${result.runner}`,
    );
    return res.json(result);
  }

  // ── 1. Try Piston (primary) ───────────────────────────────────────────────
  try {
    const result = await runWithPiston(code, language, stdin);
    console.log(`[Execute] Piston success — status: ${result.status}`);
    return res.json(result);
  } catch (err) {
    console.warn(`[Execute] Piston failed: ${err.message} — trying Judge0...`);
  }

  // ── 2. Try Judge0 (backup) ────────────────────────────────────────────────
  try {
    const result = await runWithJudge0(code, language, stdin);
    console.log(`[Execute] Judge0 success — status: ${result.status}`);
    return res.json(result);
  } catch (err) {
    console.warn(
      `[Execute] Judge0 failed: ${err.message} — falling back to local...`,
    );
  }

  // ── 3. Local runner (last resort) ────────────────────────────────────────
  const result = await runLocally(code, language, stdin);
  console.log(`[Execute] Local runner result: ${result.status}`);
  return res.json(result);
});

export default router;
