import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const settingsResult = await db.execute({
        sql: 'SELECT timezone, chat_reset_time, last_chat_reset FROM user_settings WHERE user_id = ?',
        args: [userId]
      });

      if (settingsResult.rows.length > 0) {
        const { timezone, chat_reset_time, last_chat_reset } = settingsResult.rows[0];
        if (timezone && chat_reset_time) {
          const nowStr = new Date().toLocaleString('en-US', { timeZone: timezone });
          const userNow = new Date(nowStr);
          
          const [resetHour, resetMinute] = chat_reset_time.split(':').map(Number);
          
          let resetBoundary = new Date(userNow);
          resetBoundary.setHours(resetHour, resetMinute, 0, 0);
          
          if (userNow < resetBoundary) {
            resetBoundary.setDate(resetBoundary.getDate() - 1);
          }
          
          const lastResetDate = last_chat_reset ? new Date(last_chat_reset) : new Date(0);
          
          if (lastResetDate < resetBoundary) {
            await db.execute({ sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] });
            await db.execute({ sql: 'UPDATE user_settings SET last_chat_reset = ? WHERE user_id = ?', args: [new Date().toISOString(), userId] });
            return res.status(200).json([]);
          }
          
          const chat = await db.execute({ sql: 'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC', args: [userId] });
          return res.status(200).json(chat.rows);
        }
      }

      // Fallback
      const chat = await db.execute({
          sql: 'SELECT * FROM chat_history WHERE user_id = ? AND created_at >= datetime("now", "-24 hours") ORDER BY created_at ASC',
          args: [userId]
        });
        await db.execute({
          sql: 'DELETE FROM chat_history WHERE user_id = ? AND created_at < datetime("now", "-24 hours")',
          args: [userId]
        });
        return res.status(200).json(chat.rows);
    }
    
    if (req.method === 'POST') {
      const action = req.query?.action || req.body?.action;

      // Handle AI Completion / Generation directly on backend
      if (action === 'generate') {
        const { prompt, systemPrompt, provider, apiKey } = req.body;
        const userText = prompt || req.body.message || '';
        
        let activeProvider = provider || 'gemini';
        let key = apiKey;

        if (!key) {
          const userRow = await db.execute({ sql: 'SELECT gemini_api_key, groq_api_key, ai_provider FROM users WHERE id = ?', args: [userId] });
          if (userRow.rows.length > 0) {
            const u = userRow.rows[0];
            activeProvider = provider || u.ai_provider || 'gemini';
            key = activeProvider === 'groq' ? u.groq_api_key : u.gemini_api_key;
          }
        }

        if (!key) {
          if (activeProvider === 'groq' && process.env.GROQ_API_KEY) {
            key = process.env.GROQ_API_KEY;
          } else if (process.env.GEMINI_API_KEY) {
            key = process.env.GEMINI_API_KEY;
            activeProvider = 'gemini';
          } else if (process.env.GROQ_API_KEY) {
            key = process.env.GROQ_API_KEY;
            activeProvider = 'groq';
          }
        }

        if (!key) {
          return res.status(400).json({ error: 'No Gemini or Groq API key configured. Please enter your API key in Settings.' });
        }

        let responseText = '';

        if (activeProvider === 'groq') {
          const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
          let groqErr = null;
          for (const m of groqModels) {
            try {
              const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: m,
                  messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: userText }
                  ]
                })
              });
              const gData = await gRes.json();
              if (gData.error) throw new Error(gData.error.message);
              responseText = gData.choices?.[0]?.message?.content || '';
              if (responseText) break;
            } catch (e) {
              groqErr = e;
            }
          }
          if (!responseText) throw groqErr || new Error('Groq AI generation failed.');
        } else {
          const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'];
          let geminiErr = null;
          for (const m of geminiModels) {
            try {
              const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser Request: ${userText}` : userText;
              const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
              });
              const gData = await gRes.json();
              if (gData.error) throw new Error(gData.error.message || 'Gemini error');
              const candidate = gData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate) {
                responseText = candidate;
                break;
              }
            } catch (e) {
              geminiErr = e;
            }
          }
          if (!responseText) throw geminiErr || new Error('Gemini AI generation failed.');
        }

        return res.status(200).json({ text: responseText, success: true });
      }

      // Allow batch inserting multiple messages (e.g., user + ai response together)
      const messages = Array.isArray(req.body) ? req.body : [req.body];
      
      const statements = messages.map(msg => ({
        sql: 'INSERT INTO chat_history (user_id, sender, text, time) VALUES (?, ?, ?, ?)',
        args: [userId, msg.sender, msg.text, msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]
      }));
      
      if (statements.length > 0) {
        await db.batch(statements);
      }
      return res.status(201).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      await db.execute({ sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] });
      return res.status(200).json({ success: true, message: 'Chat history cleared' });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
