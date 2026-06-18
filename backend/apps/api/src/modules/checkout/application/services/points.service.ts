import { Injectable } from '@nestjs/common';
import type { PointsConfig } from '@smartcart/shared-types';
import type { ShoppingSession } from '../../domain/entities/shopping-session.entity';
import { PointsStrategyResolver } from './points-strategy-resolver';

/**
 * Points accrual (README §2.3 Points). Delegates each item to the Strategy
 * resolved from its pointsConfig.type. Per-item points are computed when the
 * item is scanned and stored on SessionItem; the session total is their sum.
 *
 * MVP note: unlike the README's "skip sponsored" rule, sponsored products DO
 * earn points here, matching the frontend mock where sponsored items show
 * point values. The `sponsored` flag drives display only.
 */
@Injectable()
export class PointsService {
  constructor(private readonly resolver: PointsStrategyResolver) {}

  /** Points for a single scanned line. */
  pointsForItem(
    config: PointsConfig,
    quantity: number,
    unitPrice?: number,
  ): number {
    return this.resolver
      .resolve(config.type)
      .calculate({ quantity, unitPrice }, config);
  }

  /** Total points credited at validation = sum of each item's stored value. */
  calculateSessionTotal(session: ShoppingSession): number {
    return session.totalPoints();
  }
}
