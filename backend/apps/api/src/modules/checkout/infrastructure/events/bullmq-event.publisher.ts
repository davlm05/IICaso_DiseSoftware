import { Injectable, Logger } from '@nestjs/common';
import type {
  CheckoutCompletedEvent,
  IEventPublisher,
} from '../../application/interfaces/event-publisher.interface';

/**
 * MVP event publisher. The full design (README §2.3 §1) routes
 * CheckoutCompletedEvent to a BullMQ queue (`analytics-profile-update`)
 * consumed by the analytics worker. That worker/Redis/BullMQ are out of MVP
 * scope, so here we just log the event — the call site and contract stay
 * identical, so swapping in BullMQ later is a drop-in change.
 */
@Injectable()
export class LoggingEventPublisher implements IEventPublisher {
  private readonly logger = new Logger('CheckoutCompletedEvent');

  async publish(event: CheckoutCompletedEvent): Promise<void> {
    this.logger.log(
      `checkout.completed user=${event.userId} store=${event.storeId} ` +
        `session=${event.sessionId} points=${event.pointsAwarded}`,
    );
  }
}
