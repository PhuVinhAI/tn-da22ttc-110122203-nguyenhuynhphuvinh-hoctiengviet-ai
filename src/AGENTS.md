# AGENTS.md

Respond to the user in the same language they use in their prompt (if Vietnamese → Vietnamese, if English → English, etc.). All documentation, sub-agent interactions, and internal agent communication must be in English.

## Monorepo Structure

Bun workspace monorepo. Root `package.json` `workspaces`: `admin`, `backend`, `landing`, `packages/*` — `bun install` at root installs all of them. Mobile is separate (Flutter, not bun).

- **`backend/`** — NestJS v11 API (package `backend`)
- **`admin/`** — Electron + React + Vite admin panel, desktop (electron-vite) and web (vite); package `linvnix-admin`
- **`landing/`** — Astro landing page (React + Tailwind islands); package `landing`
- **`packages/shared/`** — `@linvnix/shared`, shared AI abstractions (zod schemas consumed by backend)
- **`mobile/`** — Flutter app (uses `flutter pub get`, not bun; run from `mobile/`)

## Commands

**All backend commands run from `backend/`** — root scripts like `bun run backend:dev` run `bun --filter backend start:dev` (workspace filter); equivalent commands also work directly from each app directory.

```
# Infrastructure (from root)
bun run db:up          # docker-compose up (postgres:16 + redis:7 + backend)
bun run db:down

# Backend (from backend/)
bun run start:dev      # watch mode
bun run build          # nest build
bun run typecheck      # tsc --noEmit
bun run lint           # eslint --fix
bun run test           # jest unit tests (*.spec.ts)
bun run test:e2e       # jest e2e tests (*.e2e-spec.ts)
bun run test:integration:bookmarks          # custom bun integration suite (NOT jest)
bun run test:integration:personal-vocabularies
bun run test:integration:search-vocabulary
bun run test:integration:simulations-seed
bun run admin:create   # create admin user

# Admin (from admin/, or root: bun run admin:dev / admin:dev:web)
bun run dev            # electron-vite dev (desktop)
bun run dev:web        # vite dev (web only)
bun run typecheck
bun run lint

# Landing (from landing/, or root: bun run landing:dev)
bun run dev            # astro dev
bun run build          # astro build
bun run preview        # astro preview

# Shared package (from packages/shared/, or root: bun run shared:build)
bun run build          # tsc -> dist/
bun run typecheck
bun run lint
```

**Check order:** `lint -> typecheck -> test`

## Backend Architecture

- API prefix: `/api/v1` — Swagger at `/api/v1/docs` (not `/api/docs`)
- Config uses `registerAs` per namespace: `app`, `database`, `jwt`, `redis`, `mail` — access via `configService.get('database.host')` etc.
- `synchronize: true` in dev (TypeORM auto-syncs schema; no manual migration needed)
- All entities extend `BaseEntity` → uuid `id`, `createdAt`, `updatedAt`, soft-delete `deletedAt`
- All responses are wrapped in `{ data: T }` by `TransformInterceptor`

## Auth & Guards (applied globally)

- **JwtAuthGuard** protects all endpoints by default. Use `@Public()` to skip auth.
- **ThrottlerGuard** — rate limit 1000 req/60s (high limit for test compatibility).
- **RolesGuard** — use `@Roles('admin')` to restrict.
- **PermissionsGuard** — use `@RequirePermissions(Permission.X)` from `common/enums`.
- **@CurrentUser()** — param decorator to get `request.user`.
- **@Transactional()** — method decorator for DB transactions (requires injecting `DataSource` as `this.dataSource`).

## Style & Lint

- **Backend prettier:** single quotes, trailing commas `"all"`
- **Admin prettier:** single quotes, **no semicolons**, trailing commas `"es5"`, printWidth 120
- **Backend eslint:** `@typescript-eslint/no-explicit-any` is **OFF**; tsconfig `noImplicitAny` is **false**
- **Backend tsconfig:** `removeComments: true` — comments are stripped from build output

## Testing

- Unit tests: jest, files matching `*.spec.ts` in `src/`
- E2E tests: jest with `test/jest-e2e.json` (with `setupFiles: ['./setup-env.ts']` providing required env), files matching `*.e2e-spec.ts` in `test/`
- Integration tests: custom bun scripts in `scripts/test/suites/` — **not jest**. Currently 4 active suites: `bookmarks`, `personal-vocabularies`, `search-vocabulary`, `simulations-seed` (run via `bun run test:integration:<suite>`). Coverage gaps for auth/refresh-token/email-queue/courses-CRUD/vocabularies-CRUD/scenarios are tracked as future work.
- Integration and e2e tests require `db:up` (postgres + redis running)

## Environment

- **Backend (required):** copy `backend/.env.example` → `backend/.env` — the canonical, complete template (Database, JWT, API, Redis, Storage, Mail, App branding, Google OAuth, all `GENAI_*` + per-feature `AI_*` overrides).
- **Root (optional):** copy `.env.example` → `.env` only if you run `bun run db:up` from root — it holds just the `docker-compose.yml` variables (`DATABASE_*`, `PORT`, `NODE_ENV`). All keys default in `docker-compose.yml`, so the root `.env` is optional.
- **Admin:** copy `admin/.env.example` → `admin/.env` (only `VITE_API_BASE_URL`).
- **Landing / shared:** no `.env` required for local dev.

## Agent skills

### Issue tracker

Issues and PRDs live in `.scratch/` as markdown. See `docs/agents/issue-tracker.md`.

### Triage labels

Five triage roles use default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. Read `CONTEXT.md` (if any) at root and `docs/adr/`. See `docs/agents/domain.md`.
