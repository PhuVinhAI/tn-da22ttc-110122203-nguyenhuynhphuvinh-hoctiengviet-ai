# AGENTS.md

Always respond to the user in Vietnamese. All documentation, sub-agent interactions, and internal agent communication must be in English.

## Monorepo Structure

Three independent apps, each installed separately:

- **`backend/`** — NestJS v11 API (part of bun workspace)
- **`admin/`** — Electron + React + Vite admin panel desktop/web (**not** in bun workspace; install separately from `admin/`)
- **`mobile/`** — Flutter app (uses `flutter pub get`, not bun)

Root `package.json` workspaces only include `backend` and `packages/*` (no `packages/` directory yet).

## Commands

**All backend commands run from `backend/`, not root** (root scripts like `bun run backend:dev` just cd into backend).

```
# Infrastructure (from root)
bun run db:up          # docker-compose up (postgres:16 + redis:7)
bun run db:down

# Backend (from backend/)
bun run start:dev      # watch mode
bun run build          # nest build
bun run typecheck      # tsc --noEmit
bun run lint           # eslint --fix
bun run test           # jest unit tests (*.spec.ts)
bun run test:e2e       # jest e2e tests (*.e2e-spec.ts)
bun run test:integration  # custom bun scripts (NOT jest)
bun run test:integration:auth   # run a single integration suite
bun run admin:create   # create admin user

# Admin (from admin/)
bun run dev            # electron-vite dev (desktop)
bun run dev:web        # vite dev (web only)
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
- E2E tests: jest with `test/jest-e2e.json`, files matching `*.e2e-spec.ts` in `test/`
- Integration tests: custom bun scripts in `scripts/test/suites/` — **not jest**, run via `bun run test:integration:*`
- Integration and e2e tests require `db:up` (postgres + redis running)

## Environment

- Copy `backend/.env.example` → `backend/.env` (more complete than root `.env.example` — includes JWT, Redis, Mail, Google OAuth)
- Admin: copy `admin/.env.example` → `admin/.env` (only has `VITE_API_BASE_URL`)

## Agent skills

### Issue tracker

Issues and PRDs live in `.scratch/` as markdown. See `docs/agents/issue-tracker.md`.

### Triage labels

Five triage roles use default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. Read `CONTEXT.md` (if any) at root and `docs/adr/`. See `docs/agents/domain.md`.
