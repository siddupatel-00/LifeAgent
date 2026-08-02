const fs = require('fs');
const path = require('path');
const dir = './src/components';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace various patterns of hardcoded white text for active/selected states
  content = content.replace(/color:\s*(isActive|isSelected|isCurrentToday)\s*\?\s*['"]#(fff|ffffff)['"]\s*:/g, "color: $1 ? 'var(--accent-text, #ffffff)' :");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    replaceInFile(path.join(dir, file));
  }
});
