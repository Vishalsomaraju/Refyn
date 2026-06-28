const http = require('http');

const data = JSON.stringify({
  code: 'def fib(n):\n  if n<=0: return 0\n  return fib(n-1)+fib(n-2)',
  language: 'python',
  issues: [{title: 'Unoptimized Recursion', line: 3}],
  offline: false,
  selectedModel: 'gemini'
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/smartfix',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  },
  res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
  }
);
req.on('error', e => console.error(e));
req.write(data);
req.end();
