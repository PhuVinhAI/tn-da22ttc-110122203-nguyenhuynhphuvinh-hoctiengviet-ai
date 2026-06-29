# LinVNix

Nền tảng hỗ trợ dạy học tiếng Việt cho người nước ngoài, tích hợp AI đa phương thức. Học viên rèn luyện từ vựng, ngữ pháp, phát âm và giao tiếp thông qua bài học có cấu trúc, bài tập tương tác, Trợ lý AI bao quát toàn app, và hội thoại mô phỏng tình huống thực.

## Cấu trúc monorepo

```
LinVNix/
├── backend/              # NestJS 11 API · PostgreSQL · Redis · Gemini AI
├── mobile/               # Flutter app · Riverpod · GoRouter
├── admin/                # Electron + React + Vite admin panel (tách rời — không trong bun workspace)
├── packages/             # Shared packages (placeholder)
├── docs/                 # ADR + agent docs
├── docker-compose.yml    # postgres:16 + redis:7 + backend
├── CONTEXT.md            # Domain language tiếng Việt (Khóa học, Chủ đề, Trợ lý AI…)
├── AGENTS.md             # Quy ước cho agent: commands, guards, style, test
└── package.json          # Bun workspace root (chỉ chứa backend + packages/*)
```

Ba app **độc lập** về dependencies:

| App | Package manager | Trong bun workspace? |
|-----|-----------------|---------------------|
| `backend` | Bun | ✅ |
| `mobile` | `flutter pub` | ❌ |
| `admin` | Bun (riêng) | ❌ — cài từ `admin/` |

## Yêu cầu hệ thống

