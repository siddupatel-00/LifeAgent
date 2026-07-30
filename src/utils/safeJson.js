export async function safeParseJson(res) {
  if (!res) return null;
  try {
    const contentType = res.headers ? res.headers.get('content-type') : '';
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return null;
    }
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
