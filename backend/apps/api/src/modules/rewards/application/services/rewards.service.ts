import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PointsReason } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { generateCouponCode } from '../../domain/coupon-code';

/**
 * Rewards catalog + redemption (README §2.4 /rewards).
 * Redeeming debits the points ledger and issues a coupon atomically so a
 * balance can never go negative or a coupon be issued without a debit.
 */
@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.reward.findMany({
      where: { active: true },
      orderBy: { cost: 'asc' },
    });
  }

  async getById(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async redeem(userId: string, rewardId: string) {
    const reward = await this.getById(rewardId);
    if (!reward.active) throw new ConflictException('Reward is not available');

    return this.prisma.$transaction(async (tx) => {
      // Derived balance inside the transaction to prevent double-spend.
      const agg = await tx.pointsTransaction.aggregate({
        where: { userId },
        _sum: { delta: true },
      });
      const balance = agg._sum.delta ?? 0;
      if (balance < reward.cost) {
        throw new ConflictException('Insufficient points balance');
      }

      await tx.pointsTransaction.create({
        data: { userId, delta: -reward.cost, reason: PointsReason.REDEMPTION },
      });

      const redemption = await tx.redemption.create({
        data: { userId, rewardId, couponCode: generateCouponCode() },
      });

      return {
        id: redemption.id,
        rewardId,
        rewardName: reward.name,
        couponCode: redemption.couponCode,
        status: redemption.status,
        redeemedAt: redemption.redeemedAt.toISOString(),
        remainingBalance: balance - reward.cost,
      };
    });
  }
}
