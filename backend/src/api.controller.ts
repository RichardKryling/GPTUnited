import { Body, Controller, Headers, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatDto, TeachDto } from './dto';
import { MgmService } from './mgm.service';
import { SESSION_HEADER } from './rate';
import { ChatResponse, TeachResponse } from './types';

@Controller('api')
export class ApiController {
  constructor(private readonly mgm: MgmService) {}

  @Post('chat')
  async chat(
    @Body() dto: ChatDto,
    @Headers(SESSION_HEADER) sid: string,
  ): Promise<ChatResponse> {
    // Placeholder stub; hook to mgm.respond later
    return {
      reply: 'stub',
      echo: { input: dto.input, actor: dto.actor },
      sources: [],
      session: sid,
    };
  }

  @Post('teach')
  async teach(
    @Body() dto: TeachDto,
    @Headers(SESSION_HEADER) sid: string,
  ): Promise<TeachResponse> {
    const id = uuidv4();
    const scope = dto.scope ?? 'session';
    const tags = dto.tags ?? [];

    // Placeholder stub; hook to mgm.teach later
    return {
      ok: true,
      id,
      scope,
      tags,
      session: sid,
      text: dto.text,
    };
  }
}
