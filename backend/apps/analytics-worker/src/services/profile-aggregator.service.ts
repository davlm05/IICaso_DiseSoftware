import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

/** Rolling window + minimum history (README §2.3 Consumer Profiling step 3). */
const WINDOW_DAYS = 90;
const MIN_TRANSACTIONS = 5;

/**
 * Behavioral feature vector sent to the AI classifier (README §2.3 step 3).
 * NOTE: the README schema persists neither product `category` nor `price`, so
 * `category_frequency` uses brand as the category proxy and `avg_ticket` uses
 * points-per-purchase as the spend proxy. Wire real fields in when the schema adds them.
 */
export interface FeatureVector {
  category_frequency: Record<string, number>;
  avg_ticket: number;
  avg_purchase_hour: number;
  weekly_frequency: number;
  sponsored_ratio: number;
  organic_preference_score: number;
}

/**
 * Computes a user's 90-day behavioral profile (README §2.3 steps 2–3,
 * §2.8 Workflow 2). Returns `null` when the user has fewer than 5 PURCHASE
 * transactions — too little history to classify meaningfully.
 */
@Injectable()
export class ProfileAggregatorService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregate(userId: string): Promise<FeatureVector | null> {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const purchases = await this.prisma.pointsTransaction.findMany({
      where: { userId, reason: 'PURCHASE', createdAt: { gte: since } },
      select: { delta: true, createdAt: true, sessionId: true },
    });

    // Guard: skip classification below the minimum history (README §2.3).
    if (purchases.length < MIN_TRANSACTIONS) return null;

    const avg_ticket =
      purchases.reduce((sum, p) => sum + p.delta, 0) / purchases.length;
    const avg_purchase_hour =
      purchases.reduce((sum, p) => sum + p.createdAt.getUTCHours(), 0) /
      purchases.length;
    const weekly_frequency = purchases.length / (WINDOW_DAYS / 7);

    // Join the purchased line items to derive category/sponsored features.
    const sessionIds = purchases
      .map((p) => p.sessionId)
      .filter((id): id is string => id !== null);

    const items = await this.prisma.sessionItem.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { quantity: true, product: { select: { brand: true, sponsored: true } } },
    });

    const category_frequency: Record<string, number> = {};
    let sponsoredUnits = 0;
    let totalUnits = 0;
    for (const item of items) {
      const brand = item.product.brand;
      category_frequency[brand] = (category_frequency[brand] ?? 0) + item.quantity;
      totalUnits += item.quantity;
      if (item.product.sponsored) sponsoredUnits += item.quantity;
    }

    const sponsored_ratio = totalUnits === 0 ? 0 : sponsoredUnits / totalUnits;

    return {
      category_frequency,
      avg_ticket: Math.round(avg_ticket * 100) / 100,
      avg_purchase_hour: Math.round(avg_purchase_hour * 100) / 100,
      weekly_frequency: Math.round(weekly_frequency * 100) / 100,
      sponsored_ratio: Math.round(sponsored_ratio * 100) / 100,
      organic_preference_score: Math.round((1 - sponsored_ratio) * 100) / 100,
    };
  }
}
