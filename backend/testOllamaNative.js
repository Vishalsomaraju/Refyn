import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 11434,
  path: '/api/tags',
  method: 'GET',
  timeout: 5000
};

console.log("Checking Ollama with native http...");

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response received!");
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.on('timeout', () => {
  console.error("Timeout occurred!");
  req.destroy();
});

req.end();
