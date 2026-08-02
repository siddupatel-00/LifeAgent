const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replacement] of replacements) {
    content = content.replace(search, replacement);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

replaceFile('src/db/syncEngine.js', [
  [
    `const localRec = await db[tableName].get(remoteRec.id);`,
    `const localRec = await db[tableName].get(String(remoteRec.id)) || await db[tableName].get(remoteRec.id);`
  ],
  [
    `await db[tableName].delete(remoteRec.id);`,
    `await db[tableName].delete(String(remoteRec.id));\n                await db[tableName].delete(remoteRec.id);`
  ],
  [
    `await db[tableName].put({ ...remoteRec, lastSyncedAt: new Date().toISOString() });`,
    `await db[tableName].put({ ...remoteRec, id: String(remoteRec.id), lastSyncedAt: new Date().toISOString() });`
  ]
]);

console.log('Sync engine fixes applied');
