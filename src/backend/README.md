# LinVNix Backend

API NestJS cho nền tảng học tiếng Việt LinVNix. PostgreSQL làm kho dữ liệu chính, Redis cho cache + Bull queue, Google Gemini cho các tính năng AI (trợ lý, sinh bài tập, mô phỏng hội thoại, TTS, phân tích ảnh).

> Domain language (Khóa học, Chủ đề, Bài học, Học viên, Yêu sách, Trợ lý AI, Mô phỏng…): xem `../CONTEXT.md`.
> Quy ước agent (commands, lint/typecheck/test order, guards, decorators): xem `../AGENTS.md`.

## Tech stack

- **Framework**: NestJS 11
- **Runtime**: Bun (cũng tương thích Node 18+)
- **DB**: PostgreSQL 16 + TypeORM 0.3
- **Cache / Queue**: Redis 7 + Bull (`@nestjs/bull`)
- **Auth**: JWT (`@nestjs/jwt`, `passport-jwt`) + Local + Google OAuth 2.0 + Refresh tokens
- **AuthZ**: RBAC tự xây — entity `Role` + `Permission`, guards toàn cục
- **AI**: Google Gemini (`@google/genai`) với **key pool** + fallback model — chat / embed / image / TTS
- **Mail**: `@nestjs-modules/mailer` + Handlebars templates + Bull queue
- **Validation**: `class-validator` + `class-transformer` + Zod (cho tool schemas của agent)
- **API docs**: Swagger (`@nestjs/swagger`)
- **Rate limit**: `@nestjs/throttler` (1000 req / 60s global)
- **Scheduling**: `@nestjs/schedule`
- **Static files**: `@nestjs/serve-static` phục vụ `/uploads`
- **Logger**: custom service trong `infrastructure/logging/` (file `logs/app.log`, `logs/error.log`)

## Cấu trúc thư mục

```
src/
├── main.ts                  # Bootstrap: ValidationPipe, CORS, Swagger /api/v1/docs
├── app.module.ts            # Wire 16 domain + 7 infrastructure modules
│
├── common/                  # decorators, enums, filters, guards, interceptors, pipes, utils
│   ├── decorators/          # @Public, @CurrentUser, @Roles, @RequirePermissions, @Transactional
│   ├── filters/             # HttpExceptionFilter (global)
│   └── interceptors/        # TransformInterceptor → bọc response thành { data: T }
│
├── config/                  # registerAs('app' | 'database' | 'jwt' | 'redis' | 'mail' | 'genai')
├── database/
│   ├── base/                # BaseEntity (uuid id, createdAt, updatedAt, deletedAt)
│   └── migrations/          # TypeORM migrations (dialect, refresh tokens, partitioning…)
│
├── infrastructure/          # Cross-cutting global modules
│   ├── cache/               # cache-manager wrapper
│   ├── logging/             # request/response logger + interceptor
│   ├── mail/                # nodemailer + Handlebars templates
│   ├── queue/               # Bull queue + email processor
│   ├── storage/             # File upload helper
│   ├── genai/               # Gemini client + key pool + agent prompt assets
│   └── archiving/           # Xoá/lưu trữ dữ liệu học viên (GDPR-like)
│
└── modules/                 # Domain modules
    ├── auth/                # JWT + Local + Google OAuth + refresh, RBAC
    ├── users/               # Hồ sơ, onboarding, xoá tài khoản
    ├── courses/             # Khóa học → Chủ đề (Module) → Bài học
    ├── contents/            # Nội dung bài (text/audio/video)
    ├── vocabularies/        # Từ vựng + search index + upload audio/ảnh
    ├── grammar/             # Quy tắc ngữ pháp
    ├── exercises/           # Bài tập + Câu hỏi + kết quả + Custom exercise (AI-sinh)
    ├── progress/            # Tiến trình bài học / chủ đề / khóa học
    ├── daily-goals/         # Mục tiêu ngày + chuỗi mục tiêu + study minutes
    ├── simulations/         # Hội thoại mô phỏng (scenario + character + session + result)
    ├── personal-vocabularies/ # Từ vựng cá nhân (do học viên thu thập)
    ├── conversations/       # Lưu trữ Hội thoại + Tin nhắn của Trợ lý AI
    ├── agent/               # Agent loop + tool catalog (Zod schemas)
    ├── ai/                  # /ai/chat/stream (SSE) + CRUD Hội thoại
    ├── image-analysis/      # Khám phá ảnh: phân tích ảnh → từ vựng cá nhân
    └── admin/               # Dashboard quản trị
```

## Setup

```bash
# 1. Chạy hạ tầng (postgres + redis) từ root monorepo
cd ..
bun run db:up

# 2. Tạo file env
cp backend/.env.example backend/.env
# Sửa GOOGLE_CLIENT_ID, GENAI_API_KEYS, MAIL_USER, MAIL_PASSWORD...

# 3. Cài dependencies
cd backend
bun install

# 4. Chạy dev
bun run start:dev
```

