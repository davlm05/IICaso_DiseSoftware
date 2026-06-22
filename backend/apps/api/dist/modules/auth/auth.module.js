"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./application/services/auth.service");
const password_service_1 = require("./infrastructure/crypto/password.service");
const jwt_service_1 = require("./infrastructure/crypto/jwt.service");
const jwt_strategy_1 = require("./infrastructure/jwt.strategy");
const auth_controller_1 = require("./presentation/controllers/auth.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [passport_1.PassportModule],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, password_service_1.PasswordService, jwt_service_1.TokenService, jwt_strategy_1.JwtStrategy],
        exports: [password_service_1.PasswordService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map