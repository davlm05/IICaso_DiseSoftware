import type { ShoppingSession } from '../../domain/entities/shopping-session.entity';

export interface NewSessionItem {
  productId: string;
  barcode: string;
  quantity: number;
  pointsValue: number;
}

/**
 * Session persistence port (README §2.2 Rule 3 — repositories live in
 * infrastructure; the application layer depends on this interface only).
 * The critical validate→credit path runs in a Prisma `$transaction` inside
 * CheckoutService; these methods cover the non-transactional reads/writes.
 */
export interface ISessionRepository {
  create(userId: string, storeId: string): Promise<ShoppingSession>;
  findById(id: string): Promise<ShoppingSession | null>;
  findActiveByUser(userId: string): Promise<ShoppingSession | null>;
  addItem(sessionId: string, item: NewSessionItem): Promise<ShoppingSession>;
  removeItem(sessionId: string, itemId: string): Promise<ShoppingSession>;
  /** Persist PENDING_CHECKOUT status + computed item hash (after QR gen). */
  markPendingCheckout(sessionId: string, itemHash: string): Promise<void>;
  /** Cron support: ACTIVE sessions created before `cutoff`. */
  findActiveOlderThan(cutoff: Date): Promise<ShoppingSession[]>;
  markExpired(sessionId: string): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
