import type { TransactionContext } from './unit-of-work.interface';

/**
 * Append-only points ledger port (README §2.4 PointsTransaction, §2.5 A04).
 * Balance is DERIVED (`SUM(delta)`) — there is no mutable balance to update, so
 * "crediting points" is simply inserting an immutable ledger row. This is the
 * tamper-evident design from README §2.5 A04 / A08.
 */
export const POINTS_REPOSITORY = 'IPointsRepository';

export type PointsReason = 'PURCHASE' | 'REDEMPTION' | 'ADJUSTMENT';

export interface LedgerEntry {
  userId: string;
  delta: number; // signed
  reason: PointsReason;
  sessionId?: string;
}

export interface IPointsRepository {
  /**
   * Credit points by appending a ledger row (README §2.8 Workflow 1 step 4).
   * NOTE: the README snippet shows `creditPoints()` + `insertLedger()` as two
   * calls; because the balance is derived, both collapse into this single
   * append — there is no separate balance row to mutate (no double counting).
   */
  creditPoints(entry: LedgerEntry, tx?: TransactionContext): Promise<void>;

  /** Current balance = SUM(delta) for the user (README §2.4 integrity rules). */
  getBalance(userId: string, tx?: TransactionContext): Promise<number>;
}
