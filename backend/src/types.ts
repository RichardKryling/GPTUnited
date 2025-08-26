export interface ChatResponse {
  reply: string;
  echo: { input: string; actor?: string };
  sources: Array<{ title?: string; url?: string; snippet?: string }>;
  session?: string;
}

export interface TeachResponse {
  ok: true;
  id: string;
  scope: 'global' | 'session';
  tags: string[];
  session?: string;
  text?: string;
}
