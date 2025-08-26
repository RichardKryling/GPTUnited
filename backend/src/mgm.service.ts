import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface MgmTeachPayload {
  text: string;
  tags?: string[];
  scope: 'global' | 'session';
  session: string;
}
interface MgmTeachResult {
  ok: boolean;
  id: string;
}

interface MgmChatPayload {
  input: string;
  actor?: string;
  session: string;
}
interface MgmChatResult {
  reply: string;
  sources?: Array<{ title?: string; url?: string; snippet?: string }>;
}

@Injectable()
export class MgmService {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(cfg: ConfigService) {
    this.baseUrl = cfg.get<string>('MGM_URL') || 'http://127.0.0.1:8080';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000
    });
  }

  // Placeholder: not used in Sprint 1
  async teach(_payload: MgmTeachPayload): Promise<MgmTeachResult> {
    // Example for later:
    // const { data } = await this.client.post<MgmTeachResult>('/api/teach', payload, { headers: { 'x-session-id': payload.session } });
    // return data;
    return { ok: true, id: 'stub' };
  }

  // Placeholder: not used in Sprint 1
  async respond(_payload: MgmChatPayload): Promise<MgmChatResult> {
    // Example for later:
    // const { data } = await this.client.post<MgmChatResult>('/api/chat', payload, { headers: { 'x-session-id': payload.session } });
    // return data;
    return { reply: 'stub', sources: [] };
  }
}
