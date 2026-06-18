import type { SessionStatus } from '@smartcart/shared-types';
import { createHash } from 'node:crypto';
import {
  EmptySessionError,
  QrItemMismatchError,
} from '../errors/checkout.errors';
import { nextStatus, type SessionEvent } from '../state-machine/session-state-machine';

export interface SessionItemEntity {
  id: string;
  productId: string;
  barcode: string;
  quantity: number;
  pointsValue: number;
}

export interface ShoppingSessionProps {
  id: string;
  userId: string;
  storeId: string;
  status: SessionStatus;
  items: SessionItemEntity[];
  itemHash: string | null;
  createdAt: Date;
}

/**
 * ShoppingSession aggregate root (README §2.3 §2 & §4). Pure TypeScript — no
 * NestJS, no Prisma. Transitions go through the state machine; the anti-tamper
 * item hash is computed here so QR-generation and POS-validation share one algo.
 */
export class ShoppingSession {
  private constructor(private props: ShoppingSessionProps) {}

  static reconstitute(props: ShoppingSessionProps): ShoppingSession {
    return new ShoppingSession(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get storeId(): string {
    return this.props.storeId;
  }
  get status(): SessionStatus {
    return this.props.status;
  }
  get items(): readonly SessionItemEntity[] {
    return this.props.items;
  }
  get itemHash(): string | null {
    return this.props.itemHash;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  // ── State transitions ──────────────────────────────────────────────────────
  private apply(event: SessionEvent): void {
    this.props.status = nextStatus(this.props.status, event);
  }

  /** ACTIVE → PENDING_CHECKOUT. Guard: at least one item. */
  requestCheckout(): void {
    if (this.props.items.length === 0) throw new EmptySessionError();
    this.apply('REQUEST_CHECKOUT');
    this.props.itemHash = this.computeItemHash();
  }

  /** PENDING_CHECKOUT → COMPLETED. */
  completeValidation(): void {
    this.apply('COMPLETE_VALIDATION');
  }

  /** PENDING_CHECKOUT → VALIDATION_FAILED. */
  markValidationFailed(): void {
    this.apply('MARK_VALIDATION_FAILED');
  }

  /** → EXPIRED (idempotent for COMPLETED). */
  expire(): void {
    this.apply('EXPIRE');
  }

  // ── Anti-tamper hash (README §2.3 §2) ───────────────────────────────────────
  /**
   * SHA-256 of the alphabetically-sorted barcodes joined by "|". Both QR
   * generation and POS validation MUST use this exact algorithm.
   */
  computeItemHash(): string {
    return ShoppingSession.hashBarcodes(this.props.items.map((i) => i.barcode));
  }

  /** Throws if the POS-scanned barcodes do not match the stored item hash. */
  validateItems(scannedBarcodes: string[]): void {
    const expected = this.props.itemHash ?? this.computeItemHash();
    if (ShoppingSession.hashBarcodes(scannedBarcodes) !== expected) {
      throw new QrItemMismatchError();
    }
  }

  static hashBarcodes(barcodes: string[]): string {
    const canonical = [...barcodes].sort().join('|');
    return createHash('sha256').update(canonical).digest('hex');
  }

  totalPoints(): number {
    return this.props.items.reduce((sum, i) => sum + i.pointsValue, 0);
  }
}