Server mặc định ở `http://localhost:3000`. API prefix `/api/v1`. Swagger: `http://localhost:3000/api/v1/docs`.

Khi `NODE_ENV=development`, TypeORM bật `synchronize: true` — schema tự sync, không cần chạy migration thủ công.

## Scripts

```bash
bun run start:dev          # Watch mode
bun run start:prod         # Production (cần build trước)
bun run build              # nest build → dist/

bun run lint               # eslint --fix
bun run typecheck          # tsc --noEmit
bun run test               # Jest unit (*.spec.ts trong src/)
bun run test:e2e           # Jest e2e (test/*.e2e-spec.ts) — cần db:up
bun run test:integration   # Suite Bun thuần (scripts/test/suites/*) — cần db:up
bun run test:integration:auth        # Chạy 1 suite
bun run test:scenarios               # End-to-end scenarios

bun run admin:create                 # Tạo admin user
bun run seed:simulations             # Seed danh mục + tình huống + nhân vật
bun run generate:a1-lesson1-audio    # Sinh audio TTS cho Bài học A1.1
bun run docs:generate                # Sinh tài liệu API
```

Thứ tự kiểm tra trước khi commit: `lint → typecheck → test` (xem `../AGENTS.md`).

## Authentication & Authorization

Toàn bộ endpoint mặc định được bảo vệ bởi `JwtAuthGuard` global. Mở public bằng `@Public()`.

| Cơ chế | Mô tả |
|--------|-------|
| Access token | JWT Bearer, TTL `JWT_ACCESS_EXPIRES_IN` (mặc định `15m`) |
| Refresh token | Lưu DB (`RefreshToken` entity), TTL `JWT_REFRESH_EXPIRES_IN` (mặc định `7d`), xoay vòng |
| Local | `POST /auth/login` username/password |
| Google OAuth | `GET /auth/google` (redirect flow) + `POST /auth/google/token` (id_token từ mobile) |
| Verify email | Token một lần (`EmailVerificationToken`), gửi qua mail queue |
| Reset password | Token một lần (`PasswordResetToken`) |

**Authorization**: `@Roles('admin')` + `RolesGuard`, `@RequirePermissions(Permission.X)` + `PermissionsGuard`. Permission enum trong `common/enums`.

**Rate limit**: `ThrottlerGuard` 1000 req/60s (đặt cao để tương thích integration test).

**Trans**: `@Transactional()` method decorator — yêu cầu inject `DataSource` thành `this.dataSource`.

## API endpoints (theo module)

Tất cả endpoint dưới `/api/v1`. Response bọc `{ data: T }` qua `TransformInterceptor`.

| Module | Prefix | Endpoint chính |
|--------|--------|----------------|
| auth | `/auth` | `POST register`, `login`, `refresh`, `logout`, `verify-email`, `forgot-password`, `reset-password`, `google`, `google/callback`, `google/token` |
| users | `/users` | `GET /me`, `PATCH /me`, `POST /onboarding`, `DELETE /me`, `GET /me/data` |
| courses | `/courses` | CRUD khóa học |
| modules | `/modules` | `GET /course/:courseId`, CRUD chủ đề |
| lessons | `/lessons` | `GET /module/:moduleId`, CRUD bài học |
| contents | `/contents` | `GET /lesson/:lessonId`, CRUD nội dung bài |
| vocabularies | `/vocabularies` | `/search`, `/bookmarks`, `/bookmarks/stats`, `POST /:id/bookmark`, `POST /upload-audio`, `POST /upload-image`, CRUD |
| grammar | `/grammar` | `GET /lesson/:lessonId`, CRUD quy tắc |
| exercises | `/exercises` | `/my-results`, `/my-stats`, `/lesson/:lessonId`, `/exercise/:exerciseId`, `POST /:id/submit` |
| exercises | `/exercises` | `POST /custom`, `/generate`, `/regenerate`, `/:id/progress`, `/:id/resume`, `/:id/reset`, `/:id/summary` |
| progress | `/progress` | `/lesson/:id`, `/module/:id`, `/course/:id`; `POST /lesson/:id/start | content-viewed | complete`; `POST /{module,course}/:id/{complete-all,reset}` |
| daily-goals | `/daily-goals` | CRUD + `/progress/today`, `PATCH /progress/study-minutes` |
| simulations | `/simulations` | `/categories`, `/scenarios`, `/sessions/active`, `POST /sessions`, `POST /sessions/:id/messages`, `/results`, `/stats` |
| personal-vocabularies | `/personal-vocabularies` | `POST` (tạo), `POST /from-analysis`, GET, DELETE |
| ai | `/ai` | `POST /chat/stream` (SSE), `POST /chat/simple`, `GET /conversations`, `PATCH /conversations/:id`, `DELETE /conversations/:id` |
| image-analysis | `/image-analysis` | `POST /analyze` |
| admin | `/admin` | `GET /dashboard` |

## AI architecture

