import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MgmService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.MGM_URL || 'http://127.0.0.1:8080';
    this.client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: { 'content-type': 'application/json' },
    });
  }

  async teach(body: { text: string; tags?: string[]; scope?: 'global'|'session' }, sid: string) {
    const res = await this.client.post('/teach', body, {
      headers: { 'x-session-id': sid },
    });
    return res.data;
  }

  async respond(body: { input: string; actor?: string; top_k?: number }, sid: string) {
    const res = await this.client.post('/respond', body, {
      headers: { 'x-session-id': sid },
    });
    return res.data;
  }
}
