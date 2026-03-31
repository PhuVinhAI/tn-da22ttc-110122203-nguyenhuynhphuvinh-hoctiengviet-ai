# API Documentation (Split by Module)

> **Auto-generated từ Swagger** - Không chỉnh sửa trực tiếp

## 📚 Cấu trúc

Mỗi module API được tách thành file riêng để tối ưu context window cho AI:

- `authentication.md` - Auth endpoints (register, login, OAuth, etc.)
- `users.md` - User management
- `courses.md` - Course CRUD
- `units.md` - Unit management
- `lessons.md` - Lesson management
- `contents.md` - Learning content
- `vocabularies.md` - Vocabulary & spaced repetition
- `progress.md` - Learning progress tracking
- `grammar.md` - Grammar rules
- `exercises.md` - Exercise system
- `admin.md` - Admin dashboard
- `cache.md` - Cache management

## 🔄 Cập nhật

Chạy lệnh sau để regenerate toàn bộ docs:

```bash
cd backend
npm run docs:generate
```

Script sẽ:
1. Fetch Swagger JSON từ server (phải đang chạy)
2. Generate file tổng hợp tại `backend/docs/API.md`
3. Tách thành các file module tại `.kiro/api-docs/`
4. Cập nhật steering index tại `.kiro/steering/API_REFERENCE.md`

## 🤖 Hướng dẫn cho AI

Khi làm việc với API:

1. **Đọc steering index** (`.kiro/steering/API_REFERENCE.md`) để biết module nào cần đọc
2. **Đọc file module cụ thể** trước khi code
3. **Verify request/response schema** để tránh ảo giác
4. **Không đoán** - luôn check docs

## 📝 Notes

- Mỗi file module chứa cả schemas liên quan
- Request/response có ví dụ JSON đầy đủ
- Enum values được list inline
- Nested objects được expand hoàn toàn
