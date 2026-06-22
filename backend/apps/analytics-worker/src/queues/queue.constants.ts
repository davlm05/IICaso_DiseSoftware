/**
 * Queue identifiers — MUST match `apps/api`'s `common/queues/queue.config.ts`
 * (README §2.8 Workflow 2 step 1). Kept as a local constant so the standalone
 * worker build has no dependency on the API source tree.
 */
export const ANALYTICS_QUEUE = 'analytics-profile-update';
export const ANALYTICS_JOB = 'profile-update';
