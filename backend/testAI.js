import { smartAnalyze } from './services/aiRouter.js';
import dotenv from 'dotenv';
dotenv.config();

const code = `
function add(a, b) {
  return a + b;
}
`;

import fs from 'fs';

async function test() {
  console.log("Testing smartAnalyze...");
  try {
    const result = await smartAnalyze(code, "javascript", { modelMode: "auto" });
    fs.writeFileSync('output.txt', JSON.stringify(result, null, 2));
  } catch(e) {
    fs.writeFileSync('output.txt', e.toString());
  }
}

test();
