const fs = require('fs');
const path = require('path');
const dir = './api';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.js')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    if (content.includes("from './_cors.js'")) {
      content = content.replace("from './_cors.js'", "from '../lib/cors.js'");
      fs.writeFileSync(p, content);
      console.log('Fixed', file);
    }
  }
});
