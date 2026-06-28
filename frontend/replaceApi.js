import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace the VITE_API_URL fallback with a window.location check
    const newBase = "${window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://refyn-production-5a6b.up.railway.app'}";
    
    content = content.replace(
      /\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*'http:\/\/localhost:5000'\}/g,
      newBase
    );

    // Also just in case there are still raw localhost strings
    content = content.replace(
      /'http:\/\/localhost:5000([^']+)'/g,
      "`" + newBase + "$1`"
    );

    content = content.replace(
      /`http:\/\/localhost:5000([^`]+)`/g,
      "`" + newBase + "$1`"
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
