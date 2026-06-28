import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from 'fs';

dotenv.config();

const results = [];

async function log(msg) {
  console.log(msg);
  results.push(msg);
}

async function checkCloud() {
  log("--- CLOUD SERVICES ---");
  
  // Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const res = await model.generateContent("Say 'TEST'");
      log(`[PASS] Gemini: ${res.response.text().trim()}`);
    } catch (e) {
      log(`[FAIL] Gemini: ${e.message}`);
    }
  } else {
    log("[SKIP] Gemini: No key");
  }

  // Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const res = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Say 'TEST'" }],
        model: "llama-3.3-70b-versatile",
      });
      log(`[PASS] Groq: ${res.choices[0].message.content.trim()}`);
    } catch (e) {
      log(`[FAIL] Groq: ${e.message}`);
    }
  } else {
    log("[SKIP] Groq: No key");
  }

  // Judge0 (Local only — no cloud API)
  log("[SKIP] Judge0 (Cloud): Using local instance only");
}

async function checkLocal() {
  log("\n--- LOCAL SERVICES ---");
  
  // Ollama
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  try {
    const res = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 3000 });
    const models = res.data.models?.map(m => m.name) || [];
    log(`[PASS] Ollama: Running. Models: ${models.join(', ')}`);
  } catch (e) {
    log(`[FAIL] Ollama: ${e.message}`);
  }

  // Judge0 (Local)
  const judgeUrl = process.env.JUDGE0_URL || 'http://localhost:2358';
  try {
    const res = await axios.get(`${judgeUrl}/about`, { timeout: 3000 });
    log(`[PASS] Judge0 (Local): Running at ${judgeUrl}. Version: ${res.data.version}`);
  } catch (e) {
    log(`[FAIL] Judge0 (Local): ${e.message} — is it running at ${judgeUrl}?`);
  }
}

async function run() {
  await checkCloud();
  await checkLocal();
  fs.writeFileSync('final_check.txt', results.join('\n'));
}

run();
