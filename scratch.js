const fs = require('fs');

const files = [
  'src/components/SettingsPanel.jsx',
  'src/components/BodyGym.jsx',
  'src/components/WaterReminder.jsx',
  'src/App.jsx',
  'src/components/SleepTracker.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.includes('method: \'POST\'') || line.includes('method: "POST"') || 
          line.includes('method: \'PUT\'') || line.includes('method: \'DELETE\'')) {
        console.log(`\n--- ${file} : ${i+1} ---`);
        console.log(lines.slice(Math.max(0, i-5), i+15).join('\n'));
      }
    });
  }
}
