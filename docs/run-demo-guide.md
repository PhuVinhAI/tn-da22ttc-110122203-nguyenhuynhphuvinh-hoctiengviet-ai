# Hướng dẫn chạy và demo LinVNix

Tài liệu này hướng dẫn cách chạy đồ án tốt nghiệp LinVNix trên máy cục bộ để trình diễn.

## 1. Chuẩn bị yêu cầu hệ thống

Cài đặt các công cụ sau trước khi chạy dự án:

- Bun 1.x
- Node.js 18 trở lên
- Docker và Docker Compose
- Flutter SDK 3.11 trở lên
- Android Studio hoặc Xcode cho trình mô phỏng mobile

Các tính năng AI và xác thực cần thông tin xác thực của nhà cung cấp:

- Google OAuth client ID
- Khóa API Gemini, hoặc khóa API và base URL của nhà cung cấp tương thích OpenAI

## 2. Cài đặt phụ thuộc mã nguồn

Từ thư mục gốc của kho mã nộp bài:

```bash
cd src
bun install
```

Cài đặt phụ thuộc Flutter:

```bash
cd mobile
flutter pub get
cd ..
```

## 3. Cấu hình tệp môi trường

Tạo cấu hình Docker Compose gốc:

```bash
cd src
cp .env.example .env
```

Tạo cấu hình backend:

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa `backend/.env` và đặt tối thiểu:

```text
JWT_SECRET=<jwt-secret-của-bạn>
JWT_REFRESH_SECRET=<refresh-secret-của-bạn>
GOOGLE_CLIENT_ID=<google-client-id-của-bạn>
GENAI_API_KEYS=<gemini-api-key-của-bạn>
```

Nếu xác thực email được bật trong luồng demo đã chọn, cũng cần cấu hình các biến mail trong `backend/.env`.

Tạo cấu hình admin:

```bash
cd admin
cp .env.example .env
cd ..
```

Tạo cấu hình mobile:

```bash
cd mobile
cp .env.example assets/.env
cd ..
```

Với Android emulator, đặt trong `mobile/assets/.env`:

```text
API_URL=http://10.0.2.2:3000
GOOGLE_CLIENT_ID=<google-client-id-của-bạn>
```

Với iOS simulator hoặc thử nghiệm desktop web:

```text
API_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<google-client-id-của-bạn>
```

Với thiết bị mobile vật lý, thay `localhost` bằng địa chỉ IP LAN của máy phát triển.

## 4. Khởi động hạ tầng

Từ `src/`:

```bash
bun run db:up
```

Lệnh này khởi động:

- PostgreSQL 16
- Redis 7
- Container backend

Để phát triển backend cục bộ, vẫn có thể chạy API trực tiếp:

```bash
cd backend
bun run start:dev
```

API backend truy cập được tại:

- URL gốc API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/v1/docs`

## 5. Nạp dữ liệu demo

Từ `src/backend/`:

```bash
bun run db:reset-seed
bun run admin:create
```

Dùng tài khoản admin được tạo để đăng nhập vào ứng dụng admin.

## 6. Chạy ứng dụng admin

Chế độ web:

```bash
cd src/admin
bun install
bun run dev:web
```

Chế độ desktop Electron:

```bash
cd src/admin
bun run dev
```

Dùng ứng dụng admin để xem hoặc quản lý:

- Khóa học, chủ đề, bài học, từ vựng, ngữ pháp và bài tập
- Danh mục mô phỏng, kịch bản và nhân vật
- Cấu hình nền tảng

## 7. Chạy ứng dụng mobile

Từ `src/mobile/`:

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

Luồng demo đề xuất:

1. Đăng ký hoặc đăng nhập bằng tài khoản người học.
2. Hoàn tất onboarding và chọn trình độ CEFR.
3. Mở khóa học, chủ đề và bài học.
4. Học nội dung bài học, từ vựng và ngữ pháp.
5. Hoàn thành các bài tập tương tác.
6. Mở luồng từ đã lưu và ôn lại từ vựng.
7. Dùng trợ lý AI từ màn hình bài học và hỏi về nội dung hiện tại.
8. Mở mô phỏng hội thoại, chọn kịch bản và nhân vật, rồi trò chuyện bằng tiếng Việt.
9. Xem phản hồi sửa lỗi và kết quả mô phỏng cuối cùng.
10. Mở khám phá hình ảnh, phân tích một hình ảnh và thêm từ vựng được gợi ý nếu đã cấu hình.

## 8. Chạy landing page

Từ `src/landing/`:

```bash
bun install
bun run dev
```

## 9. Dừng demo

Từ `src/`:

```bash
bun run db:down
```

## 10. Xử lý sự cố

Nếu ứng dụng mobile không kết nối được tới API:

- Android emulator: dùng `http://10.0.2.2:3000`
- iOS simulator: dùng `http://localhost:3000`
- Thiết bị vật lý: dùng địa chỉ IP LAN của máy host

Nếu các tính năng AI lỗi:

- Kiểm tra `backend/.env`
- Xác nhận khóa API của nhà cung cấp đã chọn còn hợp lệ
- Xác nhận backend đã khởi động lại sau khi thay đổi biến môi trường

Nếu đăng nhập admin thất bại:

- Chạy lại `bun run admin:create` từ `src/backend/`
- Xác nhận backend đang chạy và truy cập được từ `VITE_API_BASE_URL`
