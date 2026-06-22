import { z } from 'zod';
export declare const CheckoutCompletedEventItemSchema: z.ZodObject<{
    productId: z.ZodString;
    barcode: z.ZodString;
    quantity: z.ZodNumber;
    pointsValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    barcode: string;
    productId: string;
    quantity: number;
    pointsValue: number;
}, {
    barcode: string;
    productId: string;
    quantity: number;
    pointsValue: number;
}>;
export declare const CheckoutCompletedEventSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    storeId: z.ZodString;
    pointsAwarded: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        barcode: z.ZodString;
        quantity: z.ZodNumber;
        pointsValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }, {
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }>, "many">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    storeId: string;
    items: {
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }[];
    sessionId: string;
    pointsAwarded: number;
    timestamp: string;
}, {
    userId: string;
    storeId: string;
    items: {
        barcode: string;
        productId: string;
        quantity: number;
        pointsValue: number;
    }[];
    sessionId: string;
    pointsAwarded: number;
    timestamp: string;
}>;
export type CheckoutCompletedEventItem = z.infer<typeof CheckoutCompletedEventItemSchema>;
export type CheckoutCompletedEventPayload = z.infer<typeof CheckoutCompletedEventSchema>;
