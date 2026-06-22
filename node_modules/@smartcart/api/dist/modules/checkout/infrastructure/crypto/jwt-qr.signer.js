"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtQrSigner = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt = __importStar(require("jsonwebtoken"));
const checkout_errors_1 = require("../../domain/errors/checkout.errors");
let JwtQrSigner = class JwtQrSigner {
    constructor(config) {
        this.secret = config.getOrThrow('QR_SIGNING_SECRET');
    }
    sign(payload) {
        const token = jwt.sign(payload, this.secret, {
            algorithm: 'HS256',
            expiresIn: '10m',
        });
        const decoded = jwt.decode(token);
        return { token, expiresAt: new Date(decoded.exp * 1000) };
    }
    verify(token) {
        try {
            const decoded = jwt.verify(token, this.secret, {
                algorithms: ['HS256'],
                clockTolerance: 10,
            });
            return {
                sessionId: decoded.sessionId,
                userId: decoded.userId,
                itemHash: decoded.itemHash,
            };
        }
        catch (err) {
            if (err instanceof jwt.TokenExpiredError)
                throw new checkout_errors_1.QrTokenExpiredError();
            throw new checkout_errors_1.InvalidQrTokenError();
        }
    }
};
exports.JwtQrSigner = JwtQrSigner;
exports.JwtQrSigner = JwtQrSigner = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtQrSigner);
//# sourceMappingURL=jwt-qr.signer.js.map