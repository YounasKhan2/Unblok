import { createLogger, loadWorkerConfig, registerShutdown } from '@unblok/backend-runtime';
import { startWorker } from './worker';

const logger = createLogger();
async function main() {
  const config = loadWorkerConfig(process.env);
  logger.level = config.LOG_LEVEL;
  const service = await startWorker(config, logger);
  registerShutdown(service.close, config.SHUTDOWN_TIMEOUT_MS, logger);
}
void main().catch(() => { logger.fatal({ event: 'worker_startup_failed' }); process.exit(1); });
