import type { PointsConfig } from '@smartcart/shared-types';

/**
 * Strategy pattern for points accrual (README §2.3 Points Calculation).
 * Adding a scheme = a new class implementing this interface + one line in the
 * resolver (Open/Closed). Pure domain — no framework, no I/O.
 */
export interface PointsCalculationItem {
  quantity: number;
  /** Unit price; only consumed by SPEND_MULTIPLIER. */
  unitPrice?: number;
}

export interface IPointsCalculationStrategy {
  /** Discriminator that matches PointsConfig.type. */
  readonly strategyType: PointsConfig['type'];
  calculate(item: PointsCalculationItem, config: PointsConfig): number;
}
