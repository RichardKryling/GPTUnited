import axios from 'axios';

// In dev, Vite proxy handles /api → backend:3000. For prod, set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : '';

export async function apiChat(input: string, actor?: string, sid?: string) {
  const res = await axios.post(
    `${BASE}/api/chat`,
    { input, actor },
    { headers: sid ? { 'x-session-id': sid } : undefined }
  );
  return res.data as { reply: string; echo?: unknown; sources?: unknown[] };
}

export async function apiTeach(
  text: string,
  tags: string[] = [],
  scope: 'global' | 'session' = 'session',
  sid?: string
) {
  const res = await axios.post(
    `${BASE}/api/teach`,
    { text, tags, scope },
    { headers: sid ? { 'x-session-id': sid } : undefined }
  );
  return res.data as { ok: boolean; id: string };
}
