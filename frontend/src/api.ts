import axios from 'axios';
import { getSessionId } from './session';

function sidHeaders() {
  const sid = getSessionId();
  return sid ? { 'x-session-id': sid } : {};
}

export async function apiChat(input: string, actor?: string) {
  const res = await axios.post(`/api/chat`, { input, actor }, {
    headers: { ...sidHeaders(), 'content-type': 'application/json' }
  });
  return res.data;
}

export async function apiTeach(
  text: string,
  tags: string | string[] = [],
  scope: 'global'|'session' = 'session'
) {
  // ensure tags is an array of strings
  const tagsArray = Array.isArray(tags)
    ? tags
    : String(tags).split(',').map(t => t.trim()).filter(Boolean);

  const res = await axios.post(`/api/teach`, { text, tags: tagsArray, scope }, {
    headers: { ...sidHeaders(), 'content-type': 'application/json' }
  });
  return res.data;
}
