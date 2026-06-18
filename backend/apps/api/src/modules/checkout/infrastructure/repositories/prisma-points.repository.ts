import { Injectable } from '@nestjs/common';
import { PointsReason, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

/**
 * Append-only points ledger writes (README §2.4 PointsTransaction — immutable,
 * never updated/deleted; balance = SUM(delta)). The credit runs inside the
 * caller's `$transaction` so session completion and the ledger entry commit
 * atomically (README §2.3 Pattern Interaction step 4).
 */
@Injectable()
export class PrismaPointsRepository {
  constructor(private readonly prisma: PrismaService) {}

  creditPurchase(
    tx: Prisma.TransactionClient,
    params: { userId: string; sessionId: string; delta: number },
  ): Promise<unknown> {
    return tx.pointsTransaction.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        delta: params.delta,
        reason: PointsReason.PURCHASE,
      },
    });
  }

  async getBalance(userId: string): Promise<number> {
    const agg = await this.prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  }
}
