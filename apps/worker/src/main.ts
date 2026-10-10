import { Database, VerificationDelivery } from '@unblok/database';
import { startVerificationDispatcher } from './jobs/email-verification';
import { loadVerificationKey, loadVerificationMail, createLogger, loadWorkerConfig, registerShutdown } from '@unblok/backend-runtime';
import { startWorker } from './worker';

const logger = createLogger();
async function main() {
  const config = loadWorkerConfig(process.env);
  logger.level = config.LOG_LEVEL;
  const key = loadVerificationKey(process.env), mail = loadVerificationMail(process.env);
  const database = new Database(config.DATABASE_URL);
  await database.connect();
  if (config.NODE_ENV === 'production') await database.assertRuntimePrivileges();
  let service: Awaited<ReturnType<typeof startWorker>>;
  try { service = await startWorker(config, logger); } catch { await database.close(); throw new Error('Worker dependencies unavailable'); }
  const dispatcher = startVerificationDispatcher(new VerificationDelivery(database, key), mail, logger);
  registerShutdown(async () => { try { await Promise.all([service.close(), dispatcher.close()]); } finally { await database.close(); } }, config.SHUTDOWN_TIMEOUT_MS, logger);
}
void main().catch(() => { logger.fatal({ event: 'worker_startup_failed' }); process.exit(1); });
