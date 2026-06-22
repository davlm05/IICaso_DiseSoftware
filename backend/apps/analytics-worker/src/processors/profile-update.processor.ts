import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { CheckoutCompletedEventPayload } from '@smartcart/shared-types';
import type { Job } from 'bullmq';
import { AiInferenceClient } from '../infrastructure/ai/ai-inference.client';
import { SegmentRepository } from '../infrastructure/repositories/segment.repository';
import { ANALYTICS_QUEUE } from '../queues/queue.constants';
import { ProfileAggregatorService } from '../services/profile-aggregator.service';

/**
 * Consumes `analytics-profile-update` jobs (README §2.3 step 2, §2.8 Workflow 2).
 * Aggregate → (skip if < 5 tx) → classify (cached) → upsert segment.
 * Errors bubble so BullMQ retries with backoff (jobs are idempotent).
 */
@Processor(ANALYTICS_QUEUE)
export class ProfileUpdateProcessor extends WorkerHost {
  private readonly logger = new Logger(ProfileUpdateProcessor.name);

  constructor(
    private readonly aggregator: ProfileAggregatorService,
    private readonly ai: AiInferenceClient,
    private readonly segments: SegmentRepository,
  ) {
    super();
  }

  async process(job: Job<CheckoutCompletedEventPayload>): Promise<void> {
    const { userId, storeId } = job.data;

    const features = await this.aggregator.aggregate(userId);
    if (!features) {
      this.logger.debug(`Skipping ${userId}: fewer than 5 transactions.`);
      return; // not enough history — no segment written
    }

    const segmentName = await this.ai.classify(userId, features);
    await this.segments.upsertSegment(
      userId,
      segmentName,
      features as unknown as Record<string, unknown>,
      storeId,
    );

    this.logger.log(`Classified ${userId} → "${segmentName}".`);
  }
}
