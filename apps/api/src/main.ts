import { AccountCredentials, AuthFences, Database, Tenancy, denyAll } from '@unblok/database';
import { closeRedis, createLogger, createRedis, loadApiConfig, registerShutdown, withDeadline } from '@unblok/backend-runtime';
import { createApp } from './app';
import { RedisRateLimiter } from './security';
import { connectSessionStore, sessionSettings, Sessions } from './modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from './modules/auth';

const logger = createLogger();
async function main() {
  const config = loadApiConfig(process.env);
  logger.level = config.LOG_LEVEL;
  const database = new Database(config.DATABASE_URL);
  const redis = createRedis(config.REDIS_URL);
  const settings = sessionSettings(config, process.env);
  let sessionConnection: Awaited<ReturnType<typeof connectSessionStore>> | undefined;
  redis.on('error', () => logger.warn({ event: 'queue_connection_error' }));
  const resources = {
    databaseReady: () => database.ready(),
    queueReady: async () => await redis.ping() === 'PONG' && await sessionConnection?.ready() === true,
    close: async () => { await Promise.all([database.close(), closeRedis(redis), sessionConnection?.close()]); },
  };
  try {
    await withDeadline(Promise.all([database.connect(), redis.connect()]), 10000);
    if (config.NODE_ENV === 'production') await database.assertRuntimePrivileges();
    sessionConnection = await connectSessionStore(config.REDIS_URL, settings);
    const fences = new AuthFences(database);
    const authentication = new Authentication(new AccountCredentials(database), await Passwords.create(), new AuthenticationLimits(redis, settings.secrets[0]!, settings.prefix));
    const sessions = new Sessions(sessionConnection.store, settings, {
      create: input => fences.create(input), rotate: (evidence, sid, idle) => fences.rotate(evidence, sid, idle),
      revoke: evidence => fences.revoke(evidence), revokeAll: userId => fences.revokeAll(userId),
    }, assertion => authentication.resolveIdentity(assertion));
    const tenancy = new Tenancy(database, { verify: async () => null }, denyAll, sessions);
    sessions.bind(tenancy); authentication.bind(sessions, tenancy);
    const server = await createApp(config, resources, new RedisRateLimiter(redis, config.RATE_LIMIT_MAX, config.RATE_LIMIT_WINDOW_MS), logger, sessions, authentication);
    registerShutdown(server.close, config.SHUTDOWN_TIMEOUT_MS, logger);
    await server.app.listen(config.API_PORT, config.API_HOST);
    logger.info({ event: 'api_started', port: config.API_PORT });
  } catch {
    await resources.close();
    throw new Error('API startup failed');
  }
}
void main().catch(() => { logger.fatal({ event: 'api_startup_failed' }); process.exit(1); });
