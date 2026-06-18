import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
}

/**
 * User profile + points balance (README §2.4 /users/me).
 * Balance is DERIVED from the append-only PointsTransaction ledger
 * (`SUM(delta)`), never stored — tamper-evident (README §2.4 integrity rules).
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const pointsBalance = await this.getBalance(userId);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      pointsBalance,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: input.fullName, phone: input.phone },
    });
    return this.getProfile(userId);
  }

  async getPointsHistory(userId: string, limit = 20, offset = 0) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pointsTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.pointsTransaction.count({ where: { userId } }),
    ]);

    return {
      total,
      limit,
      offset,
      items: items.map((t) => ({
        id: t.id,
        delta: t.delta,
        reason: t.reason,
        sessionId: t.sessionId ?? undefined,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  /** Derived balance = SUM(delta) over the ledger. */
  async getBalance(userId: string): Promise<number> {
    const agg = await this.prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  }
}
