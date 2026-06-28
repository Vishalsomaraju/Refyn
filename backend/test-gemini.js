import dotenv from 'dotenv';
dotenv.config();
import { smartFixWithGemini } from './services/geminiService.js';

async function test() {
  const code = 'def fib(n):\n  if n<=0: return 0\n  return fib(n-1)+fib(n-2)';
  const issues = [{ title: 'Unoptimized Recursion', line: 3 }];
  
  console.log('Testing smartFixWithGemini...');
  const result = await smartFixWithGemini(code, 'python', issues);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
