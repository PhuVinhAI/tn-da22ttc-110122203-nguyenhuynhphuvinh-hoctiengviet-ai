---
description: API Reference Index - BẮT BUỘC đọc docs module tương ứng trước khi code để tránh ảo giác về API
---

# LinVNix API Reference Index

> **CRITICAL - Hướng dẫn cho AI:**
> 
> 1. **File này là INDEX/MAP** - Liệt kê tất cả API modules có sẵn
> 2. **BẮT BUỘC đọc docs trước khi code** - Đọc file tương ứng trong `.kiro/api-docs/{module}.md` trước khi chỉnh sửa bất kỳ endpoint nào
> 3. **Tránh ảo giác về API** - KHÔNG đoán request/response schema, luôn verify với docs
> 
> **Khi thêm/sửa endpoint:**
> 1. Thêm Swagger decorators đầy đủ (`@ApiOperation`, `@ApiResponse`, `@ApiBody`, etc.)
> 2. Chạy `npm run docs:generate` trong `backend/` để cập nhật docs
> 3. Verify docs đã được generate đúng trước khi commit

## 📚 Available API Modules

Dưới đây là danh sách các module API có sẵn. Mỗi module được tách thành file riêng để tối ưu context window.

### Cache
📄 File: `.kiro/api-docs/cache.md`

**Endpoints:**
- `GET /api/v1/cache/stats` - Lấy thống kê cache
- `DELETE /api/v1/cache/clear` - Xóa toàn bộ cache

### Authentication
📄 File: `.kiro/api-docs/authentication.md`

