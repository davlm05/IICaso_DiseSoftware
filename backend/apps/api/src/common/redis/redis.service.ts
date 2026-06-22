import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Shared Redis connection (README §2.1 Cache, §2.7 stateless services).
 * Backs: session read-through cache, product Cache-Aside, auth lockout / refresh
 * revocation, rate limiting, and B2B analytics cache invalidation.
 */
@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      maxRetriesPerRequest: null, // required by BullMQ-compatible clients
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.status === 'wait') {
      await this.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}
