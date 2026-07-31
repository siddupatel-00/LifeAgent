const fs = require('fs');

function refactorAppJsx() {
  const path = '/Users/siddu/.gemini/antigravity/scratch/lifeagent/src/App.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // 1. Lines 1184-1190
  content = content.replace(/if\s*\(token\)\s*\{\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(newWorkout\)\s*\}\)\.catch\(console\.error\);\s*\}/s, 
`db.workouts.put(newWorkout).then(() => queueMutation('workouts', 'create', newWorkout.id, newWorkout)).then(() => triggerSync()).catch(console.error);`);

  // 2. Lines 1216-1223
  content = content.replace(/if\s*\(token\)\s*\{\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*payload\.id\s*\?\s*'PUT'\s*:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(payload\)\s*\}\)\.catch\(console\.error\);\s*\}/s,
`const tempId = payload.id || Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      db.bodyStats.put(finalPayload).then(() => queueMutation('bodyStats', payload.id ? 'update' : 'create', tempId, finalPayload)).then(() => triggerSync()).catch(console.error);`);

  // 3. Lines 1720-1731 (ADD_WORKOUT)
  content = content.replace(/await\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(\{\s*title:\s*data\.title\s*\|\|\s*'Workout',\s*category:\s*data\.category\s*\|\|\s*'General',\s*duration_mins:\s*Number\(data\.duration_mins\)\s*\|\|\s*30,\s*calories:\s*Number\(data\.calories\)\s*\|\|\s*200,\s*notes:\s*data\.notes\s*\|\|\s*'',\s*date:\s*todayStr\s*\}\)\s*\}\);/s,
`const newWorkout = { title: data.title || 'Workout', category: data.category || 'General', duration_mins: Number(data.duration_mins) || 30, calories: Number(data.calories) || 200, notes: data.notes || '', date: todayStr, id: Date.now().toString() };
            await db.workouts.put(newWorkout);
            await queueMutation('workouts', 'create', newWorkout.id, newWorkout);
            triggerSync();
            setWorkouts(prev => [newWorkout, ...(Array.isArray(prev) ? prev : [])]);`);

  // 4. Lines 1745-1755 (ADD_BODY_STATS)
  content = content.replace(/await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(\{\s*weight:\s*Number\(data\.weight\)\s*\|\|\s*0,\s*target_weight:\s*Number\(data\.target_weight\)\s*\|\|\s*0,\s*protein:\s*Number\(data\.protein\)\s*\|\|\s*0,\s*hydration:\s*Number\(data\.hydration\)\s*\|\|\s*0,\s*date:\s*todayStr\s*\}\)\s*\}\);/s,
`const newStats = { weight: Number(data.weight) || 0, target_weight: Number(data.target_weight) || 0, protein: Number(data.protein) || 0, hydration: Number(data.hydration) || 0, date: todayStr };
            await handleSaveBodyStat(newStats);`);

  // 5. Lines 3458-3475 (Mark Complete Today)
  content = content.replace(/try\s*\{\s*const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(\{.*?\}\)\s*\}\);\s*if\s*\(res\.ok\)\s*\{[^\}]+\}\s*else\s*\{[^\}]+\}\s*\}\s*catch\(e\)\s*\{[^\}]+\}/s,
`try {
                                        const newW = { title: currentTitle, category: 'Strength', duration_mins: 45, calories: 320, notes: \`Completed scheduled \${currentTitle}\`, date: todayKeyStr, id: Date.now().toString() };
                                        await db.workouts.put(newW);
                                        await queueMutation('workouts', 'create', newW.id, newW);
                                        triggerSync();
                                        setWorkouts(prev => [newW, ...(Array.isArray(prev) ? prev : [])]);
                                        showToast(\`🎉 \${currentTitle} Completed!\`, 'success');
                                      } catch(e) {
                                        console.error(e);
                                      }`);

  // 6. Lines 3528-3543 (Protein widget)
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness'\),\s*\{\s*method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);\s*if\s*\(res\.status\s*===\s*200\s*\|\|\s*res\.status\s*===\s*201\)\s*\{\s*const\s*sign\s*=\s*amount\s*>=\s*0\s*\?\s*'\+'\s*:\s*'';\s*showToast\(`Protein\s*logged:\s*\$\{sign\}\$\{amount\}g`,\s*'success'\);\s*\}\s*else\s*\{\s*console\.error\('Failed\s*to\s*log\s*protein\s*in\s*App\.jsx:',\s*res\.status,\s*res\.statusText\);\s*\}/s,
`const finalPayload = { ...payload, id: tempId.toString(), weight: Number(latestStat?.weight) || 0, target_weight: targetW };
                              await db.bodyStats.put(finalPayload);
                              await queueMutation('bodyStats', todayStat?.id ? 'update' : 'create', tempId.toString(), finalPayload);
                              triggerSync();
                              const sign = amount >= 0 ? '+' : '';
                              showToast(\`Protein logged: \${sign}\${amount}g\`, 'success');`);

  // 7. Lines 3628-3642 (Hydration widget)
  content = content.replace(/if\s*\(token\)\s*\{\s*const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*isExistingToday\s*\?\s*'PUT'\s*:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\},\s*body:\s*JSON\.stringify\(payload\)\s*\}\);\s*if\s*\(res\.ok\)\s*\{\s*if\s*\(!isExistingToday\)\s*\{\s*const\s*data\s*=\s*await\s*res\.json\(\);\s*setBodyStats\(prev\s*=>\s*prev\.map\(s\s*=>\s*s\.id\s*===\s*tempId\s*\?\s*data\s*:\s*s\)\);\s*\}\s*\}\s*\}/s,
