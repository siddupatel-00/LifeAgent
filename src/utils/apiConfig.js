export const API_BASE_URL = (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'file:'))
  ? 'https://ailifeagent.vercel.app'
  : '';

export const getApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
