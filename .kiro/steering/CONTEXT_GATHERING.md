---
description: Bắt buộc sử dụng context-gatherer trước khi code
---

# Context Gathering Protocol

**BẮT BUỘC 100% LUÔN GỌI `context-gatherer` TRƯỚC KHI CODE. KHÔNG CÓ NGOẠI LỆ.**

## Notes
- TypeORM auto-sync trong dev, không cần chạy migration manually
- Package manager: Bun (dùng `bun add` thay vì `npm install`)
- Sau khi code xong: LUÔN chạy `bun run typecheck` trong backend để verify TypeScript

## Database Migration Notes

**QUAN TRỌNG:** Dự án này sử dụng TypeORM với `synchronize: true` trong development.
- Migration files được tạo để document schema changes
- KHÔNG CẦN chạy migration manually trong dev mode
- Database schema tự động sync khi start app
- Migration chỉ cần chạy trong production
