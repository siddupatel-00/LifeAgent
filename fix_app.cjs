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

// Fix BodyGym.jsx
replaceFile('src/components/BodyGym.jsx', [
  [
    `fetch(getApiUrl('/api/settings'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                  body: JSON.stringify({ workout_split_type: newType })
                }).catch(err => console.error('Failed to update split type:', err));`,
    `queueMutation('settings', 'update', 'workout_split_type', { workout_split_type: newType }).then(() => triggerSync()).catch(console.error);`
  ],
  [
    `fetch(getApiUrl('/api/settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                body: JSON.stringify({ workout_templates: JSON.stringify(splitList) })
              }).catch(err => console.error('Failed to update templates:', err));`,
    `queueMutation('settings', 'update', 'workout_templates', { workout_templates: JSON.stringify(splitList) }).then(() => triggerSync()).catch(console.error);`
  ]
]);

// Fix WaterReminder.jsx
replaceFile('src/components/WaterReminder.jsx', [
  [
    `await fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify({ 
            water_target_goal: newTarget,
            water_reminder_interval: newInterval,
            water_reminder_enabled: isReminderEnabled 
          })
        });`,
    `await queueMutation('settings', 'update', 'water', { 
            water_target_goal: newTarget,
            water_reminder_interval: newInterval,
            water_reminder_enabled: isReminderEnabled 
          });
          triggerSync();`
  ],
  [
    `fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify({ water_reminder_enabled: newState })
        }).catch(err => console.error('Failed to update water reminder state:', err));`,
    `queueMutation('settings', 'update', 'water_enabled', { water_reminder_enabled: newState }).then(() => triggerSync()).catch(console.error);`
  ],
  [
    `fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify({ water_reminder_interval: mins })
        }).catch(err => console.error('Failed to update water reminder interval:', err));`,
    `queueMutation('settings', 'update', 'water_interval', { water_reminder_interval: mins }).then(() => triggerSync()).catch(console.error);`
  ]
]);

// Fix SettingsPanel.jsx
replaceFile('src/components/SettingsPanel.jsx', [
  [
    `const res = await fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify({ 
            ...userProfile, 
            phone: userProfile.phone || '', 
            timezone: userProfile.timezone || 'UTC', 
            ai_name: aiName?.trim() || 'AI', 
            gemini_api_key: geminiApiKey, 
            groq_api_key: groqApiKey, 
            ai_provider: aiProvider, 
            theme: themeMode, 
            currency: userProfile.currency, 
            chat_reset_time: chatResetTime,
            ai_tone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            aiTone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            morning_audit: userProfile.morningAudit !== undefined ? userProfile.morningAudit : true,
            smart_alerts: userProfile.smartAlerts !== undefined ? userProfile.smartAlerts : true,
            week_start_day: userProfile.weekStartDay || 'Monday',
            sync_to_cloud: userProfile.syncToCloud !== undefined ? userProfile.syncToCloud : true,
            workout_split_type: userProfile.workout_split_type || 'weekly',
            workout_templates: userProfile.workout_templates || null
          })
        });`,
    `const payload = { 
            ...userProfile, 
            phone: userProfile.phone || '', 
            timezone: userProfile.timezone || 'UTC', 
            ai_name: aiName?.trim() || 'AI', 
            gemini_api_key: geminiApiKey, 
            groq_api_key: groqApiKey, 
            ai_provider: aiProvider, 
            theme: themeMode, 
            currency: userProfile.currency, 
            chat_reset_time: chatResetTime,
            ai_tone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            aiTone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            morning_audit: userProfile.morningAudit !== undefined ? userProfile.morningAudit : true,
            smart_alerts: userProfile.smartAlerts !== undefined ? userProfile.smartAlerts : true,
            week_start_day: userProfile.weekStartDay || 'Monday',
            sync_to_cloud: userProfile.syncToCloud !== undefined ? userProfile.syncToCloud : true,
            workout_split_type: userProfile.workout_split_type || 'weekly',
            workout_templates: userProfile.workout_templates || null
          };
          await queueMutation('settings', 'update', 'profile', payload);
          triggerSync();
          const res = { ok: true };`
  ]
]);

// Fix App.jsx
replaceFile('src/App.jsx', [
  [
    `fetch(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify(updatedProfile)
      }).catch(err => console.error('Background settings save failed:', err));`,
    `queueMutation('settings', 'update', 'profile', updatedProfile).then(() => triggerSync()).catch(console.error);`
  ],
  [
    `await fetch(getApiUrl('/api/chat'), {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });`,
    `const messages = await db.aiMessages.toArray();
        await db.aiMessages.clear();
        for (const m of messages) {
          await queueMutation('aiMessages', 'delete', m.id.toString(), { is_deleted: true });
        }
        triggerSync();`
  ],
  [
    `fetch(getApiUrl('/api/chat'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` }, body: JSON.stringify([newMsg, aiMsg]) }).catch(err => console.error(err));`,
    `[newMsg, aiMsg].forEach(async m => { await db.aiMessages.put({ ...m, id: String(m.id) }); await queueMutation('aiMessages', 'create', String(m.id), m); }); triggerSync();`
  ],
  [
    `fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify([newMsg, aiMsg])
      }).catch(err => console.error(err));`,
    `[newMsg, aiMsg].forEach(async m => { await db.aiMessages.put({ ...m, id: String(m.id) }); await queueMutation('aiMessages', 'create', String(m.id), m); }); triggerSync();`
  ],
  [
    `fetch(getApiUrl('/api/today'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
              body: JSON.stringify({ label: h.title, category: h.category, checked: 1, habit_id: targetHabitId, time: 'Daily', client_date: todayKey(userProfile?.timezone) })
            }).catch(console.error);`,
    `const newTodayItemPayload = { id: Date.now().toString(), title: h.title, category: h.category, checked: true, habit_id: targetHabitId, time: 'Daily', date: todayKey(userProfile?.timezone) };
            db.todayItems.put(newTodayItemPayload).then(() => queueMutation('todayItems', 'create', newTodayItemPayload.id, newTodayItemPayload)).then(() => triggerSync()).catch(console.error);`
  ],
  [
    `const res = await fetch(getApiUrl('/api/habits'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
              body: JSON.stringify({
                label: data.label || 'New Habit',
                category: data.category || 'General',
                target: data.target || 'Daily'
              })
            });
            if (res.ok) {
              const saved = await res.json();
              addedHabits.push(saved);
            }`,
    `const idStr = Date.now().toString();
            const saved = {
                id: idStr,
                label: data.label || 'New Habit',
                title: data.label || 'New Habit',
                category: data.category || 'General',
                target: data.target || 'Daily',
                streak: 0
            };
            await db.habits.put(saved);
            await queueMutation('habits', 'create', idStr, saved);
            triggerSync();
            addedHabits.push(saved);`
  ]
]);

console.log('Fixes applied successfully');
