"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeekendBonusStrategy = void 0;
class WeekendBonusStrategy {
    constructor() {
        this.strategyType = 'WEEKEND_BONUS';
    }
    calculate(item, config, now = new Date()) {
        if (config.type !== 'WEEKEND_BONUS')
            return 0;
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6;
        const multiplier = isWeekend ? config.weekendMultiplier : 1;
        return Math.round(config.basePoints * item.quantity * multiplier);
    }
}
exports.WeekendBonusStrategy = WeekendBonusStrategy;
//# sourceMappingURL=weekend-bonus.strategy.js.map