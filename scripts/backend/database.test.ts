import { afterAll, beforeAll, expect, test } from 'bun:test';
import { Database } from '@unblok/database';
import { closeRedis, createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';

const config = loadApiConfig(process.env);
const database = new Database(config.DATABASE_URL);
const redis = createRedis(config.REDIS_URL);
let api: Awaited<ReturnType<typeof createApp>>;
beforeAll(async () => { await database.connect(); await redis.connect(); });
afterAll(async () => { await api?.close(); await database.close(); await closeRedis(redis); });
test('Prisma sees the applied migration and rolls back serializable transactions', async () => {
  expect(await database.ready()).toBe(true);
  const original = await database.client.backendFoundation.findUniqueOrThrow({ where: { id: 1 } });
  await expect(database.transaction(async tx => {
    await tx.backendFoundation.update({ where: { id: 1 }, data: { installedAt: new Date(0) } });
    throw new Error('rollback');
  })).rejects.toThrow('rollback');
  expect((await database.client.backendFoundation.findUniqueOrThrow({ where: { id: 1 } })).installedAt).toEqual(original.installedAt);
});
test('API readiness uses real Prisma and Valkey lifecycles', async () => {
  api = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await redis.ping() === 'PONG', close: async () => { await database.close(); await closeRedis(redis); } }, new RedisRateLimiter(redis, 120, 60000), createLogger('silent'));
  await api.app.listen(0, '127.0.0.1');
  const address = api.app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing address');
  const response = await fetch(`http://127.0.0.1:${address.port}/ready`);
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ status: 'ready' });
  await api.close();
});
