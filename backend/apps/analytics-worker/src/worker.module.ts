import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateWorkerEnv } from './config/worker-env.validation';
import { AiInferenceClient } from './infrastructure/ai/ai-inference.client';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { RedisService } from './infrastructure/redis/redis.service';
import { SegmentRepository } from './infrastructure/repositories/segment.repository';
import { ProfileUpdateProcessor } from './processors/profile-update.processor';
import { ANALYTICS_QUEUE } from './queues/queue.constants';
import { ProfileAggregatorService } from './services/profile-aggregator.service';

/**
 * Analytics worker root module (README §2.2 separate worker process).
 * Registers the BullMQ connection + queue and the consumer-profiling pipeline.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateWorkerEnv }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: ANALYTICS_QUEUE }),
  ],
  providers: [
    PrismaService,
    RedisService,
    ProfileAggregatorService,
    AiInferenceClient,
    SegmentRepository,
    ProfileUpdateProcessor,
  ],
})
export class WorkerModule {}