`const finalPayload = { ...payload, id: tempId.toString() };
                              await db.bodyStats.put(finalPayload);
                              await queueMutation('bodyStats', isExistingToday ? 'update' : 'create', tempId.toString(), finalPayload);
                              triggerSync();`);

  fs.writeFileSync(path, content, 'utf8');
  console.log("App.jsx refactored.");
}

function refactorBodyGymJsx() {
  const path = '/Users/siddu/.gemini/antigravity/scratch/lifeagent/src/components/BodyGym.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // Add imports if they don't exist
  if (!content.includes("import db from '../db/db';")) {
    content = content.replace(/import\s*\{\s*todayKey\s*\}\s*from\s*'..\/utils\/date';/, 
      "import { todayKey } from '../utils/date';\nimport db from '../db/db';\nimport { queueMutation, triggerSync } from '../db/syncEngine';");
  }

  // Find direct fetch for graph components? Wait, fetchWorkouts and fetchStats in BodyGym are:
  // fetchWorkouts() -> replace with getting from db? But it's passed as props.
  // Wait, if it's strictly offline-first, I should just remove fetchWorkouts and fetchStats, OR they shouldn't fetch directly but use App.jsx's state.
  // Oh, wait! In App.jsx, BodyGym is passed `workouts={workouts}` and `bodyStats={bodyStats}`!
  // So BodyGym already receives the state. It shouldn't fetch!
  // Let's remove `fetchWorkouts` and `fetchStats` completely, or at least disable them.
  content = content.replace(/const\s*fetchWorkouts\s*=\s*useCallback[\s\S]*?\},s*\[token\]\);/, '');
  content = content.replace(/const\s*fetchStats\s*=\s*useCallback[\s\S]*?\},s*\[token,s*setBodyStats\]\);/, '');
  // And the useEffect that calls them
  content = content.replace(/if\s*\(\!Array\.isArray\(bodyStats\)\s*\|\|\s*bodyStats\.length\s*===\s*0\)\s*\{\s*fetchStats\(\);\s*\}/, '');
  content = content.replace(/if\s*\(Array\.isArray\(initialWorkouts\)\s*&&\s*initialWorkouts\.length\s*>\s*0\)\s*\{\s*setWorkouts\(initialWorkouts\);\s*\}\s*else\s*\{\s*fetchWorkouts\(\);\s*\}/, 'setWorkouts(initialWorkouts || []);');

  // Replace mutative fetch calls in BodyGym
  // 1. Line 230: handleAddWorkout -> fetch POST /api/fitness?type=workouts
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);\s*setWorkouts\(\(prev\)\s*=>\s*\[data,\s*\.\.\.prev\]\);[\s\S]*?\}\s*else\s*\{[\s\S]*?\}/,
`const tempId = Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.workouts.put(finalPayload);
      await queueMutation('workouts', 'create', tempId, finalPayload);
      triggerSync();
      setWorkouts(prev => [finalPayload, ...prev]);
      showToast('Workout added successfully', 'success');`);

  // 2. Line 275: handleDeleteWorkout -> fetch DELETE /api/fitness?type=workouts
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'DELETE',[\s\S]*?body:\s*JSON\.stringify\(\{.*?id.*?\}\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?setWorkouts\(\(prev\)\s*=>\s*prev\.filter\(\(w\)\s*=>\s*w\.id\s*!==\s*id\)\);[\s\S]*?\}/,
`await db.workouts.delete(id);
      await queueMutation('workouts', 'delete', id.toString(), null);
      triggerSync();
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      showToast('Workout deleted successfully', 'success');`);

  // 3. Line 297: handleLogTemplate -> fetch POST /api/fitness?type=workouts
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=workouts'\),\s*\{\s*method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);\s*setWorkouts\(\(prev\)\s*=>\s*\[data,\s*\.\.\.prev\]\);[\s\S]*?\}/,
`const tempId = Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.workouts.put(finalPayload);
      await queueMutation('workouts', 'create', tempId, finalPayload);
      triggerSync();
      setWorkouts(prev => [finalPayload, ...prev]);
      showToast(isCompleted ? \`🎉 \${t.name} Completed!\` : 'Workout Scheduled', 'success');`);

  // 4. Line 406: handleSaveProtein -> fetch POST /api/fitness
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness'\),\s*\{\s*method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.status\s*===\s*200\s*\|\|\s*res\.status\s*===\s*201\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?\}/,
`const tempId = todayStat?.id || Date.now().toString();
      const finalPayload = { ...payload, id: tempId, weight: Number(todayStat?.weight) || 0, target_weight: Number(todayStat?.target_weight) || 0 };
      await db.bodyStats.put(finalPayload);
      await queueMutation('bodyStats', todayStat?.id ? 'update' : 'create', tempId.toString(), finalPayload);
      triggerSync();
      const sign = amount >= 0 ? '+' : '';
      showToast(\`Protein logged: \${sign}\${amount}g\`, 'success');`);

  // 5. Line 446 & 458: handleSaveMetrics -> fetch POST/PUT /api/fitness?type=body-stats
  content = content.replace(/let\s*res;[\s\S]*?res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*'PUT',[\s\S]*?body:\s*JSON\.stringify\(\{.*?\}\)\s*\}\);[\s\S]*?res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(\{.*?\}\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);[\s\S]*?setBodyStats\(\(prev\)\s*=>\s*\{\s*if\s*\(Array\.isArray\(prev\)\)\s*\{[\s\S]*?return\s*\[data,\s*\.\.\.prev\];[\s\S]*?\}\s*return\s*\[data\];\s*\}\);[\s\S]*?\}/,
