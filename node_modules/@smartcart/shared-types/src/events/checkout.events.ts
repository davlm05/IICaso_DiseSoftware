import { z } from 'zod';

/**
 * Internal event contract shared between `apps/api` (producer) and
 * `apps/analytics-worker` (consumer). Source of truth: README §2.3 Consumer
 * Profiling (step 1) and §2.8 Workflow 2. Kept here so the two apps cannot drift
 * on the BullMQ job payload shape.
 *
 * NOTE: this is an internal queue contract, not a public REST DTO — it is never
 * returned to the mobile client.
 */

export const CheckoutCompletedEventItemSchema = z.object({
  productId: z.string().uuid(),
  barcode: z.string(),
  quantity: z.number().int().positive(),
  pointsValue: z.number().int(),
});

export const CheckoutCompletedEventSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  pointsAwarded: z.number().int().nonnegative(),
  items: z.array(CheckoutCompletedEventItemSchema),
  timestamp: z.string().datetime(), // ISO-8601
});

export type CheckoutCompletedEventItem = z.infer<
  typeof CheckoutCompletedEventItemSchema
>;
export type CheckoutCompletedEventPayload = z.infer<
  typeof CheckoutCompletedEventSchema
>;
