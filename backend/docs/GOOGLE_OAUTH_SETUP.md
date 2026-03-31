# Hướng dẫn Setup Google OAuth

## 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Nhập tên project (ví dụ: "Language Learning App")
4. Click "Create"

## 2. Enable Google+ API

1. Trong project vừa tạo, vào menu "APIs & Services" → "Library"
2. Tìm "Google+ API"
3. Click "Enable"

## 3. Tạo OAuth 2.0 Credentials

1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Nếu chưa có OAuth consent screen:
   - Click "Configure Consent Screen"
   - Chọn "External" (cho testing) hoặc "Internal" (cho organization)
   - Điền thông tin:
     - App name: "Language Learning App"
     - User support email: your-email@gmail.com
     - Developer contact: your-email@gmail.com
   - Click "Save and Continue"
   - Scopes: Không cần thêm gì, click "Save and Continue"
   - Test users (nếu External): Thêm email test users
   - Click "Save and Continue"

4. Quay lại "Credentials" → "Create Credentials" → "OAuth client ID"
5. Chọn "Application type": Web application
6. Nhập tên: "Language Learning Web Client"
7. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback/
   ```
   
   Cho production, thêm:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

8. Click "Create"
9. Copy "Client ID" và "Client Secret"

## 4. Cấu hình Backend

1. Mở file `backend/.env`
2. Thêm/cập nhật các biến:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL (để redirect sau khi login)
FRONTEND_URL=http://localhost:3001
```

## 5. Update Database Schema

Chạy migration để thêm các columns mới:

```bash
# Nếu dùng TypeORM CLI
npm run typeorm migration:run

# Hoặc chạy manual SQL:
ALTER TABLE users ADD COLUMN google_id VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN provider VARCHAR DEFAULT 'local';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

## 6. Test Google OAuth

### Backend Test

1. Start backend:
```bash
cd backend
bun run start:dev
```

2. Mở browser và truy cập:
```
http://localhost:3000/api/auth/google
```

3. Đăng nhập bằng Google account
4. Sau khi thành công, sẽ redirect về frontend với token

### Frontend Integration

Frontend cần implement:

1. Button "Đăng nhập bằng Google":
```html
<a href="http://localhost:3000/api/auth/google">
  <button>Đăng nhập bằng Google</button>
</a>
```

2. Callback page tại `/auth/callback`:
```typescript
// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      // Lưu token vào localStorage/cookie
      localStorage.setItem('access_token', token as string);
      
      // Redirect đến dashboard
      router.push('/dashboard');
    }
  }, [token, router]);

  return <div>Đang xử lý đăng nhập...</div>;
}
```

## 7. Security Best Practices

### Development
- Chỉ thêm test users vào OAuth consent screen
- Sử dụng localhost redirect URIs

### Production
- Chuyển OAuth consent screen sang "Published" status
- Chỉ sử dụng HTTPS redirect URIs
- Thêm domain verification
- Enable "Incremental authorization"
- Regularly rotate Client Secret
- Monitor OAuth usage trong Google Cloud Console

## 8. Troubleshooting

### Error: redirect_uri_mismatch
- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` khớp với Authorized redirect URIs
- Đảm bảo không có trailing slash mismatch
- Đảm bảo protocol (http/https) khớp

### Error: invalid_client
- Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` đúng
- Đảm bảo không có space hoặc newline trong credentials

### User không được tạo
- Check logs trong `backend/logs/error.log`
- Kiểm tra database connection
- Verify migration đã chạy thành công

### Token không được gửi về frontend
- Kiểm tra `FRONTEND_URL` trong `.env`
- Check browser console cho CORS errors
- Verify callback route trong frontend

## 9. Testing với Multiple Accounts

1. Trong Google Cloud Console → OAuth consent screen
2. Thêm test users (nếu app ở External mode chưa publish)
3. Mỗi test user có thể đăng nhập độc lập

## 10. Monitoring

### Google Cloud Console
- APIs & Services → Credentials → OAuth 2.0 Client IDs
- Click vào client ID để xem usage statistics

### Backend Logs
```bash
tail -f backend/logs/app.log | grep "OAuth"
```

## 11. Migration từ Local Auth sang Google OAuth

Nếu user đã có account với email, khi đăng nhập bằng Google:
- System sẽ tự động link Google account với existing account
- Cập nhật `google_id` và `provider`
- User có thể đăng nhập bằng cả 2 cách: email/password hoặc Google

## 12. Revoke Access

User có thể revoke access tại:
https://myaccount.google.com/permissions

Backend cần handle trường hợp này bằng cách:
- Vẫn giữ user account
- User có thể đăng nhập lại bằng Google hoặc reset password để dùng local auth
