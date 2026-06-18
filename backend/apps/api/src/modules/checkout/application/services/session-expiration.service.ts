import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SESSION_REPOSITORY,
  type ISessionRepository,
} from '../interfaces/session-repository.interface';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Cron cleanup of stale carts (README §2.3 §4). Every 5 minutes, ACTIVE
 * sessions older than 2 hours are transitioned to EXPIRED.
 */
@Injectable()
export class SessionExpirationService {
  private readonly logger = new Logger('SessionExpiration');

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - TWO_HOURS_MS);
    const stale = await this.sessions.findActiveOlderThan(cutoff);
    if (stale.length === 0) return;

    for (const session of stale) {
      session.expire();
      await this.sessions.markExpired(session.id);
    }
    this.logger.log(`Expired ${stale.length} stale session(s)`);
  }
}
