import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import { analyzeWithGemini } from './services/geminiService.js';
import { analyzeWithOllama } from './services/ollamaService.js';

const code = "console.log('test');";
const language = "javascript";

async function run() {
  const outputs = [];
  
  try {
    const gem = await analyzeWithGemini(code, language);
    outputs.push("Gemini Result: " + JSON.stringify(gem));
  } catch(e) {
    outputs.push("Gemini Caught Error: " + e.message);
  }
  
  try {
    const oll = await analyzeWithOllama(code, language);
    outputs.push("Ollama Result: " + JSON.stringify(oll));
  } catch(e) {
    outputs.push("Ollama Caught Error: " + e.message);
  }
  
  fs.writeFileSync('api_errors.txt', outputs.join('\n\n'));
}

run();
