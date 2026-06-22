import type { SessionStatus } from '@smartcart/shared-types';

/**
 * Real-time notifier port (README §2.8 Workflow 1 step 5).
 * Dependency inversion so the application can push a status change without
 * importing the presentation-layer WebSocket gateway. `SessionGateway`
 * implements this and emits `sessionStatusChanged` to the per-session room.
 * A push failure is best-effort and never rolls back the sale.
 */
export const SESSION_NOTIFIER = 'ISessionNotifier';

export interface SessionStatusChange {
  sessionId: string;
  status: SessionStatus;
  pointsAwarded?: number;
}

export interface ISessionNotifier {
  notifyStatusChanged(change: SessionStatusChange): void;
}