`const tempId = todayStat?.id || Date.now().toString();
      const finalPayload = {
        id: tempId,
        weight: Number(statsForm.weight) || Number(todayStat?.weight) || 0,
        target_weight: Number(statsForm.target_weight) || Number(todayStat?.target_weight) || 0,
        protein: Number(todayStat?.protein) || 0,
        target_protein: Number(statsForm.target_protein) || Number(todayStat?.target_protein) || 0,
        hydration: Number(todayStat?.hydration) || 0,
        date: todayStr
      };
      await db.bodyStats.put(finalPayload);
      await queueMutation('bodyStats', todayStat?.id ? 'update' : 'create', tempId.toString(), finalPayload);
      triggerSync();
      setBodyStats(prev => {
        if (Array.isArray(prev)) {
          const exists = prev.find(s => s.date === todayStr);
          if (exists) return prev.map(s => s.date === todayStr ? finalPayload : s);
          return [finalPayload, ...prev];
        }
        return [finalPayload];
      });
      showToast('Metrics saved successfully', 'success');`);

  // Replace graph fetch dependencies
  // In `AnalyticsPanel.jsx` there are fetches for `/api/analytics?type=logs`, but it's not strictly `/api/fitness`. The prompt said "Also, check if there are graph components for fitness that are doing direct fetches, and route them through local React state instead."
  // Wait, AnalyticsPanel is an analytics tab, not exactly the Gym/Fitness module.
  // In BodyGym.jsx there are quick Hydration/Protein/Weight widgets which also do fetch.
  // Line 519: Add Water widget
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*isExisting\s*\?\s*'PUT'\s*:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?if\s*\(!isExisting\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);[\s\S]*?setBodyStats\(\(prev\)\s*=>\s*prev\.map\(\(s\)\s*=>\s*\(s\.id\s*===\s*tempId\s*\?\s*data\s*:\s*s\)\)\);[\s\S]*?\}\s*\}/,
`const finalPayload = { ...payload, id: tempId };
                            await db.bodyStats.put(finalPayload);
                            await queueMutation('bodyStats', isExisting ? 'update' : 'create', tempId.toString(), finalPayload);
                            triggerSync();`);
  
  // Line 553: Add Protein widget
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*isExisting\s*\?\s*'PUT'\s*:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?if\s*\(!isExisting\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);[\s\S]*?setBodyStats\(\(prev\)\s*=>\s*prev\.map\(\(s\)\s*=>\s*\(s\.id\s*===\s*tempId\s*\?\s*data\s*:\s*s\)\)\);[\s\S]*?\}\s*\}/,
`const finalPayload = { ...payload, id: tempId };
                            await db.bodyStats.put(finalPayload);
                            await queueMutation('bodyStats', isExisting ? 'update' : 'create', tempId.toString(), finalPayload);
                            triggerSync();`);
                            
  // Line 575: Add Weight widget
  content = content.replace(/const\s*res\s*=\s*await\s*fetch\(getApiUrl\('\/api\/fitness\?type=body-stats'\),\s*\{\s*method:\s*isExisting\s*\?\s*'PUT'\s*:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(payload\)\s*\}\);[\s\S]*?if\s*\(res\.ok\)\s*\{[\s\S]*?if\s*\(!isExisting\)\s*\{[\s\S]*?const\s*data\s*=\s*await\s*res\.json\(\);[\s\S]*?setBodyStats\(\(prev\)\s*=>\s*prev\.map\(\(s\)\s*=>\s*\(s\.id\s*===\s*tempId\s*\?\s*data\s*:\s*s\)\)\);[\s\S]*?\}\s*\}/,
`const finalPayload = { ...payload, id: tempId };
                            await db.bodyStats.put(finalPayload);
                            await queueMutation('bodyStats', isExisting ? 'update' : 'create', tempId.toString(), finalPayload);
                            triggerSync();`);

  fs.writeFileSync(path, content, 'utf8');
  console.log("BodyGym.jsx refactored.");
}

refactorAppJsx();
refactorBodyGymJsx();
