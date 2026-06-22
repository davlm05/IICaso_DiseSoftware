"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUserSchema = exports.AuthTokensSchema = exports.RefreshRequestSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = exports.RoleSchema = void 0;
const zod_1 = require("zod");
exports.RoleSchema = zod_1.z.enum([
    'USER',
    'BACKOFFICE_OPERATOR',
    'CATALOG_MANAGER',
    'STORE_ADMIN',
    'SUPER_ADMIN',
]);
exports.RegisterRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    fullName: zod_1.z.string().min(1),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.RefreshRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
exports.AuthTokensSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
});
exports.AuthUserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    role: exports.RoleSchema,
});
//# sourceMappingURL=auth.schemas.js.map