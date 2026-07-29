const fs = require('fs');
const path = '/Users/siddu/.gemini/antigravity/scratch/lifeagent/src/components/SettingsPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// The file now has `return (\n    <>\n      <style>...`
// I need to add `</>` at the end.
// Look for the last `</div>\n  );\n};`
content = content.replace(/<\/div>\n  \);\n\};\n\nexport default SettingsPanel;/g, '</div>\n    </>\n  );\n};\n\nexport default SettingsPanel;');

fs.writeFileSync(path, content);
console.log('Fixed');
