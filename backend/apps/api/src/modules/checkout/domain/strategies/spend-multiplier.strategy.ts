import type { PointsConfig } from '@smartcart/shared-types';
import type {
  IPointsCalculationStrategy,
  PointsCalculationItem,
} from './points-calculation-strategy.interface';

/** SPEND_MULTIPLIER: `round(unitPrice * quantity * value)` (README §2.3). */
export class SpendMultiplierStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'SPEND_MULTIPLIER' as const;

  calculate(item: PointsCalculationItem, config: PointsConfig): number {
    if (config.type !== 'SPEND_MULTIPLIER') return 0;
    return Math.round((item.unitPrice ?? 0) * item.quantity * config.value);
  }
}
