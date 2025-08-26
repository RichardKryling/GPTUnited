export type Source = { id?: string; text?: string; score?: number; tags?: string[]; scope?: string; session_id?: string };
export type ChatResult = { reply: string; sources?: Source[] };
export type TeachResult = { ok: boolean; id: string; scope: 'global'|'session'; tags: string[]; session?: string };
