import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RedisService } from '../redis/redis.service';
import type { FeatureVector } from '../../services/profile-aggregator.service';

const SEGMENT_TTL = 24 * 60 * 60; // 24h cache (README §2.3 step 4)
const segmentKey = (userId: string) => `segment:${userId}`;

/**
 * AI inference client (README §2.3 step 4, §2.5 A10 SSRF).
 * The base URL is fixed at construction from `AI_INFERENCE_URL` (validated as an
 * HTTPS URL at startup) and never derived from job data. On a Redis cache miss
 * it POSTs the feature vector to `/classify`. HTTP failures throw so BullMQ
 * retries the job per its retry config (README §2.3 resilience).
 */
@Injectable()
export class AiInferenceClient {
  private readonly logger = new Logger(AiInferenceClient.name);
  private readonly http: AxiosInstance;

  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
  ) {
    // Fixed value — never interpolate job data into the base URL (SSRF).
    const baseURL = config.getOrThrow<string>('AI_INFERENCE_URL');
    const timeout = config.get<number>('AI_REQUEST_TIMEOUT_MS', 5000);
    this.http = axios.create({ baseURL, timeout });
  }

  async classify(userId: string, features: FeatureVector): Promise<string> {
    const cached = await this.redis.get(segmentKey(userId));
    if (cached) return cached;

    // Throws on network/5xx — the processor lets it bubble so BullMQ retries.
    const { data } = await this.http.post<{ segment: string }>(
      '/classify',
      features,
    );
    const segment = data.segment;

    await this.redis.set(segmentKey(userId), segment, 'EX', SEGMENT_TTL);
    return segment;
  }
}
