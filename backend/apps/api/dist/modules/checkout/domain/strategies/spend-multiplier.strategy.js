"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendMultiplierStrategy = void 0;
class SpendMultiplierStrategy {
    constructor() {
        this.strategyType = 'SPEND_MULTIPLIER';
    }
    calculate(item, config) {
        if (config.type !== 'SPEND_MULTIPLIER')
            return 0;
        return Math.round((item.unitPrice ?? 0) * item.quantity * config.value);
    }
}
exports.SpendMultiplierStrategy = SpendMultiplierStrategy;
//# sourceMappingURL=spend-multiplier.strategy.js.map