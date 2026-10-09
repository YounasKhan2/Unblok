import pino, { type DestinationStream } from 'pino';

const sensitive = /password|passwd|secret|token|authorization|cookie|credential|api[-_]?key|access[-_]?key|database[-_]?url|redis[-_]?url|signed[-_]?url/i;
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[Truncated]';
  if (value instanceof Error) return { name: value.name };
  if (Array.isArray(value)) return value.map(item => redact(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? '[Redacted]' : redact(item, depth + 1)]));
  }
  return value;
}
export function createLogger(level = 'info', destination?: DestinationStream) {
  // Production callers log only known event names and allowlisted metadata. Never
  // log bodies, headers, query strings, exception messages, job data, or config.
  const options = { level, base: null, hooks: { logMethod(args: Parameters<pino.LogFn>, method: pino.LogFn) {
    const safe = args.map(arg => typeof arg === 'object' ? redact(arg) : arg);
    method.apply(this, safe as Parameters<pino.LogFn>);
  } } };
  return destination ? pino(options, destination) : pino(options);
}
export type Logger = ReturnType<typeof createLogger>;
