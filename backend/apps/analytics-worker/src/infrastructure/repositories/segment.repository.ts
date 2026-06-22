import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/**
 * Consumer-segment persistence (README §2.3 step 5, §2.8 Workflow 2 step 4).
 * UPSERTs exactly one row per user, then invalidates the B2B aggregate caches so
 * the next `/analytics/segments` read recomputes the distribution.
 */
@Injectable()
export class SegmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async upsertSegment(
    userId: string,
    segmentName: string,
    features: Record<string, unknown>,
    storeId: string,
  ): Promise<void> {
    // The aggregated feature vector is stored as JSONB (README §2.4 ConsumerSegment).
    const json = features as Prisma.InputJsonValue;
    await this.prisma.consumerSegment.upsert({
      where: { userId },
      create: { userId, segmentName, features: json },
      update: { segmentName, features: json },
    });

    // Invalidate the aggregated B2B caches (README §2.3 step 5).
    await this.redis.del(`analytics:store:${storeId}:segments`);
    await this.redis.del('analytics:global:segment-distribution');
  }
}
