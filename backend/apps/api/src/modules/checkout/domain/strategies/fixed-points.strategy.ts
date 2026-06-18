import type { PointsConfig } from '@smartcart/shared-types';
import type {
  IPointsCalculationStrategy,
  PointsCalculationItem,
} from './points-calculation-strategy.interface';

/** FIXED_PER_UNIT: `value * quantity` (README §2.3 Strategy Types). */
export class FixedPointsStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'FIXED_PER_UNIT' as const;

  calculate(item: PointsCalculationItem, config: PointsConfig): number {
    if (config.type !== 'FIXED_PER_UNIT') return 0;
    return config.value * item.quantity;
  }
}
