import type { PointsConfig } from '@smartcart/shared-types';
import type {
  IPointsCalculationStrategy,
  PointsCalculationItem,
} from './points-calculation-strategy.interface';

/**
 * VOLUME_TIER: find the tier matching the quantity, then
 * `quantity * tier.pointsPerUnit` (README §2.3 Strategy Types).
 */
export class VolumeTierStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'VOLUME_TIER' as const;

  calculate(item: PointsCalculationItem, config: PointsConfig): number {
    if (config.type !== 'VOLUME_TIER') return 0;
    const tier = config.tiers.find(
      (t) => item.quantity >= t.minQty && item.quantity <= t.maxQty,
    );
    if (!tier) return 0;
    return item.quantity * tier.pointsPerUnit;
  }
}
