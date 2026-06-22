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
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const points_strategy_resolver_1 = require("./points-strategy-resolver");
let PointsService = class PointsService {
    constructor(resolver) {
        this.resolver = resolver;
    }
    pointsForItem(config, quantity, unitPrice) {
        return this.resolver
            .resolve(config.type)
            .calculate({ quantity, unitPrice }, config);
    }
    calculateSessionTotal(session) {
        return session.totalPoints();
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [points_strategy_resolver_1.PointsStrategyResolver])
], PointsService);
//# sourceMappingURL=points.service.js.map