export const API_BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${API_BASE}/api`;

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: (p, body) => req(p, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  del: (p) => req(p, { method: 'DELETE' }),
  upload: async (p, file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}${p}`, { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(`Upload failed`);
    return res.json();
  },
};

export const fileUrl = (path) => `${API}/files/${path}`;
