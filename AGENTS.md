# AGENTS.md

## Cấu trúc Monorepo

Ba app độc lập, mỗi app cài riêng:

- **`backend/`** — NestJS v11 API (nằm trong bun workspace)
- **`admin/`** — Electron + React + Vite admin panel desktop/web (**không** nằm trong bun workspace; cài riêng từ `admin/`)
- **`mobile/`** — Flutter app (dùng `flutter pub get`, không phải bun)

Root `package.json` workspaces chỉ gồm `backend` và `packages/*` (chưa có thư mục `packages/`).

## Lệnh

**Mọi lệnh backend chạy từ `backend/`, không phải root** (script root như `bun run backend:dev` chỉ cd vào backend).

```
# Hạ tầng (từ root)
bun run db:up          # docker-compose up (postgres:16 + redis:7)
bun run db:down

# Backend (từ backend/)
bun run start:dev      # watch mode
bun run build          # nest build
bun run typecheck      # tsc --noEmit
bun run lint           # eslint --fix
bun run test           # jest unit tests (*.spec.ts)
bun run test:e2e       # jest e2e tests (*.e2e-spec.ts)
bun run test:integration  # custom bun scripts (KHÔNG phải jest)
bun run test:integration:auth   # chạy 1 suite integration
bun run admin:create   # tạo admin user

# Admin (từ admin/)
bun run dev            # electron-vite dev (desktop)
bun run dev:web        # vite dev (chỉ web)
bun run typecheck
bun run lint
```

**Thứ tự kiểm tra:** `lint -> typecheck -> test`

## Kiến trúc Backend

- API prefix: `/api/v1` — Swagger tại `/api/v1/docs` (không phải `/api/docs`)
- Config dùng `registerAs` theo namespace: `app`, `database`, `jwt`, `redis`, `mail` — truy cập bằng `configService.get('database.host')` v.v.
- `synchronize: true` ở dev (TypeORM tự đồng bộ schema; không cần chạy migration thủ công)
- Mọi entity extend `BaseEntity` → uuid `id`, `createdAt`, `updatedAt`, soft-delete `deletedAt`
- Mọi response được wrap trong `{ data: T }` bởi `TransformInterceptor`

## Auth & Guards (áp dụng toàn cục)

- **JwtAuthGuard** mặc định bảo vệ mọi endpoint. Dùng `@Public()` để bỏ auth.
- **ThrottlerGuard** — giới hạn 1000 req/60s (giới hạn cao để tương thích test).
- **RolesGuard** — dùng `@Roles('admin')` để giới hạn.
- **PermissionsGuard** — dùng `@RequirePermissions(Permission.X)` từ `common/enums`.
- **@CurrentUser()** — param decorator lấy `request.user`.
- **@Transactional()** — method decorator cho DB transaction (yêu cầu inject `DataSource` dưới tên `this.dataSource`).

## Style & Lint

- **Backend prettier:** single quotes, trailing commas `"all"`
- **Admin prettier:** single quotes, **không chấm phẩy**, trailing commas `"es5"`, printWidth 120
- **Backend eslint:** `@typescript-eslint/no-explicit-any` là **OFF**; tsconfig `noImplicitAny` là **false**
- **Backend tsconfig:** `removeComments: true` — comment bị xoá ở build output

## Testing

- Unit tests: jest, file khớp `*.spec.ts` trong `src/`
- E2E tests: jest với `test/jest-e2e.json`, file khớp `*.e2e-spec.ts` trong `test/`
- Integration tests: custom bun scripts trong `scripts/test/suites/` — **không phải jest**, chạy bằng `bun run test:integration:*`
- Integration và e2e tests cần `db:up` (postgres + redis đang chạy)

## Môi trường

- Copy `backend/.env.example` → `backend/.env` (đầy đủ hơn root `.env.example` — gồm JWT, Redis, Mail, Google OAuth)
- Admin: copy `admin/.env.example` → `admin/.env` (chỉ có `VITE_API_BASE_URL`)
