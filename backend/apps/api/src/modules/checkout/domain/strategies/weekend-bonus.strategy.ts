import type { PointsConfig } from '@smartcart/shared-types';
import type {
  IPointsCalculationStrategy,
  PointsCalculationItem,
} from './points-calculation-strategy.interface';

/**
 * WEEKEND_BONUS: `basePoints * quantity * (isWeekend ? weekendMultiplier : 1)`
 * (README §2.3 Strategy Types). Weekend = Saturday/Sunday at evaluation time.
 */
export class WeekendBonusStrategy implements IPointsCalculationStrategy {
  readonly strategyType = 'WEEKEND_BONUS' as const;

  calculate(
    item: PointsCalculationItem,
    config: PointsConfig,
    now: Date = new Date(),
  ): number {
    if (config.type !== 'WEEKEND_BONUS') return 0;
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const multiplier = isWeekend ? config.weekendMultiplier : 1;
    return Math.round(config.basePoints * item.quantity * multiplier);
  }
}
