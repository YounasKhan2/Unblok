# BE-01A monorepo migration boundary

The existing React/Vite frontend remains at repo root in this initial nonbreaking preparation. Target app locations are `apps/web` (frontend), `apps/api` (NestJS) and `apps/worker` (BullMQ). Shared public contract schemas belong in `packages/contracts` and Docker infrastructure in `infra/docker`.

**Do not move the frontend until full repository checkout and a recorded baseline of existing test, lint, build, UX screenshots, CSS and validation scripts are available.** Relocate root `src`, `public`, `index.html`, `vite.config.ts`, frontend `package.json`, `tsconfig.json`, env, assets and required fixtures together; adjust relative `scripts`, `validation`, `screenshots`, `dist`/generated output and public asset paths. Preserve current Bun lockfile until a deliberate package-manager decision; do not silently switch to pnpm. Keep workspaces pinned to one package manager and prove installation reproducibility.

Plan: (1) baseline tests and screenshot parity; (2) move frontend in a single coherent change with scripts/CI repairs; (3) choose Bun workspaces as default unless a compatibility problem requires change; (4) verify frontend still runs unchanged; (5) create backend/worker packages separately after BE-00B contracts. Frontend only imports neutral contracts, never Prisma/NestJS modules. Avoid auto mock removal during relocation.

## Relocation Status (BE-01A Completed)

The React/Vite frontend has been relocated into `apps/web` with Bun workspaces configured:
- Package name: `@unblok/web` in `apps/web/package.json`
- Root monorepo: `unblok-monorepo` with workspaces `apps/*` and `packages/*`
- Preserved single root lockfile: `bun.lock`
- Monorepo root scripts:
  - `bun run dev:web` — launches Vite dev server for `apps/web`
  - `bun run build:web` — executes production build of `apps/web`
  - `bun run test:web` — executes Vitest test suite (50 test files, 735 tests)
  - `bun run lint:web` — runs TypeScript compiler checks (`tsc --noEmit`)
  - `bun run preview:web` — previews production build
  - `bun run clean:web` — cleans dist build output
- All relative script paths in `scripts/` updated to reference `apps/web/src` and `apps/web/public`.
- Preserved 100% route, component, styling, asset and behavioral parity.
