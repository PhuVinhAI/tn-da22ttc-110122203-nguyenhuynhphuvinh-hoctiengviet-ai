# Ứng dụng hỗ trợ dạy học tiếng Việt với trí tuệ nhân tạo

Ứng dụng hỗ trợ dạy học tiếng Việt với trí tuệ nhân tạo (LinVNix) là nền tảng học tiếng Việt có hỗ trợ AI dành cho người học nước ngoài. Hệ thống giúp người học theo các bài giảng có cấu trúc, từ vựng, ngữ pháp, phát âm, khám phá từ vựng qua hình ảnh, mục tiêu học hằng ngày, trợ lý AI toàn ứng dụng và các hội thoại tiếng Việt mô phỏng tình huống thực tế.

## Bố cục kho mã

Kho mã nộp bài này tuân theo cấu trúc đồ án tốt nghiệp quy định:

```text
.
├── docs/      # Tài liệu đồ án và hướng dẫn chạy demo
├── src/       # Toàn bộ mã nguồn và tài nguyên dự án
└── README.md  # Tổng quan dự án, kiến trúc, yêu cầu và hướng dẫn chạy
```

Thư mục `docs/` chứa các tệp báo cáo đồ án và đề cương chi tiết hiện có. Các tệp slide và poster chưa được đưa vào do hiện chưa hoàn thiện.

Thư mục `src/` chứa toàn bộ mã nguồn dự án, bao gồm backend, admin, landing page, ứng dụng mobile, gói dùng chung, các tệp Docker, dữ liệu seed, và các tệp media runtime thuộc dự án.

## Tính năng chính

- Khóa học tiếng Việt có cấu trúc theo trình độ CEFR, chủ đề, bài học, từ vựng, ngữ pháp và bài tập tương tác.
- Ứng dụng mobile Flutter dành cho người học với xác thực, onboarding, học khóa học, từ đã lưu, mục tiêu hằng ngày và hồ sơ cá nhân.
- Trợ lý AI toàn ứng dụng với ngữ cảnh màn hình hiện tại, phản hồi dạng streaming và các công cụ backend để tra cứu bài học, tiến độ, từ vựng, ngữ pháp và bookmark.
- Mô phỏng hội thoại bằng AI với kịch bản, nhân vật, sửa lỗi theo từng tin nhắn, tiêu chí chấm điểm và lịch sử kết quả.
- Luồng khám phá hình ảnh giúp người học phân tích hình ảnh và thu thập từ vựng cá nhân.
- Ứng dụng admin để quản lý nội dung học, kịch bản mô phỏng, người dùng và cấu hình nền tảng.
- Landing page giới thiệu dự án và nội dung công khai.

## Kiến trúc

```text
Ứng dụng mobile Flutter
        |
        | REST API + SSE streaming
        v
API backend NestJS
        |
        +-- PostgreSQL 16 cho dữ liệu quan hệ
        +-- Redis 7 + Bull cho hàng đợi/bộ nhớ đệm
        +-- Google Gemini / nhà cung cấp tương thích OpenAI cho tính năng AI
        +-- Media tải lên và tạo ra nằm trong backend/uploads

Ứng dụng admin Electron/React
        |
        +-- Dùng chung API backend

Landing page Astro
        |
        +-- Trải nghiệm web tĩnh/công khai
```

Mã nguồn là một monorepo Bun workspace trong `src/`:

```text
src/
├── backend/             # API NestJS 11
├── admin/               # Ứng dụng admin Electron + React + Vite
├── landing/             # Landing page Astro
├── packages/shared/     # Trừu tượng AI và schema dùng chung
├── mobile/              # Ứng dụng mobile Flutter
├── docker-compose.yml   # PostgreSQL, Redis, backend
└── package.json         # Gốc Bun workspace
```

## Yêu cầu hệ thống

- Bun 1.x
- Node.js 18 trở lên
- Docker và Docker Compose
- Flutter SDK 3.11 trở lên
- Google OAuth client ID để đăng nhập
- Khóa API Gemini, hoặc cấu hình nhà cung cấp tương thích OpenAI, cho các tính năng AI

## Khởi động nhanh

Tất cả lệnh dưới đây chạy từ thư mục gốc của kho mã nộp bài.

```bash
cd src
bun install
```

Khởi động PostgreSQL, Redis và container backend:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Chỉnh sửa backend/.env và đặt giá trị JWT, Google OAuth, mail và nhà cung cấp AI.
bun run db:up
```

Chạy backend ở chế độ phát triển mà không đóng gói API trong Docker:

```bash
cd src/backend
bun run start:dev
```

Địa chỉ backend:

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`

Chạy ứng dụng admin:

```bash
cd src/admin
cp .env.example .env
bun install
bun run dev:web
```

Chạy landing page:

```bash
cd src/landing
bun install
bun run dev
```

Chạy ứng dụng mobile:

```bash
cd src/mobile
flutter pub get
cp .env.example assets/.env
# Chỉnh sửa assets/.env nếu backend không ở http://localhost:3000.
dart run build_runner build --delete-conflicting-outputs
flutter run
```

Với Android emulator, đặt `API_URL=http://10.0.2.2:3000` trong `src/mobile/assets/.env`. Với thiết bị vật lý, dùng địa chỉ IP LAN của máy phát triển.

## Hướng dẫn demo

Xem [`docs/run-demo-guide.md`](docs/run-demo-guide.md) để có hướng dẫn đầy đủ hơn về cách thiết lập và sử dụng demo.

## Lệnh hữu ích

Từ `src/`:

```bash
bun run db:up
bun run db:down
bun run backend:dev
bun run admin:dev:web
bun run landing:dev
bun run mobile:pub:get
bun run mobile:run
```

Từ `src/backend/`:

```bash
bun run admin:create
bun run db:reset-seed
bun run test
bun run test:e2e
```

## Lưu ý

- Các bí mật runtime không được commit. Dùng các tệp `.env.example` trong `src/`, `src/backend/`, `src/admin/` và `src/mobile/`.
- Các kết quả build và thư mục phụ thuộc như `node_modules`, `dist`, `build`, `.dart_tool` và `.astro` được loại trừ có chủ đích.
- README gốc của dự án được giữ lại tại `src/README.md`.
