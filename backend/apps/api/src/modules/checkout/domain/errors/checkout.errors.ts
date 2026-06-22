/**
 * Checkout domain errors (README §2.2 Rule 1 — pure TypeScript, no framework).
 * Each carries a stable `code` that the GlobalExceptionFilter maps to the HTTP
 * status / error code in the README §2.8 Error Handling Matrix. Throwing a typed
 * `DomainError` subclass (never a generic `Error`) is the rule for rule violations.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Restore prototype chain for instanceof across transpilation targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Illegal session state transition (README §2.3 State Machine). */
export class InvalidTransitionError extends DomainError {
  readonly code = 'INVALID_TRANSITION';
  constructor(from: string, event: string) {
    super(`Illegal transition: cannot apply "${event}" while in "${from}".`);
  }
}

/** Checkout requested with an empty cart (README §2.3 guard: items > 0). */
export class EmptyCartError extends DomainError {
  readonly code = 'EMPTY_CART';
  constructor() {
    super('Cannot request checkout: the session has no items.');
  }
}

/** Item id does not belong to the session (README §2.8 Workflow 4 step 4). */
export class ItemNotFoundError extends DomainError {
  readonly code = 'ITEM_NOT_FOUND';
  constructor(itemId: string) {
    super(`Item "${itemId}" does not belong to this session.`);
  }
}

/**
 * POS-scanned items do not match the frozen cart hash (README §2.3 QR /
 * §2.8 Workflow 1). Maps to QR_ITEM_MISMATCH (422); session → VALIDATION_FAILED.
 */
export class QrItemMismatchError extends DomainError {
  readonly code = 'QR_ITEM_MISMATCH';
  constructor() {
    super('Scanned items do not match the cart sealed at QR generation.');
  }
}

/** Unknown points strategy type (README §2.3 Points — Open/Closed). */
export class UnknownStrategyError extends DomainError {
  readonly code = 'UNKNOWN_STRATEGY';
  constructor(type: string) {
    super(`No points strategy registered for type "${type}".`);
  }
}
