import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThrottlerGuard, ThrottlerRequest, seconds } from '@nestjs/throttler';

export const SESSION_HEADER = 'x-session-id';

@Injectable()
export class RequireSession implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const sid = (req.header(SESSION_HEADER) || '').trim();
    if (!sid) {
      throw new BadRequestException('x-session-id required');
    }
    next();
  }
}

/**
 * Rate limit keyed by x-session-id (falls back to IP if missing, though
 * RequireSession middleware should prevent missing header for /api/*).
 */
@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Parameters<ThrottlerGuard['getTracker']>[0]): string {
    const sid = (req.header?.(SESSION_HEADER) || '').trim();
    if (sid) return `sid:${sid}`;
    // fallback to ip
    // @ts-expect-error - Nest attaches ip on req
    const ip: string = (req.ip || req.connection?.remoteAddress || 'unknown') as string;
    return `ip:${ip}`;
  }

  protected getTTL(): number {
    // parent uses milliseconds or seconds depending on version; normalize to seconds
    const ttl = super.getTTL();
    // if parent returns 0 (unset), fall back to 60s
    return ttl || seconds(60);
  }

  protected errorMessage = 'Too many requests. Please slow down.';
}
