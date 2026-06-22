import { z } from 'zod';
export declare const SegmentDistributionSchema: z.ZodObject<{
    segments: z.ZodArray<z.ZodObject<{
        segmentName: z.ZodString;
        count: z.ZodNumber;
        percentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        segmentName: string;
        count: number;
        percentage: number;
    }, {
        segmentName: string;
        count: number;
        percentage: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    segments: {
        segmentName: string;
        count: number;
        percentage: number;
    }[];
}, {
    segments: {
        segmentName: string;
        count: number;
        percentage: number;
    }[];
}>;
