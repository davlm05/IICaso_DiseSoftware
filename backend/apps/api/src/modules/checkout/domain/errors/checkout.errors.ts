import { DomainError } from '../../../../common/errors/domain-error';

/** Invalid state-machine transition (README §2.3 Session State Machine). */
export class InvalidTransitionError extends DomainError {
  readonly httpStatus = 409;
  readonly code = 'INVALID_SESSION_TRANSITION';
}

/** requestCheckout() on an empty cart (README §2.3 guard: items > 0). */
export class EmptySessionError extends DomainError {
  readonly httpStatus = 422;
  readonly code = 'EMPTY_SESSION';
  constructor() {
    super('Cannot generate a checkout QR for a session with no items');
  }
}

/** POS-scanned cart does not match the QR item hash (README §2.3 anti-tamper). */
export class QrItemMismatchError extends DomainError {
  readonly httpStatus = 409;
  readonly code = 'QR_ITEM_MISMATCH';
  constructor() {
    super('Scanned items do not match the items in the QR token');
  }
}

/** QR token expired (10-minute window). */
export class QrTokenExpiredError extends DomainError {
  readonly httpStatus = 410;
  readonly code = 'QR_TOKEN_EXPIRED';
  constructor() {
    super('QR token has expired');
  }
}

/** QR token signature invalid / malformed. */
export class InvalidQrTokenError extends DomainError {
  readonly httpStatus = 400;
  readonly code = 'INVALID_QR_TOKEN';
  constructor() {
    super('QR token is invalid');
  }
}

/** No strategy registered for a pointsConfig.type (README §2.3 Points). */
export class UnknownStrategyError extends DomainError {
  readonly httpStatus = 500;
  readonly code = 'UNKNOWN_POINTS_STRATEGY';
  constructor(type: string) {
    super(`No points strategy registered for type "${type}"`);
  }
}

/** Session not found or not owned by the caller. */
export class SessionNotFoundError extends DomainError {
  readonly httpStatus = 404;
  readonly code = 'SESSION_NOT_FOUND';
  constructor() {
    super('Shopping session not found');
  }
}
