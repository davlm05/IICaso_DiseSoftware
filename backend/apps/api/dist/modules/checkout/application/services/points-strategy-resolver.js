"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsStrategyResolver = void 0;
const common_1 = require("@nestjs/common");
const checkout_errors_1 = require("../../domain/errors/checkout.errors");
const fixed_points_strategy_1 = require("../../domain/strategies/fixed-points.strategy");
const spend_multiplier_strategy_1 = require("../../domain/strategies/spend-multiplier.strategy");
const volume_tier_strategy_1 = require("../../domain/strategies/volume-tier.strategy");
const weekend_bonus_strategy_1 = require("../../domain/strategies/weekend-bonus.strategy");
let PointsStrategyResolver = class PointsStrategyResolver {
    constructor() {
        this.strategies = new Map();
        this.register(new fixed_points_strategy_1.FixedPointsStrategy());
        this.register(new spend_multiplier_strategy_1.SpendMultiplierStrategy());
        this.register(new volume_tier_strategy_1.VolumeTierStrategy());
        this.register(new weekend_bonus_strategy_1.WeekendBonusStrategy());
    }
    register(strategy) {
        this.strategies.set(strategy.strategyType, strategy);
    }
    resolve(type) {
        const strategy = this.strategies.get(type);
        if (!strategy)
            throw new checkout_errors_1.UnknownStrategyError(type);
        return strategy;
    }
};
exports.PointsStrategyResolver = PointsStrategyResolver;
exports.PointsStrategyResolver = PointsStrategyResolver = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PointsStrategyResolver);
//# sourceMappingURL=points-strategy-resolver.js.map