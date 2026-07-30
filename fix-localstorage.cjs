const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('localStorage.setItem') || content.includes('localStorage.getItem') || content.includes('localStorage.removeItem') || content.includes('localStorage.clear')) {
    content = content.replace(/localStorage\.setItem/g, 'safeStorage.setItem');
    content = content.replace(/localStorage\.getItem/g, 'safeStorage.getItem');
    content = content.replace(/localStorage\.removeItem/g, 'safeStorage.removeItem');
    content = content.replace(/localStorage\.clear/g, 'safeStorage.clear');
    
    // Ensure safeStorage is available in the file
    if (!content.includes('const safeStorage =') && !content.includes('import { safeStorage }') && !filePath.endsWith('safeStorage.js')) {
      if (filePath.endsWith('App.jsx')) {
         // App.jsx already has safeStorage defined at the top, do nothing
      } else {
         const relPath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'utils', 'safeStorage.js'));
         let importPath = relPath.replace(/\\/g, '/');
         if (!importPath.startsWith('.')) importPath = './' + importPath;
         importPath = importPath.replace(/\.js$/, '');
         content = `import { safeStorage } from '${importPath}';\n` + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  });
}

walk(path.join(__dirname, 'src'));
