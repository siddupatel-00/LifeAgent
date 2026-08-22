import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

async function getUserContext(userId) {
  const [userRes, settingsRes] = await Promise.all([
    db.execute({
      sql: 'SELECT name, ai_name, ai_provider, gemini_api_key, groq_api_key, ai_tone FROM users WHERE id = ?',
      args: [userId]
    }),
    db.execute({ sql: 'SELECT timezone FROM user_settings WHERE user_id = ?', args: [userId] })
  ]);
  return { user: userRes.rows[0] || {}, settings: settingsRes.rows[0] || {} };
}

function buildSystemPrompt(user, timezone) {
  const today = new Date().toLocaleDateString('en-US', { timeZone: timezone || 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const tone = user.ai_tone || 'Analytical & Direct';
  return `You are ${user.ai_name || 'AI'}, the user's personal life coach inside the LifeAgent app.
Today is ${today} (user timezone: ${timezone || 'UTC'}).
Tone: ${tone}. Be concise and practical. When asked about habits, finances, workouts or plans, give specific actionable advice.`;
}

async function callGemini(apiKey, systemPrompt, history) {
  const contents = history.map(m => ({
    role: m.sender === 'user' || m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text ?? m.content ?? '' }],
  }));
  const res = await fetch(`${GEMINI_ENDPOINT}/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error (${res.status})`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

async function callGroq(apiKey, systemPrompt, history) {
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
          role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
          content: m.text ?? m.content ?? '',
        })),
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq error (${res.status})`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const chat = await db.execute({
        sql: 'SELECT id, sender, text, time, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC',
        args: [userId]
      });
      return res.status(200).json(chat.rows);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      // Support both a single new message and a full message list
      const userText = typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.messages)
          ? body.messages.filter(m => m.role === 'user').slice(-1)[0]?.content
          : null;

      if (!userText || !String(userText).trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const { user, settings } = await getUserContext(userId);
      const provider = user.ai_provider || 'gemini';
      const apiKey = provider === 'groq' ? user.groq_api_key : user.gemini_api_key;
      if (!apiKey) {
        return res.status(400).json({ error: `No ${provider === 'groq' ? 'Groq' : 'Gemini'} API key configured. Add one in Settings → AI Coach.` });
      }

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Load recent history for context (last 20 messages)
      let history = [];
      if (Array.isArray(body.messages) && body.messages.length > 1) {
        history = body.messages.slice(-20);
      } else {
        const histRes = await db.execute({
          sql: 'SELECT sender, text FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
          args: [userId]
        });
        history = (histRes.rows || []).reverse();
      }

      const systemPrompt = buildSystemPrompt(user, settings.timezone);
      const replyText = provider === 'groq'
        ? await callGroq(apiKey, systemPrompt, history)
        : await callGemini(apiKey, systemPrompt, history);

      // Persist both turns in one batch
      await db.batch([
        { sql: 'INSERT INTO chat_history (user_id, sender, text, time) VALUES (?, ?, ?, ?)', args: [userId, 'user', String(userText), nowTime] },
        { sql: 'INSERT INTO chat_history (user_id, sender, text, time) VALUES (?, ?, ?, ?)', args: [userId, 'ai', replyText, nowTime] },
      ]);

      return res.status(200).json({ response: replyText });
    }

    if (req.method === 'DELETE') {
      await db.execute({ sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] });
      return res.status(200).json({ success: true, message: 'Chat history cleared' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
}
