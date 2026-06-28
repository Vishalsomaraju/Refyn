import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const TEST_CODE = `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

print(factorial(5))`;
const TEST_LANG = 'python';

const LOG_FILE = 'test_integration.log';
fs.writeFileSync(LOG_FILE, '');

function logToFile(...args) {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n';
  fs.appendFileSync(LOG_FILE, line);
}

console.log = logToFile;
console.error = logToFile;

const runTest = async (name, url, options) => {
  console.log(`\n\x1b[36m➤ Testing [${name}]\x1b[0m`);
  try {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}${url}`, {
      method: options.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    const duration = Date.now() - start;

    if (res.ok && data && (data.success !== false)) {
      console.log(`\x1b[32m✔ SUCCESS (${duration}ms)\x1b[0m`);
      return { success: true, data };
    } else {
      console.error(`\x1b[31m✖ FAILED (${duration}ms)\x1b[0m`);
      console.error('Status:', res.status);
      console.error('Response:', data);
      return { success: false, error: data };
    }
  } catch (err) {
    console.error(`\x1b[31m✖ ERROR\x1b[0m`, err.message);
    return { success: false, error: err.message };
  }
};

async function main() {
  console.log('--- STARTING COMPREHENSIVE BACKEND TESTS ---');

  // 1. Health
  await runTest('Health Check', '/health', { method: 'GET' });

  // 2. Execute (Judge0)
  await runTest('Code Execution (Judge0)', '/api/execute', {
    body: { code: TEST_CODE, language: TEST_LANG }
  });

  // 3. Analyze - Gemini
  const geminiRes = await runTest('Analyze - Gemini', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'manual', selectedModel: 'gemini' }
  });

  // 4. Analyze - Groq
  await runTest('Analyze - Groq (Llama)', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'manual', selectedModel: 'groq' }
  });

  // 5. Analyze - Mixtral
  await runTest('Analyze - Mixtral', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'manual', selectedModel: 'mixtral' }
  });

  // 6. Analyze - Ollama Local
  await runTest('Analyze - Ollama (Local/Offline)', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, offline: true }
  });

  // 7. Analyze - Auto Fallback
  await runTest('Analyze - Auto Routing', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'auto' }
  });

  // 8. Analyze - All Models Parallel
  const allRes = await runTest('Analyze - All (Parallel Cross-Reference)', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'all' }
  });

  // Need issues for Smart Fix
  let mockIssues = [];
  if (geminiRes.success && geminiRes.data.data.analysis.issues && geminiRes.data.data.analysis.issues.length > 0) {
    mockIssues = geminiRes.data.data.analysis.issues;
  } else {
    mockIssues = [{ line: 1, title: 'Test issue', description: 'Missing types', severity: 'info', category: 'quality' }];
  }

  // 9. Smart Fix - Gemini
  await runTest('Smart Fix - Gemini', '/api/smartfix', {
    body: { code: TEST_CODE, language: TEST_LANG, issues: mockIssues[0], selectedModel: 'gemini' }
  });

  // 10. Smart Fix - Ollama
  await runTest('Smart Fix - Ollama', '/api/smartfix', {
    body: { code: TEST_CODE, language: TEST_LANG, issues: mockIssues[0], offline: true }
  });

  // 11. Chat - Groq
  await runTest('Chat - Groq', '/api/chat', {
    body: {
      code: TEST_CODE, language: TEST_LANG,
      messages: [{ role: 'user', content: 'What does this code do in one sentence?' }]
    }
  });

  // 12. Chat - Ollama
  await runTest('Chat - Ollama', '/api/chat', {
    body: {
      code: TEST_CODE, language: TEST_LANG,
      messages: [{ role: 'user', content: 'What does this code do in one sentence?' }],
      offline: true
    }
  });

  // 13. Error Handling - Invalid Code (Analyze)
  await runTest('Error Handling - Empty Code', '/api/analyze', {
    body: { code: '', language: TEST_LANG }
  });

  // 14. Error Handling - Invalid Model
  await runTest('Error Handling - Invalid Config (Should Fallback or Fail Gracefully)', '/api/analyze', {
    body: { code: TEST_CODE, language: TEST_LANG, modelMode: 'manual', selectedModel: 'nonexistent-model' }
  });

  console.log('\n--- TESTS COMPLETED ---');
}

main();
