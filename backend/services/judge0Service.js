/**
 * judge0Service.js (UPDATED for Refyn)
 *
 * Execution priority:
 *   1. Piston API  — free, no key, 50+ languages, works in production
 *   2. Judge0      — backup only (local Docker or paid cloud)
 *   3. Local runner — last resort for Python + JS only
 *
 * Nothing in the route needs to change — same exports, same shape.
 */

import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { exec } from "child_process";

// ─── Config ───────────────────────────────────────────────────────────────────
const PISTON_BASE = "https://emkc.org/api/v2/piston";
const JUDGE0_BASE = process.env.JUDGE0_URL || "http://localhost:2358";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Language maps ────────────────────────────────────────────────────────────

// Piston language identifiers (name + version)
// Full list: https://emkc.org/api/v2/piston/runtimes
export const PISTON_LANGUAGES = {
  python: { language: "python", version: "3.10.0" },
  python3: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  js: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  ts: { language: "typescript", version: "5.0.3" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
  "c++": { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" },
  golang: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.50.0" },
  php: { language: "php", version: "8.2.3" },
  ruby: { language: "ruby", version: "3.0.1" },
  kotlin: { language: "kotlin", version: "1.8.20" },
  swift: { language: "swift", version: "5.3.3" },
  bash: { language: "bash", version: "5.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  cs: { language: "csharp", version: "6.12.0" },
};

// Judge0 language IDs (backup)
export const JUDGE0_LANGUAGE_IDS = {
  python: 71,
  python3: 71,
  javascript: 63,
  js: 63,
  typescript: 74,
  ts: 74,
  java: 62,
  cpp: 54,
  "c++": 54,
  c: 50,
  go: 60,
  golang: 60,
  rust: 73,
  php: 68,
  csharp: 51,
  cs: 51,
  "c#": 51,
  ruby: 72,
  kotlin: 78,
  swift: 83,
  bash: 46,
};

// Local fallback — only Python + JS without extra setup
const LOCAL_RUNNERS = {
  python: (f) => `python "${f}"`,
  python3: (f) => `python "${f}"`,
  javascript: (f) => `node "${f}"`,
  js: (f) => `node "${f}"`,
};
const LOCAL_EXTENSIONS = {
  python: "py",
  python3: "py",
  javascript: "js",
  js: "js",
};

// ─── 1. Piston (primary) ──────────────────────────────────────────────────────
export const runWithPiston = async (code, language, stdin = "") => {
  const lang = language?.toLowerCase();
  const pistonLang = PISTON_LANGUAGES[lang];

  if (!pistonLang) {
    throw new Error(`Piston: unsupported language "${language}"`);
  }

  const res = await fetch(`${PISTON_BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: pistonLang.language,
      version: pistonLang.version,
      files: [{ content: code }],
      stdin: stdin || "",
      run_timeout: 5000, // 5s execution limit
      compile_timeout: 10000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Piston HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Piston returns { run: { stdout, stderr, code, signal } }
  const run = data.run || {};
  const compile = data.compile || {};

  const hasError = run.code !== 0 || !!compile.stderr;
  const output = [compile.stdout, run.stdout]
    .filter((x) => x?.trim())
    .join("\n")
    .trim();
  const stderr = [compile.stderr, run.stderr]
    .filter((x) => x?.trim())
    .join("\n")
    .trim();

  return {
    status: hasError ? "error" : "success",
    output,
    stderr,
    time: null, // Piston doesn't return execution time
    runner: "piston",
  };
};

// ─── 2. Judge0 (backup) ───────────────────────────────────────────────────────
export const runWithJudge0 = async (code, language, stdin = "") => {
  const lang = language?.toLowerCase();
  const langId = JUDGE0_LANGUAGE_IDS[lang] || 71;

  const submitRes = await fetch(
    `${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: code,
        language_id: langId,
        stdin: stdin || "",
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
    },
  );

  if (!submitRes.ok)
    throw new Error(`Judge0 submit failed: ${submitRes.status}`);
  const { token } = await submitRes.json();
  if (!token) throw new Error("Judge0: no token returned");

  // Poll for result
  for (let i = 0; i < 15; i++) {
    await sleep(800);
    const poll = await fetch(
      `${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`,
    );
    const data = await poll.json();

    if (!data.status_id || data.status_id <= 2) continue; // still processing
    if (data.status_id === 13)
      throw new Error("Judge0 internal error — workers down");

    const success = data.status_id === 3;
    return {
      status: success ? "success" : "error",
      output:
        [data.stdout, data.compile_output]
          .filter((x) => x?.trim())
          .join("\n")
          .trim() || "",
      stderr:
        [data.stderr, !success ? data.status?.description : null]
          .filter((x) => x?.trim())
          .join("\n")
          .trim() || "",
      time: data.time ? parseFloat(data.time).toFixed(2) : null,
      runner: "judge0",
    };
  }

  throw new Error("Judge0: polling timeout");
};

// ─── 3. Local runner (last resort) ───────────────────────────────────────────
export const runLocally = (code, language, stdin = "") => {
  return new Promise((resolve) => {
    const lang = language?.toLowerCase();
    const runner = LOCAL_RUNNERS[lang];
    const ext = LOCAL_EXTENSIONS[lang];

    if (!runner || !ext) {
      return resolve({
        status: "error",
        output: "",
        stderr: `Local execution not supported for "${language}". Only Python and JavaScript work locally.`,
        time: null,
        runner: "local",
      });
    }

    const tmpFile = join(tmpdir(), `refyn_${Date.now()}.${ext}`);
    try {
      writeFileSync(tmpFile, code, "utf8");
    } catch (e) {
      return resolve({
        status: "error",
        output: "",
        stderr: `Cannot write temp file: ${e.message}`,
        time: null,
        runner: "local",
      });
    }

    const start = Date.now();
    const child = exec(
      runner(tmpFile),
      { timeout: 8000, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        try {
          unlinkSync(tmpFile);
        } catch {}

        resolve({
          status: err && !stdout ? "error" : "success",
          output: stdout?.trim() || "",
          stderr: stderr?.trim() || err?.message || "",
          time: elapsed,
          runner: "local",
        });
      },
    );

    if (stdin) {
      child.stdin?.write(stdin);
      child.stdin?.end();
    }
  });
};
