import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LoggerModule } from 'nestjs-pino';
import { HealthController } from './common/health/health.controller';
import { MetricsModule } from './common/metrics/metrics.module';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { validateEnv } from './config/env.validation';
import { pinoConfig } from './config/pino.config';
import { buildSentryOptions } from './config/sentry.config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CheckoutModule } from './modules/checkout/checkout.module';

/**
 * Root module (README §2.2 modular monolith). Wires global infrastructure
 * (config, logging, Sentry, BullMQ, schedule, Prisma, Redis, metrics) and the
 * four domain modules. The rate limiter is applied to every route.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(pinoConfig),
    SentryModule.forRoot(buildSentryOptions()),
    ScheduleModule.forRoot(),
    TerminusModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    // Global infrastructure
    PrismaModule,
    RedisModule,
    MetricsModule,
    // Domain modules
    AuthModule,
    CatalogModule,
    CheckoutModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [RateLimiterMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}
