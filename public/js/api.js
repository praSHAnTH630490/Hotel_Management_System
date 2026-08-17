const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!res.ok) {
    const message = (body && body.error) ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data || {}) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data || {}) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
