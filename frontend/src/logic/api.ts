import axios from 'axios';
import { getSessionId } from './session';
import type { ChatResult, TeachResult } from './types';

function sidHeaders() {
  const sid = getSessionId();
  return sid ? { 'x-session-id': sid } : {};
}

export async function apiChat(input: string, actor?: string): Promise<ChatResult> {
  const res = await axios.post(`/api/chat`, { input, actor }, {
    headers: { ...sidHeaders(), 'content-type': 'application/json' }
  });
  return res.data as ChatResult;
}

export async function apiTeach(
  text: string,
  tags: string | string[] = [],
  scope: 'global'|'session'='session'
): Promise<TeachResult> {
  const tagsArray = Array.isArray(tags)
    ? tags
    : String(tags).split(',').map(t => t.trim()).filter(Boolean);

  const res = await axios.post(`/api/teach`, { text, tags: tagsArray, scope }, {
    headers: { ...sidHeaders(), 'content-type': 'application/json' }
  });
  return res.data as TeachResult;
}
