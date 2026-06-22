import { z } from 'zod';
export declare const BarcodeSchema: z.ZodString;
export declare const SessionStatusSchema: z.ZodEnum<["ACTIVE", "PENDING_CHECKOUT", "COMPLETED", "VALIDATION_FAILED", "EXPIRED"]>;
export declare const PointsConfigSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"FIXED_PER_UNIT">;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "FIXED_PER_UNIT";
    value: number;
}, {
    type: "FIXED_PER_UNIT";
    value: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"SPEND_MULTIPLIER">;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "SPEND_MULTIPLIER";
    value: number;
}, {
    type: "SPEND_MULTIPLIER";
    value: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"VOLUME_TIER">;
    tiers: z.ZodArray<z.ZodObject<{
        minQty: z.ZodNumber;
        maxQty: z.ZodNumber;
        pointsPerUnit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        minQty: number;
        maxQty: number;
        pointsPerUnit: number;
    }, {
        minQty: number;
        maxQty: number;
        pointsPerUnit: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "VOLUME_TIER";
    tiers: {
        minQty: number;
        maxQty: number;
        pointsPerUnit: number;
    }[];
}, {
    type: "VOLUME_TIER";
    tiers: {
        minQty: number;
        maxQty: number;
        pointsPerUnit: number;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"WEEKEND_BONUS">;
    basePoints: z.ZodNumber;
    weekendMultiplier: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "WEEKEND_BONUS";
    basePoints: number;
    weekendMultiplier: number;
}, {
    type: "WEEKEND_BONUS";
    basePoints: number;
    weekendMultiplier: number;
}>]>;
export declare const ProductDTOSchema: z.ZodObject<{
    id: z.ZodString;
    barcode: z.ZodString;
    name: z.ZodString;
    brand: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    pointsConfig: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"FIXED_PER_UNIT">;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "FIXED_PER_UNIT";
        value: number;
    }, {
        type: "FIXED_PER_UNIT";
        value: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"SPEND_MULTIPLIER">;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "SPEND_MULTIPLIER";
        value: number;
    }, {
        type: "SPEND_MULTIPLIER";
        value: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"VOLUME_TIER">;
        tiers: z.ZodArray<z.ZodObject<{
            minQty: z.ZodNumber;
            maxQty: z.ZodNumber;
            pointsPerUnit: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }, {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "VOLUME_TIER";
        tiers: {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }[];
    }, {
        type: "VOLUME_TIER";
        tiers: {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"WEEKEND_BONUS">;
        basePoints: z.ZodNumber;
        weekendMultiplier: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "WEEKEND_BONUS";
        basePoints: number;
        weekendMultiplier: number;
    }, {
        type: "WEEKEND_BONUS";
        basePoints: number;
        weekendMultiplier: number;
    }>]>;
    sponsored: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    barcode: string;
    name: string;
    brand: string;
    pointsConfig: {
        type: "FIXED_PER_UNIT";
        value: number;
    } | {
        type: "SPEND_MULTIPLIER";
        value: number;
    } | {
        type: "VOLUME_TIER";
        tiers: {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }[];
    } | {
        type: "WEEKEND_BONUS";
        basePoints: number;
        weekendMultiplier: number;
    };
    sponsored: boolean;
    imageUrl?: string | undefined;
}, {
    id: string;
    barcode: string;
    name: string;
    brand: string;
    pointsConfig: {
        type: "FIXED_PER_UNIT";
        value: number;
    } | {
        type: "SPEND_MULTIPLIER";
        value: number;
    } | {
        type: "VOLUME_TIER";
        tiers: {
            minQty: number;
            maxQty: number;
            pointsPerUnit: number;
        }[];
    } | {
        type: "WEEKEND_BONUS";
        basePoints: number;
        weekendMultiplier: number;
    };
    sponsored: boolean;
    imageUrl?: string | undefined;
}>;
export declare const SessionItemDTOSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    barcode: z.ZodString;
    quantity: z.ZodNumber;
    pointsValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    barcode: string;
    productId: string;
    quantity: number;
    pointsValue: number;
}, {
    id: string;
    barcode: string;
    productId: string;
    quantity: number;
    pointsValue: number;
}>;
export declare const SessionDTOSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    storeId: z.ZodString;
    status: z.ZodEnum<["ACTIVE", "PENDING_CHECKOUT", "COMPLETED", "VALIDATION_FAILED", "EXPIRED"]>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        barcode: z.ZodString;
        quantity: z.ZodNumber;
        pointsValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }, {
        id: string;
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }>, "many">;
    itemHash: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "PENDING_CHECKOUT" | "COMPLETED" | "VALIDATION_FAILED" | "EXPIRED";
    id: string;
    userId: string;
    storeId: string;
    items: {
        id: string;
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }[];
    createdAt: string;
    updatedAt: string;
    itemHash?: string | undefined;
}, {
    status: "ACTIVE" | "PENDING_CHECKOUT" | "COMPLETED" | "VALIDATION_FAILED" | "EXPIRED";
    id: string;
    userId: string;
    storeId: string;
    items: {
        id: string;
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }[];
    createdAt: string;
    updatedAt: string;
    itemHash?: string | undefined;
}>;
export declare const CreateSessionRequestSchema: z.ZodObject<{
    storeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    storeId: string;
}, {
    storeId: string;
}>;
export declare const AddItemRequestSchema: z.ZodObject<{
    barcode: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    barcode: string;
    quantity: number;
}, {
    barcode: string;
    quantity: number;
}>;
export declare const ValidateSessionRequestSchema: z.ZodObject<{
    qrToken: z.ZodString;
    scannedItems: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    qrToken: string;
    scannedItems: string[];
}, {
    qrToken: string;
    scannedItems: string[];
}>;
export declare const QrTicketResponseSchema: z.ZodObject<{
    token: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    expiresAt: string;
}, {
    token: string;
    expiresAt: string;
}>;
