import { z } from 'zod';
import { SegmentDistributionSchema } from '../validation/analytics.schemas';

/**
 * Analytics-domain DTOs. Inferred from the Zod schemas (README §2.4 Data Contracts).
 * All shapes are aggregated/anonymized B2B responses.
 */

export type SegmentDistributionDTO = z.infer<typeof SegmentDistributionSchema>;

// The following endpoints are named in README §2.4 but their response fields are not
// yet specified there. Declared as minimal placeholders to be filled in when §2.4
// defines them — fields TBD per README, intentionally not invented here.
export interface ProductInsightsDTO {
  productId: string;
  // fields TBD per README (§2.4 GET /analytics/products/:id/insights)
}

export interface StoreOverviewDTO {
  storeId: string;
  // fields TBD per README (§2.4 GET /analytics/stores/:id/overview)
}
