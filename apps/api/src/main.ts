import { Database } from '@unblok/database';
import { closeRedis, createLogger, createRedis, loadApiConfig, registerShutdown, withDeadline } from '@unblok/backend-runtime';
import { createApp } from './app';
import { RedisRateLimiter } from './security';

const logger = createLogger();
async function main() {
  const config = loadApiConfig(process.env);
  logger.level = config.LOG_LEVEL;
  const database = new Database(config.DATABASE_URL);
  const redis = createRedis(config.REDIS_URL);
  redis.on('error', () => logger.warn({ event: 'queue_connection_error' }));
  const resources = {
    databaseReady: () => database.ready(),
    queueReady: async () => await redis.ping() === 'PONG',
    close: async () => { await Promise.all([database.close(), closeRedis(redis)]); },
  };
  try {
    await withDeadline(Promise.all([database.connect(), redis.connect()]), 10000);
    const server = await createApp(config, resources, new RedisRateLimiter(redis, config.RATE_LIMIT_MAX, config.RATE_LIMIT_WINDOW_MS), logger);
    registerShutdown(server.close, config.SHUTDOWN_TIMEOUT_MS, logger);
    await server.app.listen(config.API_PORT, config.API_HOST);
    logger.info({ event: 'api_started', port: config.API_PORT });
  } catch {
    await resources.close();
    throw new Error('API startup failed');
  }
}
void main().catch(() => { logger.fatal({ event: 'api_startup_failed' }); process.exit(1); });
