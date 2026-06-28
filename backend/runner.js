import { exec } from 'child_process';
import fs from 'fs';

exec('node testAI.js', (error, stdout, stderr) => {
  fs.writeFileSync('runner_out.txt', `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error}`);
});
