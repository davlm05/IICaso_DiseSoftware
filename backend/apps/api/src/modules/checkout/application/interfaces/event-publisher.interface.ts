/**
 * Domain-event publishing port (README §2.3 §1 step 1). In the full design this
 * routes CheckoutCompletedEvent to a BullMQ queue consumed by the analytics
 * worker. The MVP wires a no-op logging publisher (worker is out of scope).
 */
export interface CheckoutCompletedEvent {
  userId: string;
  storeId: string;
  sessionId: string;
  items: { barcode: string; quantity: number; pointsValue: number }[];
  pointsAwarded: number;
  timestamp: string;
}

export interface IEventPublisher {
  publish(event: CheckoutCompletedEvent): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
