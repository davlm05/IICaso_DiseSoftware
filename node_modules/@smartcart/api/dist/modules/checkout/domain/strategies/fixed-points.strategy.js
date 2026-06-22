"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedPointsStrategy = void 0;
class FixedPointsStrategy {
    constructor() {
        this.strategyType = 'FIXED_PER_UNIT';
    }
    calculate(item, config) {
        if (config.type !== 'FIXED_PER_UNIT')
            return 0;
        return config.value * item.quantity;
    }
}
exports.FixedPointsStrategy = FixedPointsStrategy;
//# sourceMappingURL=fixed-points.strategy.js.map