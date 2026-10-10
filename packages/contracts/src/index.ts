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

// Local password identities use a deliberately narrow ASCII email policy.
export const credentialEmailSchema = z.string().max(320).trim().toLowerCase().pipe(
  z.email().max(320).regex(/^[\x21-\x7e]+$/));
const passwordSchema = z.string().max(256).refine(value => {
  const length = Array.from(value).length;
  return length >= 16 && length <= 128 && !/[\p{Surrogate}\u0000]/u.test(value);
});
export const signupSchema = z.object({ name: z.string().trim().min(1).max(120), email: credentialEmailSchema, password: passwordSchema }).strict();
export const loginSchema = z.object({ email: credentialEmailSchema, password: passwordSchema }).strict();
export const emptyAuthSchema = z.object({}).strict();
export const csrfResponseSchema = z.object({ csrf: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export const signupResponseSchema = z.object({ status: z.literal('accepted') }).strict();
export const meResponseSchema = z.object({ user: z.object({ id: z.uuid(), name: z.string().max(120), email: z.string().max(320).nullable(), emailVerified: z.boolean() }).strict() }).strict();
export const logoutResponseSchema = z.object({ revocation: z.literal('confirmed'), cleanup: z.enum(['confirmed', 'unconfirmed']) }).strict();
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const emailVerificationConfirmSchema = z.object({ token: z.string().regex(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/) }).strict();
export const emailVerificationStatusSchema = z.object({ emailVerified: z.boolean() }).strict();
