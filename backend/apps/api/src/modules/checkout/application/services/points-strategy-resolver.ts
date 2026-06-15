import { Injectable } from '@nestjs/common';
import type { PointsConfig } from '@smartcart/shared-types';
import { UnknownStrategyError } from '../../domain/errors/checkout.errors';
import { FixedPointsStrategy } from '../../domain/strategies/fixed-points.strategy';
import type { IPointsCalculationStrategy } from '../../domain/strategies/points-calculation-strategy.interface';
import { SpendMultiplierStrategy } from '../../domain/strategies/spend-multiplier.strategy';
import { VolumeTierStrategy } from '../../domain/strategies/volume-tier.strategy';
import { WeekendBonusStrategy } from '../../domain/strategies/weekend-bonus.strategy';

/**
 * Strategy registry (README §2.3 Points — Open/Closed). Adding a scheme = add a
 * strategy class + register it here; nothing else changes.
 */
@Injectable()
export class PointsStrategyResolver {
  private readonly strategies = new Map<
    PointsConfig['type'],
    IPointsCalculationStrategy
  >();

  constructor() {
    this.register(new FixedPointsStrategy());
    this.register(new SpendMultiplierStrategy());
    this.register(new VolumeTierStrategy());
    this.register(new WeekendBonusStrategy());
  }

  private register(strategy: IPointsCalculationStrategy): void {
    this.strategies.set(strategy.strategyType, strategy);
  }

  resolve(type: PointsConfig['type']): IPointsCalculationStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) throw new UnknownStrategyError(type);
    return strategy;
  }
}
