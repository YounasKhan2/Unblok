import { Prisma, PrismaClient } from '@prisma/client';

export class Database {
  readonly client: PrismaClient;
  constructor(url: string) {
    this.client = new PrismaClient({ datasources: { db: { url } }, log: [] });
  }
  async connect() { await this.client.$connect(); }
  async ready() { return (await this.client.backendFoundation.findUnique({ where: { id: 1 } })) !== null; }
  async close() { await this.client.$disconnect(); }
  // Keep callbacks small; no remote calls and no implicit retries of side effects.
  transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.client.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 2000, timeout: 5000 });
  }
}
