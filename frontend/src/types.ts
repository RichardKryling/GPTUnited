export type Role = 'user' | 'assistant';

export interface ChatItem {
  id: string;
  name: string;
  subtitle?: string;
  online?: boolean;
  unread?: number;
  avatar?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  at: number;
  avatar?: string;
}

export interface TaughtItem {
  id: string;
  text: string;
  tags: string[];
  scope: 'global' | 'session';
  session: string;
  at: number;
}
