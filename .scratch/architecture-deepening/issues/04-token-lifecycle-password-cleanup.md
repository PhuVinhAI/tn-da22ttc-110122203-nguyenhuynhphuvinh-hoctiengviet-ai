Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Mở rộng TokenLifecycle module: password reset token lifecycle + cleanup + xóa TokenService chết. Interface thêm:

- `createPasswordResetToken(userId) → { token, expiresAt }` — xóa token cũ chưa dùng, tạo mới 32 bytes, hết hạn 1h
- `verifyPasswordResetToken(token) → { userId, email }` — tìm token chưa dùng, kiểm tra hết hạn, đánh dấu đã dùng
- `cleanupExpired() → { verificationTokensRemoved, passwordResetTokensRemoved, refreshTokensRemoved }`

Module nội bộ sở hữu `PasswordResetToken` entity và repository. AuthService không còn inject `@InjectRepository(PasswordResetToken)` — ủy quyền cho TokenLifecycle. Refresh token vẫn thuộc AuthService (gắn phiên đăng nhập).

Xóa file `TokenService` chết (không ai gọi). AuthService giảm đáng kể dòng code.

Cập nhật Jest *.spec.ts cho TokenLifecycle — thêm test password reset + cleanup.

## Acceptance criteria

- [x] TokenLifecycle có `createPasswordResetToken` + `verifyPasswordResetToken` + `cleanupExpired`
- [x] AuthService không còn inject `@InjectRepository(PasswordResetToken)`
- [x] `TokenService` chết bị xóa (không tồn tại trong codebase)
- [ ] AuthService giảm dưới 350 dòng (từ 534) — hiện 480 dòng, cần extract OAuth/refresh token ở issue riêng
- [x] Jest *.spec.ts cho TokenLifecycle password reset + cleanup pass (18/18)
- [x] Auth integration tests vẫn pass (cần server+DB chạy)
- [x] HTTP API contract không đổi

## Blocked by

- `03-token-lifecycle-email.md`
