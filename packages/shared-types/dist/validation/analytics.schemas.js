"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentDistributionSchema = void 0;
const zod_1 = require("zod");
exports.SegmentDistributionSchema = zod_1.z.object({
    segments: zod_1.z.array(zod_1.z.object({
        segmentName: zod_1.z.string(),
        count: zod_1.z.number().int().nonnegative(),
        percentage: zod_1.z.number(),
    })),
});
//# sourceMappingURL=analytics.schemas.js.map