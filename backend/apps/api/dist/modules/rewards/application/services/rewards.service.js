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
exports.RewardsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const coupon_code_1 = require("../../domain/coupon-code");
let RewardsService = class RewardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listActive() {
        return this.prisma.reward.findMany({
            where: { active: true },
            orderBy: { cost: 'asc' },
        });
    }
    async getById(id) {
        const reward = await this.prisma.reward.findUnique({ where: { id } });
        if (!reward)
            throw new common_1.NotFoundException('Reward not found');
        return reward;
    }
    async redeem(userId, rewardId) {
        const reward = await this.getById(rewardId);
        if (!reward.active)
            throw new common_1.ConflictException('Reward is not available');
        return this.prisma.$transaction(async (tx) => {
            const agg = await tx.pointsTransaction.aggregate({
                where: { userId },
                _sum: { delta: true },
            });
            const balance = agg._sum.delta ?? 0;
            if (balance < reward.cost) {
                throw new common_1.ConflictException('Insufficient points balance');
            }
            await tx.pointsTransaction.create({
                data: { userId, delta: -reward.cost, reason: client_1.PointsReason.REDEMPTION },
            });
            const redemption = await tx.redemption.create({
                data: { userId, rewardId, couponCode: (0, coupon_code_1.generateCouponCode)() },
            });
            return {
                id: redemption.id,
                rewardId,
                rewardName: reward.name,
                couponCode: redemption.couponCode,
                status: redemption.status,
                redeemedAt: redemption.redeemedAt.toISOString(),
                remainingBalance: balance - reward.cost,
            };
        });
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map