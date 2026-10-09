# Local development infrastructure

Four image versions are pinned by registry digest: PostgreSQL 17.6, Valkey 8.1.3, RustFS 1.0.0-alpha.83, and Mailpit 1.27.8. Docker and Compose v2 with `--wait` support are required. The API and worker run on the host under Bun; this phase adds no application container deployment.

From repository root:

```sh
bun run init:local
bun run infra:config
bun run infra:up
bun run db:generate
bun run db:migrate
bun run dev:api
# A second terminal:
bun run dev:worker
```

The initializer exclusively creates ignored `infra/docker/.env`, `apps/api/.env`, and `apps/worker/.env` with generated local secrets and mode 0600. It preserves existing files and reuses infrastructure credentials on repeat runs. For manual setup, copy each `.env.example` to `.env` and supply real local values securely; there are no default passwords. Do not rotate PostgreSQL credentials by editing `.env` after initializing the volume: PostgreSQL only uses its bootstrap password on first initialization. Change the role password deliberately and update consumers together.

All host ports bind **127.0.0.1**: PostgreSQL 5432, Valkey 6379, RustFS S3 9000, SMTP 1025, Mailpit UI 8025. There are no public bindings. RustFS's admin console is disabled and its port is not published. Mailpit is local email capture only, not a production provider. Persistent named volumes retain database, queue AOF, objects, and captured mail. Each service has a health check, memory bound, restart policy, and no-new-privileges setting; upstream images manage runtime users.

`bun run infra:down` stops containers and preserves volumes. Never add `--volumes` to normal shutdown; deleting volumes destroys local records, jobs, objects, and mail. Single-node Docker is not HA, a backup, or a production deployment. Valkey uses AOF and noeviction; a full queue store fails writes instead of silently evicting jobs. The host may report `vm.overcommit_memory` warnings; review that host setting before depending on queue durability under pressure.

Run `bun run test:backend:infra` for real SQL/queue/readiness smoke tests; `bun run test:backend:integration` requires the Prisma migration; `bun run build:backend && bun run test:backend:lifecycle` tests built-process signals. Do not run multiple Compose reconfiguration commands concurrently.