- [Bun](https://bun.sh/) ≥ 1.0
- [Node.js](https://nodejs.org/) ≥ 18 (cho tooling — runtime backend dùng Bun)
- [Flutter](https://flutter.dev/) ≥ 3.11
- [Docker](https://www.docker.com/) + Docker Compose
- API key Google Gemini (cho tính năng AI) và Google OAuth client (cho đăng nhập)

## Quickstart

```bash
# 1. Hạ tầng: PostgreSQL 16 + Redis 7 (Docker)
bun run db:up

# 2. Backend
cp backend/.env.example backend/.env
# Sửa GOOGLE_CLIENT_ID, GENAI_API_KEYS, MAIL_USER, MAIL_PASSWORD…
cd backend && bun install && bun run start:dev
# → http://localhost:3000
# → Swagger: http://localhost:3000/api/v1/docs

# 3. Mobile (cửa sổ terminal khác)
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
# Tạo assets/.env (API_URL, GOOGLE_CLIENT_ID) — xem mobile/README.md
flutter run
```

Chi tiết per-app: [`backend/README.md`](backend/README.md), [`mobile/README.md`](mobile/README.md).

## Scripts gốc

```bash
# Hạ tầng
bun run db:up        # docker-compose up -d
bun run db:down
bun run db:logs

# Backend (delegate xuống backend/)
bun run backend:dev
bun run backend:build
bun run backend:start

# Mobile (delegate xuống mobile/)
bun run mobile:run
bun run mobile:build:android
bun run mobile:build:ios
```

## Docker compose

`docker-compose.yml` lên 3 service:

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| `postgres` | `postgres:16-alpine` | `5432:5432` | `postgres_data` |
| `redis` | `redis:7-alpine` (AOF on) | `6379:6379` | `redis_data` |
| `backend` | build từ `backend/Dockerfile` (Bun multi-stage) | `${PORT:-3000}:3000` | `backend_uploads`, `backend_logs` |

Khi chạy compose, backend tự trỏ `DATABASE_HOST=postgres`, `REDIS_HOST=redis` (override `.env`).

## Tech stack

**Backend** — NestJS 11 · TypeORM 0.3 · PostgreSQL 16 · Redis 7 · Bull · JWT + Google OAuth · Google Gemini (key pool) · Swagger · Bun runtime · Docker multi-stage.

**Mobile** — Flutter ≥ 3.11 · Riverpod 3 · GoRouter 17 · Dio · Freezed · Hive · flutter_secure_storage · just_audio · speech_to_text · google_sign_in · flutter_local_notifications.

**Admin** (tách rời) — Electron + React + Vite. Không ưu tiên phát triển ở giai đoạn hiện tại.

## Cấu trúc giải pháp

Kiến trúc thực thi:

- Mobile gửi REST + SSE → Backend.
- Trợ lý AI: mobile POST `/api/v1/ai/chat/stream` kèm `screenContext` snapshot → backend lazy-create Hội thoại → chạy agent loop (Gemini + 12 tool) → SSE typed events về mobile.
- Hội thoại mô phỏng: REST request-response thuần (không streaming) — backend trả structured metadata (`speakerCharacterId`, `nextTurnCharacterId`, `corrections`, `review`).
- Phiên bài tập: mobile lưu Hive offline, sync khi nộp.
- TTS audio: backend sinh trước (script `generate:a1-lesson1-audio`) hoặc theo nhu cầu → mobile phát qua `just_audio` từ `/uploads/audio/...`.

## Domain language

Đọc [`CONTEXT.md`](CONTEXT.md) trước khi viết code. Một số term quan trọng dễ nhầm:

- **Chủ đề** = Module (không gọi "Unit")
- **Yêu sách** = Bookmark (không gọi "Flashcard"/"Favorite")
- **Học viên** = User vai trò USER (vs **Quản trị viên** vai trò ADMIN)
- **Hội thoại** = phiên hỏi đáp ngắn 1-ngữ-cảnh với Trợ lý AI (KHÁC **Hội thoại mô phỏng** ở tab riêng)
- **Bài tập do AI sinh** = Custom Exercise Set, cá nhân học viên
- **Khám phá ảnh** = ephemeral, KHÁC Trợ lý AI

## AI Provider Configuration

Backend hỗ trợ 3 chế độ vận hành AI:

1. **Default Gemini** — Không set bất kỳ `AI_*_PROVIDER` nào. Mọi feature dùng chung Gemini KeyPool global (`GENAI_API_KEYS`). Backwards-compatible 100%.
2. **Per-feature OpenAI** — Set `AI_<FEATURE>_PROVIDER=openai` cho feature muốn override. Feature đó dùng OpenAI-compatible gateway (OpenRouter, LiteLLM, Ollama, vLLM…) với URL/key/model riêng.
3. **Mix** — Một số feature dùng OpenAI, còn lại vẫn Gemini. Mỗi feature cấu hình độc lập.

### Feature × Provider support

| Feature | Gemini | OpenAI-compatible | Ghi chú |
|---------|--------|-------------------|---------|
| `exercise` | ✅ | ✅ | Sinh bài tập tùy chỉnh |
| `simulation` | ✅ | ✅ | Hội thoại mô phỏng |
| `assistant` | ✅ | ✅ | Trợ lý AI — xem caveat bên dưới |
| `image_analysis` | ✅ | ❌ locked | Khám phá ảnh — Gemini multimodal |

> **Lưu ý `assistant`**: Nếu gateway OpenAI không hỗ trợ tool calling, Trợ lý AI sẽ chạy ở chế độ text-only (agent loop kết thúc sớm sau turn đầu). Xem warning trong `backend/.env.example`.

Xem cấu hình chi tiết trong `backend/.env.example`. Xem quyết định kiến trúc tại [`docs/adr/0001-multi-provider-ai-routing.md`](docs/adr/0001-multi-provider-ai-routing.md).

## Tài liệu

- [`CONTEXT.md`](CONTEXT.md) — domain language + nghi vấn đã giải quyết
- [`AGENTS.md`](AGENTS.md) — quy ước cho coding agent (commands, guards, decorators, style)
- [`docs/`](docs/) — ADR + agent skill docs
- [`docs/adr/0001-multi-provider-ai-routing.md`](docs/adr/0001-multi-provider-ai-routing.md) — Multi-provider AI routing ADR
- [`backend/README.md`](backend/README.md) — chi tiết backend
- [`mobile/README.md`](mobile/README.md) — chi tiết mobile

## Repository

```
git@github.com:PhuVinhAI/LinVNix.git
```
