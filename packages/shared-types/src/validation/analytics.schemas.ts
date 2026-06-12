import { z } from 'zod';

/**
 * Analytics-domain Zod schemas. Source of truth: README §2.3 (Consumer Profiling,
 * step 6) and §2.8 Workflow 2 (B2B consumption). All data is aggregated/anonymized —
 * no individual user rows are ever exposed (README §2.5 PII).
 */

// GET /analytics/segments — segment distribution with counts and percentages.
export const SegmentDistributionSchema = z.object({
  segments: z.array(
    z.object({
      segmentName: z.string(), // segments with < 50 users are merged into "other" (§2.3 step 6)
      count: z.number().int().nonnegative(),
      percentage: z.number(),
    }),
  ),
});
