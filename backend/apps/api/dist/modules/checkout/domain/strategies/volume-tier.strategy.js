"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolumeTierStrategy = void 0;
class VolumeTierStrategy {
    constructor() {
        this.strategyType = 'VOLUME_TIER';
    }
    calculate(item, config) {
        if (config.type !== 'VOLUME_TIER')
            return 0;
        const tier = config.tiers.find((t) => item.quantity >= t.minQty && item.quantity <= t.maxQty);
        if (!tier)
            return 0;
        return item.quantity * tier.pointsPerUnit;
    }
}
exports.VolumeTierStrategy = VolumeTierStrategy;
//# sourceMappingURL=volume-tier.strategy.js.map