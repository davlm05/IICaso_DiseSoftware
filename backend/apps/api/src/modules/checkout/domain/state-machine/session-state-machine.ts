import type { SessionStatus } from '@smartcart/shared-types';
import { InvalidTransitionError } from '../errors/checkout.errors';

/**
 * Finite state machine for the shopping session lifecycle (README §2.3 §4).
 *
 *   ACTIVE ──requestCheckout──▶ PENDING_CHECKOUT ──complete──▶ COMPLETED
 *      │                              │            ──fail────▶ VALIDATION_FAILED
 *      └──expire──▶ EXPIRED ◀──expire─┘
 *   COMPLETED ──expire──▶ COMPLETED  (idempotent, no-op)
 *
 * Pure: takes the current status + event, returns the next status, or throws.
 * Business guards (e.g. items > 0) live on the entity that calls this.
 */
export type SessionEvent =
  | 'REQUEST_CHECKOUT'
  | 'COMPLETE_VALIDATION'
  | 'MARK_VALIDATION_FAILED'
  | 'EXPIRE';

const TABLE: Record<SessionStatus, Partial<Record<SessionEvent, SessionStatus>>> = {
  ACTIVE: {
    REQUEST_CHECKOUT: 'PENDING_CHECKOUT',
    EXPIRE: 'EXPIRED',
  },
  PENDING_CHECKOUT: {
    COMPLETE_VALIDATION: 'COMPLETED',
    MARK_VALIDATION_FAILED: 'VALIDATION_FAILED',
    EXPIRE: 'EXPIRED',
  },
  COMPLETED: {
    EXPIRE: 'COMPLETED', // idempotent
  },
  VALIDATION_FAILED: {},
  EXPIRED: {},
};

export function nextStatus(
  current: SessionStatus,
  event: SessionEvent,
): SessionStatus {
  const next = TABLE[current]?.[event];
  if (!next) {
    throw new InvalidTransitionError(
      `Cannot apply "${event}" from state "${current}"`,
    );
  }
  return next;
}
