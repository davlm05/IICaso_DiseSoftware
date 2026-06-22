import { ShoppingSession } from '../entities/shopping-session.entity';

/**
 * QrTicket — immutable value object (README §2.3 / component diagram).
 * Wraps the signed checkout token plus the data needed to validate it at the POS:
 * the frozen item hash and the 10-minute expiry read from the JWT `exp` claim.
 */
export class QrTicket {
  readonly token: string;
  readonly expiresAt: Date;
  readonly sessionId: string;
  readonly itemHash: string;

  constructor(props: {
    token: string;
    expiresAt: Date;
    sessionId: string;
    itemHash: string;
  }) {
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.sessionId = props.sessionId;
    this.itemHash = props.itemHash;
    Object.freeze(this);
  }

  /** True once past the 10-minute window (README §2.3 QR expiry). */
  isExpired(now: Date = new Date()): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }

  /** True if the POS-scanned barcodes reproduce the sealed item hash. */
  verifyHash(scannedBarcodes: string[]): boolean {
    return ShoppingSession.hashBarcodes(scannedBarcodes) === this.itemHash;
  }
}
