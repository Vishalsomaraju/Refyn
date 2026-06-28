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

    // Replace single quoted instances: 'http://localhost:5000/something' -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/something`
    content = content.replace(
      /'http:\/\/localhost:5000([^']+)'/g,
      "`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`"
    );

    // Replace backtick instances: `http://localhost:5000/something/${var}` -> `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/something/${var}`
    content = content.replace(
      /`http:\/\/localhost:5000([^`]+)`/g,
      "`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`"
    );

    // Replace double quoted instances if any
    content = content.replace(
      /"http:\/\/localhost:5000([^"]+)"/g,
      "`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`"
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