**Endpoints:**
- `POST /api/v1/auth/register` - Đăng ký tài khoản mới
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/verify-email` - Xác thực email
- `POST /api/v1/auth/forgot-password` - Quên mật khẩu
- `POST /api/v1/auth/reset-password` - Đặt lại mật khẩu
- `POST /api/v1/auth/resend-verification` - Gửi lại email xác thực
- `GET /api/v1/auth/google` - Đăng nhập bằng Google
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `POST /api/v1/auth/refresh` - Làm mới access token
- `POST /api/v1/auth/logout` - Đăng xuất

### Users
📄 File: `.kiro/api-docs/users.md`

**Endpoints:**
- `GET /api/v1/users/me` - Lấy thông tin user hiện tại
- `PATCH /api/v1/users/me` - Cập nhật thông tin user

### Courses
📄 File: `.kiro/api-docs/courses.md`

**Endpoints:**
- `GET /api/v1/courses` - Lấy danh sách tất cả khóa học
- `POST /api/v1/courses` - Tạo khóa học mới (Admin only)
- `GET /api/v1/courses/{id}` - Lấy chi tiết khóa học
- `PATCH /api/v1/courses/{id}` - Cập nhật khóa học (Admin only)
- `DELETE /api/v1/courses/{id}` - Xóa khóa học (Admin only)

### Units
📄 File: `.kiro/api-docs/units.md`

**Endpoints:**
- `GET /api/v1/units/course/{courseId}` - Lấy danh sách units theo course
- `GET /api/v1/units/{id}` - Lấy chi tiết unit
- `PATCH /api/v1/units/{id}` - Cập nhật unit
- `DELETE /api/v1/units/{id}` - Xóa unit
- `POST /api/v1/units` - Tạo unit mới

### Lessons
📄 File: `.kiro/api-docs/lessons.md`

**Endpoints:**
- `GET /api/v1/lessons/unit/{unitId}` - Lấy danh sách lessons theo unit
- `GET /api/v1/lessons/{id}` - Lấy chi tiết lesson với nội dung đầy đủ
- `PATCH /api/v1/lessons/{id}` - Cập nhật lesson
- `DELETE /api/v1/lessons/{id}` - Xóa lesson
- `POST /api/v1/lessons` - Tạo lesson mới

### Contents
📄 File: `.kiro/api-docs/contents.md`

**Endpoints:**
- `GET /api/v1/contents/lesson/{lessonId}` - Lấy nội dung theo lesson
- `GET /api/v1/contents/{id}` - Lấy chi tiết nội dung
- `PATCH /api/v1/contents/{id}` - Cập nhật nội dung
- `DELETE /api/v1/contents/{id}` - Xóa nội dung
- `POST /api/v1/contents` - Tạo nội dung mới

### Vocabularies
📄 File: `.kiro/api-docs/vocabularies.md`

**Endpoints:**
- `GET /api/v1/vocabularies/search` - Tìm kiếm từ vựng
- `GET /api/v1/vocabularies/lesson/{lessonId}` - Lấy từ vựng theo lesson
- `POST /api/v1/vocabularies` - Tạo từ vựng mới
- `PATCH /api/v1/vocabularies/{id}` - Cập nhật từ vựng
- `DELETE /api/v1/vocabularies/{id}` - Xóa từ vựng
- `POST /api/v1/vocabularies/{vocabularyId}/learn` - Thêm từ vựng vào danh sách học
- `POST /api/v1/vocabularies/review/batch` - Ôn tập nhiều từ vựng cùng lúc
- `POST /api/v1/vocabularies/{vocabularyId}/review` - Ôn tập từ vựng
- `GET /api/v1/vocabularies/my-vocabularies` - Lấy danh sách từ vựng đã học
- `GET /api/v1/vocabularies/due-review` - Lấy từ vựng cần ôn tập
- `POST /api/v1/vocabularies/upload-audio` - Upload audio cho từ vựng
- `POST /api/v1/vocabularies/upload-image` - Upload hình ảnh cho từ vựng

### Progress
📄 File: `.kiro/api-docs/progress.md`

**Endpoints:**
- `GET /api/v1/progress` - Lấy toàn bộ tiến độ học của user
- `GET /api/v1/progress/lesson/{lessonId}` - Lấy tiến độ của 1 lesson
- `POST /api/v1/progress/lesson/{lessonId}/start` - Bắt đầu học lesson
- `POST /api/v1/progress/lesson/{lessonId}/complete` - Hoàn thành lesson
- `PATCH /api/v1/progress/lesson/{lessonId}/time` - Cập nhật thời gian học

### Grammar
📄 File: `.kiro/api-docs/grammar.md`

**Endpoints:**
- `GET /api/v1/grammar/lesson/{lessonId}` - Lấy ngữ pháp theo lesson
- `GET /api/v1/grammar/{id}` - Lấy chi tiết ngữ pháp
- `PATCH /api/v1/grammar/{id}` - Cập nhật ngữ pháp
- `DELETE /api/v1/grammar/{id}` - Xóa ngữ pháp
- `POST /api/v1/grammar` - Tạo ngữ pháp mới

### Exercises
📄 File: `.kiro/api-docs/exercises.md`

**Endpoints:**
- `GET /api/v1/exercises/my-results` - Lấy kết quả bài tập của user
- `GET /api/v1/exercises/my-stats` - Lấy thống kê bài tập
- `GET /api/v1/exercises/lesson/{lessonId}` - Lấy bài tập theo lesson
- `GET /api/v1/exercises/{id}` - Lấy chi tiết bài tập
- `PATCH /api/v1/exercises/{id}` - Cập nhật bài tập
- `DELETE /api/v1/exercises/{id}` - Xóa bài tập
- `POST /api/v1/exercises` - Tạo bài tập mới
- `POST /api/v1/exercises/{id}/submit` - Nộp bài tập

### Admin
📄 File: `.kiro/api-docs/admin.md`

**Endpoints:**
- `GET /api/v1/admin/dashboard` - Lấy thống kê dashboard cho Admin

---

## 🤖 AI Workflow

Khi làm việc với API:

1. **Đọc file module tương ứng** trước khi code
2. **Kiểm tra request/response schema** để hiểu đúng cấu trúc
3. **Xem ví dụ JSON** để tránh sai format
4. **Không đoán** - luôn verify với docs

## 📝 Notes

- Docs được tự động generate từ Swagger
- Chạy `npm run docs:generate` để cập nhật
- Mỗi module có schemas liên quan đi kèm
