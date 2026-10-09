import type { Logger } from './logging';

export async function withDeadline<T>(operation: Promise<T>, timeout: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Operation deadline exceeded')), timeout);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
// Shared signal handling: second signals cannot race resource disposal.
export function registerShutdown(close: () => Promise<void>, timeout: number, logger: Logger) {
  let closing = false;
  const handler = () => {
    if (closing) return;
    closing = true;
    logger.info({ event: 'shutdown_started' });
    void withDeadline(close(), timeout).then(() => {
      logger.info({ event: 'shutdown_complete' }); process.exit(0);
    }, () => { logger.error({ event: 'shutdown_failed' }); process.exit(1); });
  };
  process.on('SIGINT', handler); process.on('SIGTERM', handler);
  return () => { process.off('SIGINT', handler); process.off('SIGTERM', handler); };
}
