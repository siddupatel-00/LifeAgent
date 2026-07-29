export const safeJson = async (res) => {
  if (!res) return {};
  try {
    const contentType = res.headers ? res.headers.get('content-type') : '';
    if (contentType && !contentType.includes('application/json')) {
      console.warn('Response is not JSON:', contentType);
      return {};
    }
    const text = await res.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch (err) {
    console.warn('Safe JSON parse fallback:', err);
    return {};
  }
};
