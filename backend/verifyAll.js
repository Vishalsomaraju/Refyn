import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from 'fs';

dotenv.config();

async function runTests() {
  const results = {
    gemini: { status: 'Untested', detail: '' },
    groq: { status: 'Untested', detail: '' },
    ollama: { status: 'Untested', detail: '' },
    judge0_rapid: { status: 'Untested', detail: '' },
    judge0_local: { status: 'Untested', detail: '' }
  };

  console.log("--- Starting API Key & Service Verification ---");

  // 1. Gemini
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('AIzaSyApknR03T2f')) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const res = await model.generateContent("Say 'Gemini OK'");
      results.gemini = { status: 'VALID', detail: res.response.text() };
    } catch (e) {
      results.gemini = { status: 'INVALID', detail: e.message };
    }
  } else {
    results.gemini = { status: 'INVALID', detail: 'Placeholder key detected' };
  }

  // 2. Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const res = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Say 'Groq OK'" }],
        model: "llama-3.3-70b-versatile",
      });
      results.groq = { status: 'VALID', detail: res.choices[0].message.content };
    } catch (e) {
      results.groq = { status: 'INVALID', detail: e.message };
    }
  } else {
    results.groq = { status: 'INVALID', detail: 'No key in .env' };
  }

  // 3. Ollama (Local)
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const res = await axios.get(`${ollamaUrl}/api/tags`);
    results.ollama = { status: 'RUNNING', detail: `Models found: ${res.data.models?.map(m => m.name).join(', ')}` };
  } catch (e) {
    results.ollama = { status: 'NOT RUNNING', detail: e.message };
  }

  // 4. Judge0 (Local only — no cloud API)
  results.judge0_rapid = { status: 'SKIPPED', detail: 'Using local instance only' };

  // 5. Judge0 (Local)
  const judgeUrl = process.env.JUDGE0_URL || 'http://localhost:2358';
  try {
    const res = await axios.get(`${judgeUrl}/about`);
    results.judge0_local = { status: 'RUNNING', detail: `Version: ${res.data.version}` };
  } catch (e) {
    results.judge0_local = { status: 'NOT RUNNING', detail: `Connection failed at ${judgeUrl}` };
  }

  const output = JSON.stringify(results, null, 2);
  console.log(output);
  fs.writeFileSync('all_checks.txt', output);
  console.log("\n--- Verification Complete - Results saved to all_checks.txt ---");
}

runTests();
