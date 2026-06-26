"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPayResponseSchema = exports.QrTicketResponseSchema = exports.ValidateSessionRequestSchema = exports.AddItemRequestSchema = exports.CreateSessionRequestSchema = exports.SessionDTOSchema = exports.SessionItemDTOSchema = exports.ProductDTOSchema = exports.PointsConfigSchema = exports.SessionStatusSchema = exports.BarcodeSchema = void 0;
const zod_1 = require("zod");
exports.BarcodeSchema = zod_1.z.string().regex(/^\d{8,14}$/).max(14);
exports.SessionStatusSchema = zod_1.z.enum([
    'ACTIVE',
    'PENDING_CHECKOUT',
    'COMPLETED',
    'VALIDATION_FAILED',
    'EXPIRED',
]);
exports.PointsConfigSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({ type: zod_1.z.literal('FIXED_PER_UNIT'), value: zod_1.z.number() }),
    zod_1.z.object({ type: zod_1.z.literal('SPEND_MULTIPLIER'), value: zod_1.z.number() }),
    zod_1.z.object({
        type: zod_1.z.literal('VOLUME_TIER'),
        tiers: zod_1.z.array(zod_1.z.object({
            minQty: zod_1.z.number().int(),
            maxQty: zod_1.z.number().int(),
            pointsPerUnit: zod_1.z.number().int(),
        })),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('WEEKEND_BONUS'),
        basePoints: zod_1.z.number().int(),
        weekendMultiplier: zod_1.z.number(),
    }),
]);
exports.ProductDTOSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    barcode: exports.BarcodeSchema,
    name: zod_1.z.string(),
    brand: zod_1.z.string(),
    imageUrl: zod_1.z.string().url().optional(),
    pointsConfig: exports.PointsConfigSchema,
    sponsored: zod_1.z.boolean(),
});
exports.SessionItemDTOSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    barcode: exports.BarcodeSchema,
    quantity: zod_1.z.number().int().positive(),
    pointsValue: zod_1.z.number().int(),
});
exports.SessionDTOSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    storeId: zod_1.z.string().uuid(),
    status: exports.SessionStatusSchema,
    items: zod_1.z.array(exports.SessionItemDTOSchema),
    itemHash: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.CreateSessionRequestSchema = zod_1.z.object({
    storeId: zod_1.z.string().uuid(),
});
exports.AddItemRequestSchema = zod_1.z.object({
    barcode: exports.BarcodeSchema,
    quantity: zod_1.z.number().int().positive(),
});
exports.ValidateSessionRequestSchema = zod_1.z.object({
    qrToken: zod_1.z.string(),
    scannedItems: zod_1.z.array(zod_1.z.string()),
});
exports.QrTicketResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    expiresAt: zod_1.z.string().datetime(),
});
exports.MockPayResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    status: exports.SessionStatusSchema,
    pointsAwarded: zod_1.z.number().int().nonnegative(),
    newBalance: zod_1.z.number().int(),
    mock: zod_1.z.literal(true),
});
//# sourceMappingURL=session.schemas.js.map