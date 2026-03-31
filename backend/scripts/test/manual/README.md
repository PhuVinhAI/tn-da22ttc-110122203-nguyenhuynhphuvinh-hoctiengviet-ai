# Manual Tests

Manual tests yêu cầu tương tác của người dùng để test các flow phức tạp như OAuth.

## Google OAuth Test

Test flow đăng nhập bằng Google OAuth với tương tác thật.

### Prerequisites

1. Backend đang chạy:
```bash
bun run start:dev
```

2. Google OAuth đã được cấu hình trong `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

3. Database đã có migration cho OAuth fields:
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN provider VARCHAR DEFAULT 'local';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Chạy Test

```bash
# Từ thư mục backend
bun run test:manual:google-oauth

# Hoặc trực tiếp
bun run scripts/test/manual/google-oauth.test.ts
```

### Flow

1. Script sẽ start một temporary server tại `http://localhost:3001` để capture callback
2. Browser tự động mở đến `http://localhost:3000/api/auth/google`
3. Bạn đăng nhập bằng Google account
4. Sau khi đăng nhập thành công, Google redirect về callback URL
5. Script capture token từ callback
6. Script verify token và fetch user data
7. Script kiểm tra các OAuth fields (googleId, provider, emailVerified, etc.)

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║         Google OAuth Manual Test                          ║
╚════════════════════════════════════════════════════════════╝

1️⃣  Checking backend...
✓ Backend is running

2️⃣  Starting callback server...
✓ Callback server đang chạy tại http://localhost:3001

3️⃣  Opening browser for Google OAuth...

📝 Instructions:
   1. Browser sẽ mở trang Google login
   2. Đăng nhập bằng Google account của bạn
   3. Cho phép quyền truy cập
   4. Đợi redirect về callback page
   5. Script sẽ tự động capture token (timeout: 120s)

4️⃣  Waiting for OAuth callback...
✓ Token captured!

5️⃣  Verifying token...
✓ Token payload: {
  "sub": "user-id",
  "email": "user@gmail.com",
  "iat": 1234567890,
  "exp": 1234567890
}

6️⃣  Fetching user data...
✓ User data: {
  "id": "uuid",
  "email": "user@gmail.com",
  "fullName": "User Name",
  "googleId": "google-user-id",
  "provider": "google",
  "emailVerified": true,
  "avatarUrl": "https://..."
}

7️⃣  Verifying OAuth fields...
✓ Email: user@gmail.com
✓ Full Name: User Name
✓ Google ID: google-user-id
✓ Provider: google
✓ Email Verified: true
✓ Avatar URL: https://...

╔════════════════════════════════════════════════════════════╗
║                  ✓ ALL TESTS PASSED                       ║
╚════════════════════════════════════════════════════════════╝

📊 Summary:
   • User ID: uuid
   • Email: user@gmail.com
   • Provider: google
   • Google ID: google-user-id
   • Token: eyJhbGciOiJIUzI1NiIsInR5cCI6...

🧹 Callback server closed
```

### Troubleshooting

#### Backend not running
```
✗ Backend is not running!
   Please start backend first: bun run start:dev
```
→ Start backend trước khi chạy test

#### Timeout waiting for callback
```
❌ Test failed: Error: Timeout waiting for OAuth callback
```
→ Bạn có 120 giây để hoàn thành login. Nếu timeout, chạy lại test.

#### Port 3001 already in use
```
Error: listen EADDRINUSE: address already in use :::3001
```
→ Đóng process đang dùng port 3001 hoặc đổi `frontendPort` trong script

#### Token không hợp lệ
```
Failed to fetch user profile: 401 Unauthorized
```
→ Kiểm tra JWT_SECRET trong .env khớp với backend

#### Google OAuth error
Nếu Google trả về error:
- `redirect_uri_mismatch`: Kiểm tra GOOGLE_CALLBACK_URL trong .env khớp với Google Console
- `invalid_client`: Kiểm tra GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
- `access_denied`: User từ chối quyền truy cập

### Notes

- Test này tạo user thật trong database
- Mỗi lần chạy với cùng Google account sẽ reuse user đã tồn tại
- Token có thời hạn theo JWT_EXPIRES_IN (mặc định 7 ngày)
- Script tự động đóng callback server sau khi test xong
- Browser tab có thể tự động đóng sau 3 giây (nếu browser cho phép)

### Security

- Script chỉ chạy local (localhost)
- Token chỉ hiển thị 30 ký tự đầu trong summary
- Không log sensitive data ra file
- Callback server chỉ accept requests từ localhost