- **`infrastructure/genai/`** — wrap `@google/genai` với key pool xoay vòng + cooldown, fallback model, retry, timeout.
- **`modules/agent/`** — `AgentService` chạy vòng lặp Reason-Act. Tool catalog V1 (12 tool) gồm read (`get_user_summary`, `list_bookmarks`, `search_vocabulary`, `find_lessons`…), direct-write (`toggle_bookmark`), và propose (`propose_create_daily_goal`, `propose_generate_custom_exercise`…). Mỗi tool định nghĩa params bằng Zod schema và có `displayName` tiếng Việt cho UI.
- **`modules/ai/`** — REST controller. Endpoint streaming `POST /ai/chat/stream` trả SSE typed events (`tool_start`, `tool_result`, `text_chunk`, `propose`, `error`, `done`). Mobile gửi kèm `screenContext` JSON, backend lưu thành `JSONB` trên `Conversation` (đóng băng tại thời điểm tạo hội thoại).
- **`modules/simulations/`** — không dùng agent loop. `SimulationAiService` gọi Gemini trực tiếp với prompt template riêng (`simulation-conversation.yaml`), trả structured response (`speakerCharacterId`, `nextTurnCharacterId`, `corrections`, `review`, `sessionEnded`…).
- **`modules/image-analysis/`** — gọi Gemini vision, trả về text + danh sách từ vựng cá nhân đề xuất.

## Database

Entity gốc `BaseEntity` (`src/database/base/base.entity.ts`): `id` (uuid), `createdAt`, `updatedAt`, `deletedAt` (soft delete).

Migrations đáng chú ý (`src/database/migrations/`):

- `AddGoogleOAuth` — fields cho Google sign-in
- `AddRefreshTokens` — bảng refresh token độc lập
- `AddDialectAndClassifier` — phương ngữ + danh từ phân loại trên từ vựng
- `AddVocabularySearchIndex` — index full-text search
- `AddPartitioning` — phân mảnh bảng log/heavy tables
- `AddPartialUniqueIndexes` — unique có điều kiện (soft delete)

Trong dev, `synchronize: true` áp dụng — không cần migration thủ công. Trong prod, chạy migrations bằng TypeORM CLI.

## Environment variables

Xem `backend/.env.example` để có danh sách đầy đủ. Các nhóm:

- **Database**: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- **App**: `PORT`, `NODE_ENV`, `API_PREFIX=api`, `API_VERSION=v1`, `BASE_URL`, `FRONTEND_URL`, `APP_NAME`, `APP_TAGLINE`
- **JWT**: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- **Redis**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
- **Mail (Gmail SMTP)**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`
- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Gemini**: `GENAI_API_KEYS` (key pool, phẩy ngăn cách), `GENAI_CHAT_MODEL`, `GENAI_CHAT_FALLBACK_MODEL`, `GENAI_EMBED_MODEL`, `GENAI_IMAGE_MODEL`, `GENAI_TTS_MODEL`, `GENAI_MAX_RETRIES`, `GENAI_TIMEOUT`

## Docker

`backend/Dockerfile` là multi-stage build trên `oven/bun:1.3-alpine`:

1. **builder** — copy `package.json` + `bun.lock`, `bun install`, build (sinh `dist/`).
2. **runner** — `NODE_ENV=production`, `bun install --production`, copy `dist/`, copy mail templates (Handlebars `.hbs`), tạo `uploads/` và `logs/`, `EXPOSE 3000`, `CMD ["bun", "dist/main.js"]`.

Build + chạy stack đầy đủ (postgres + redis + backend) từ root:

```bash
bun run db:up   # docker-compose lên cả 3 service
```

Khi chạy trong compose, backend trỏ về `postgres:5432` và `redis:6379` (xem `../docker-compose.yml`).

## Uploads & static

`uploads/` được mount/serve qua `ServeStaticModule` ở route `/uploads`. Bên trong có `audio/` (TTS đã sinh), ảnh từ vựng… `POST /vocabularies/upload-audio` và `POST /vocabularies/upload-image` ghi vào đây.

## Tests

Có 3 tầng test:

| Loại | Vị trí | Chạy bằng |
|------|--------|-----------|
| Unit | `src/**/*.spec.ts` | `jest` |
| E2E | `test/*.e2e-spec.ts` | `jest` + `test/jest-e2e.json` |
| Integration | `scripts/test/suites/*.test.ts` | Bun thuần (`bun run`), không Jest |
| Scenario | `scripts/test/scenarios/*.scenario.ts` | Bun thuần |

E2E và integration cần `bun run db:up` đang chạy (postgres + redis).

## Scripts khác

`scripts/` chứa các tiện ích vận hành: `create-admin.ts`, `seed-simulations.ts`, `seed-lessons.ts`, `generate-a1-lesson1-audio.ts`, `check-seeds.ts`, `compare-seed-db.ts`, `count-hierarchy.ts`, `standardize-seeds.ts`. Tất cả chạy được bằng `bun scripts/<tên>.ts`.
