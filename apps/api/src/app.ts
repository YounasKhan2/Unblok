import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { type ApiConfig, type Logger } from '@unblok/backend-runtime';
import { AppModule, Readiness, type Resources } from './health';
import { ErrorFilter } from './errors';
import { bodyBoundary, correlation, cors, rateLimit, type RateLimiter } from './security';

export async function createApp(config: ApiConfig, resources: Resources, limiter: RateLimiter, logger: Logger) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(resources), {
    logger: false, bodyParser: false, abortOnError: false,
  });
  app.disable('x-powered-by');
  // Do not trust spoofable forwarded addresses. Deployment proxy trust must be
  // explicitly reviewed before running behind an ingress.
  app.set('trust proxy', false);
  app.use(correlation(logger));
  app.use(helmet());
  app.use(cors(config));
  app.use(rateLimit(limiter));
  app.use(bodyBoundary(config));
  app.use(express.json({ limit: config.BODY_LIMIT_BYTES, strict: true, inflate: false }));
  app.use(express.urlencoded({ limit: config.BODY_LIMIT_BYTES, extended: false, parameterLimit: 100, inflate: false }));
  app.useGlobalFilters(new ErrorFilter(logger));
  await app.init();
  const server = app.getHttpServer();
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 5000;
  let closePromise: Promise<void> | undefined;
  const close = () => closePromise ??= (async () => {
    app.get(Readiness).drain();
    try { await app.close(); } finally { await resources.close(); }
  })();
  return { app, close };
}
