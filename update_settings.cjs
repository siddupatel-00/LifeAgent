const fs = require('fs');
const path = '/Users/siddu/.gemini/antigravity/scratch/lifeagent/src/components/SettingsPanel.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add style block at the beginning of the component return
content = content.replace('return (', `return (
    <>
      <style>{\`
        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          background: var(--bg-main);
          border-radius: 14px;
          border: 1px solid var(--border-color);
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
        }
        .settings-input {
          width: 100%;
          max-width: 320px;
          padding: 14px;
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
        }
        @media (max-width: 768px) {
          .settings-input {
            max-width: 100%;
          }
        }
      \`}</style>`);

// Replace the row divs
const rowRegex = /<div style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*padding:\s*'18px 20px',\s*background:\s*'var\(--bg-main\)',\s*borderRadius:\s*'14px',\s*border:\s*'1px solid var\(--border-color\)',\s*gap:\s*'20px',\s*flexWrap:\s*'wrap'\s*\}\}>/g;
content = content.replace(rowRegex, '<div className="settings-row">');

// Replace the input styles
const inputRegex = /style=\{\{\s*width:\s*'320px',\s*padding:\s*'12px 16px',\s*borderRadius:\s*'12px',\s*background:\s*'var\(--bg-card\)',\s*color:\s*'var\(--text-main\)',\s*border:\s*'1px solid var\(--border-color\)',\s*fontSize:\s*'0\.95rem',\s*fontWeight:\s*600(?:,\s*outline:\s*'none')?\s*\}\}/g;
content = content.replace(inputRegex, 'className="settings-input"');

// Replace one outlier
const outlierRegex = /style=\{\{\s*width:\s*'320px',\s*padding:\s*'12px 16px',\s*borderRadius:\s*'12px',\s*background:\s*'var\(--bg-card\)',\s*color:\s*'var\(--text-main\)',\s*border:\s*'1px solid var\(--border-color\)',\s*fontSize:\s*'0\.92rem',\s*fontWeight:\s*600\s*\}\}/g;
content = content.replace(outlierRegex, 'className="settings-input" style={{ fontSize: "0.92rem" }}');


fs.writeFileSync(path, content);
console.log('Settings UI updated');
