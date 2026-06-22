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
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../infrastructure/prisma/prisma.service");
const api_key_decorator_1 = require("../decorators/api-key.decorator");
let ApiKeyGuard = class ApiKeyGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredType = this.reflector.getAllAndOverride(api_key_decorator_1.API_KEY_TYPE, [context.getHandler(), context.getClass()]);
        if (!requiredType)
            return true;
        const req = context.switchToHttp().getRequest();
        const provided = req.headers['x-api-key'];
        if (!provided)
            throw new common_1.UnauthorizedException('Missing x-api-key header');
        const hashedKey = (0, node_crypto_1.createHash)('sha256').update(provided).digest('hex');
        const apiKey = await this.prisma.apiKey.findUnique({ where: { hashedKey } });
        if (!apiKey || apiKey.type !== requiredType) {
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        req.apiKey = { id: apiKey.id, type: apiKey.type, storeId: apiKey.storeId };
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map