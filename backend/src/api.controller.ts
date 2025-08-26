import { Body, Controller, Headers, Post } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { MgmService } from './mgm.service';

class ChatDto {
  @IsString() @MinLength(1) input!: string;
  @IsOptional() @IsString() actor?: string;
}

class TeachDto {
  @IsString() @MinLength(1) text!: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsIn(['global','session']) scope?: 'global'|'session';
}

@Controller('api')
export class ApiController {
  constructor(private readonly mgm: MgmService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Headers('x-session-id') sid: string) {
    return this.mgm.respond({ input: dto.input, actor: dto.actor }, sid);
  }

  @Post('teach')
  async teach(@Body() dto: TeachDto, @Headers('x-session-id') sid: string) {
    const scope = dto.scope ?? 'session';
    const tags = dto.tags ?? [];
    return this.mgm.teach({ text: dto.text, tags, scope }, sid);
  }
}
