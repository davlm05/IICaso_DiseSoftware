"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutCompletedEventSchema = exports.CheckoutCompletedEventItemSchema = void 0;
const zod_1 = require("zod");
exports.CheckoutCompletedEventItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    barcode: zod_1.z.string(),
    quantity: zod_1.z.number().int().positive(),
    pointsValue: zod_1.z.number().int(),
});
exports.CheckoutCompletedEventSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    storeId: zod_1.z.string().uuid(),
    pointsAwarded: zod_1.z.number().int().nonnegative(),
    items: zod_1.z.array(exports.CheckoutCompletedEventItemSchema),
    timestamp: zod_1.z.string().datetime(),
});
//# sourceMappingURL=checkout.events.js.map