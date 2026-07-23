const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If the file is in a subdirectory like api/auth/login.js
      if (dir === 'api') {
        content = content.replace(/\.\/lib\//g, '../lib/');
      } else if (dir.startsWith('api/')) {
        content = content.replace(/\.\.\/lib\//g, '../../lib/');
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('api');
console.log('Imports fixed.');
