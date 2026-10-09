import { z } from 'zod';

export const healthSchema = z.object({ status: z.enum(['ok', 'ready']) }).strict();
export type HealthResponse = z.infer<typeof healthSchema>;
export const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }).strict(),
}).strict();
export type ErrorResponse = z.infer<typeof errorSchema>;
// Diagnostic only. No product data or authority enters this queue in BE-00B.
export const foundationJobSchema = z.object({ version: z.literal(1) }).strict();
export type FoundationJob = z.infer<typeof foundationJobSchema>;
