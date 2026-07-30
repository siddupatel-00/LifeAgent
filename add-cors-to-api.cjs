const fs = require('fs');
const path = require('path');

function processApiFile(filePath) {
  if (filePath.endsWith('_cors.js')) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if handleCors is already added
  if (!content.includes('handleCors')) {
    // Add import at top
    content = "import { handleCors } from './_cors.js';\n" + content;

    // Inject `if (handleCors(req, res)) return;` at the beginning of export default function
    content = content.replace(/(export\s+default\s+async\s+function\s*handler\s*\([^)]*\)\s*\{)/, '$1\n  if (handleCors(req, res)) return;\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Added CORS to:', filePath);
  }
}

const apiDir = path.join(__dirname, 'api');
fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js')) {
    processApiFile(path.join(apiDir, file));
  }
});
