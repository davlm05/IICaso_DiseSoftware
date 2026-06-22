/**
 * Unit-of-Work port (README §2.2 Rule 2, §2.8 Workflow 1 step 4).
 * The application orchestrates the ACID `$transaction` through this port so it
 * never imports PrismaClient directly. The infrastructure `PrismaUnitOfWork`
 * implements it by wrapping `prisma.$transaction(...)`.
 */
export const UNIT_OF_WORK = 'IUnitOfWork';

/**
 * Opaque handle to the active transaction. Typed as `unknown` on purpose: the
 * application must not know it is a `Prisma.TransactionClient`. Repositories
 * (infrastructure) narrow it back to the concrete client.
 */
export type TransactionContext = unknown;

export interface IUnitOfWork {
  /**
   * Run `work` inside a single interactive transaction. Everything succeeds or
   * everything rolls back. Do NOT perform external I/O (queue/socket) inside —
   * publish side effects only AFTER this resolves (README §2.2 ACID directive).
   */
  runInTransaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
