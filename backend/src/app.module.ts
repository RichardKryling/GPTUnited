import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';
import { ApiController } from './api.controller';
import { MgmService } from './mgm.service';
import { WsGateway } from './ws.gateway';
import { RequireSession, SessionThrottlerGuard } from './rate';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): ThrottlerModuleOptions | ThrottlerModuleOptions[] => {
        const ttl = Number(cfg.get('RATE_LIMIT_WINDOW_MS') ?? 60000);
        const limit = Number(cfg.get('RATE_LIMIT_MAX') ?? 120);
        return [{ ttl, limit }];
      },
    }),
  ],
  controllers: [HealthController, ApiController],
  providers: [
    MgmService,
    WsGateway,
    { provide: APP_GUARD, useClass: SessionThrottlerGuard }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireSession)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
