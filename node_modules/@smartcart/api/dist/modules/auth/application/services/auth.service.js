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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
const password_service_1 = require("../../infrastructure/crypto/password.service");
const jwt_service_1 = require("../../infrastructure/crypto/jwt.service");
let AuthService = class AuthService {
    constructor(prisma, passwords, tokens) {
        this.prisma = prisma;
        this.passwords = passwords;
        this.tokens = tokens;
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (exists)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await this.passwords.hash(dto.password);
        const user = await this.prisma.user.create({
            data: { email: dto.email, fullName: dto.fullName, passwordHash },
        });
        return this.issue(user);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !(await this.passwords.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.issue(user);
    }
    async refresh(refreshToken) {
        let sub;
        try {
            ({ sub } = this.tokens.verifyRefresh(refreshToken));
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findUnique({ where: { id: sub } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        return this.issue(user);
    }
    async logout() {
        return;
    }
    issue(user) {
        const authUser = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            accessToken: this.tokens.signAccess({
                sub: user.id,
                email: user.email,
                role: user.role,
            }),
            refreshToken: this.tokens.signRefresh({ sub: user.id }),
            user: authUser,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        password_service_1.PasswordService,
        jwt_service_1.TokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map