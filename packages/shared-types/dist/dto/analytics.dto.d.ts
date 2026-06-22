import { z } from 'zod';
import { SegmentDistributionSchema } from '../validation/analytics.schemas';
export type SegmentDistributionDTO = z.infer<typeof SegmentDistributionSchema>;
export interface ProductInsightsDTO {
    productId: string;
}
export interface StoreOverviewDTO {
    storeId: string;
}
