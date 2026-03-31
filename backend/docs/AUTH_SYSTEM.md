# Hệ thống Authentication & Authorization

## Tổng quan

Hệ thống auth hoàn chỉnh với:
- ✅ RBAC (Role-Based Access Control) chi tiết
- ✅ Email verification
- ✅ Forgot/Reset password
- ✅ Gmail integration
- ✅ JWT authentication
- ✅ Permission-based authorization

## API Endpoints

### Authentication

#### 1. Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Nguyễn Văn A",
  "nativeLanguage": "Vietnamese"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "emailVerified": false,
    "roles": [{ "name": "USER" }]
  },
  "access_token": "jwt-token",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
}
```

#### 2. Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "roles": [...]
  },
  "access_token": "jwt-token"
}
```

#### 3. Xác thực email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}

Response 200:
{
  "message": "Email đã được xác thực thành công!"
}
```

#### 4. Quên mật khẩu
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu."
}
```

#### 5. Đặt lại mật khẩu
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!"
}

Response 200:
{
  "message": "Mật khẩu đã được đặt lại thành công!"
}
```

#### 6. Gửi lại email xác thực
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "Email xác thực đã được gửi lại!"
}
```

#### 7. Đăng nhập bằng Google OAuth
```http
GET /api/auth/google

Response 302:
Redirect đến trang đăng nhập Google
```

#### 8. Google OAuth Callback
```http
GET /api/auth/google/callback

Response 302:
Redirect về frontend với token: 
{frontendUrl}/auth/callback?token={jwt-token}
```

## Google OAuth Flow

### Setup Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google+ API
4. Tạo OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID và Client Secret vào `.env`

### Flow

1. Frontend redirect user đến `GET /api/auth/google`
2. Backend redirect đến Google login page
3. User đăng nhập và cho phép quyền truy cập
4. Google redirect về `GET /api/auth/google/callback`
5. Backend xử lý:
   - Tìm user theo `googleId` hoặc `email`
   - Nếu chưa có: tạo user mới với `provider=google`, `emailVerified=true`
   - Nếu đã có: cập nhật `googleId` nếu chưa có
   - Generate JWT token
6. Backend redirect về frontend với token: `{frontendUrl}/auth/callback?token={jwt}`
7. Frontend lưu token và redirect đến dashboard

## Roles & Permissions

### Roles
- **USER**: Role mặc định, quyền học tập cơ bản
- **ADMIN**: Toàn quyền quản trị hệ thống

### Permissions (45 permissions)
Xem chi tiết trong [RBAC.md](./RBAC.md)

## Email Templates

### 1. Verification Email
- Subject: "Xác thực email của bạn"
- Chứa link verification (hết hạn sau 24h)
- Template: `verification.hbs`

### 2. Welcome Email
- Subject: "Chào mừng bạn đến với ứng dụng học tiếng Đức!"
- Gửi sau khi verify email thành công
- Template: `welcome.hbs`

### 3. Password Reset Email
- Subject: "Đặt lại mật khẩu của bạn"
- Chứa link reset (hết hạn sau 1h)
- Template: `password-reset.hbs`

### 4. Password Changed Email
- Subject: "Mật khẩu của bạn đã được thay đổi"
- Thông báo sau khi đổi password thành công
- Template: `password-changed.hbs`

## Database Schema

### New Tables

#### roles
- id (UUID, PK)
- name (ENUM: USER, ADMIN)
- description (TEXT)
- timestamps

#### permissions
- id (UUID, PK)
- name (ENUM: 45 permissions)
- description (TEXT)
- category (VARCHAR)
- timestamps

#### user_roles (Many-to-Many)
- user_id (UUID, FK)
- role_id (UUID, FK)

#### role_permissions (Many-to-Many)
- role_id (UUID, FK)
- permission_id (UUID, FK)

#### email_verification_tokens
- id (UUID, PK)
- token (VARCHAR)
- user_id (UUID, FK)
- expires_at (TIMESTAMP)
- verified_at (TIMESTAMP, nullable)
- timestamps

#### password_reset_tokens
- id (UUID, PK)
- token (VARCHAR)
- user_id (UUID, FK)
- expires_at (TIMESTAMP)
- used_at (TIMESTAMP, nullable)
- timestamps

### Updated Tables

#### users
- Added: `email_verified` (BOOLEAN, default: false)
- Added: `email_verified_at` (TIMESTAMP, nullable)
- Added: `roles` (ManyToMany relation)
- Added: `google_id` (VARCHAR, nullable, unique) - Google OAuth ID
- Added: `provider` (VARCHAR, default: 'local') - Auth provider: 'local' | 'google'
- Modified: `password` (VARCHAR, nullable) - Nullable cho OAuth users

## Configuration

### Environment Variables

```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_NAME=Language Learning App
MAIL_FROM_ADDRESS=your-email@gmail.com

# Frontend
FRONTEND_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Gmail Setup
Xem hướng dẫn chi tiết trong [GMAIL_SETUP.md](./GMAIL_SETUP.md)

## Usage Examples

### Protect Endpoint với Permission

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/enums';

@Controller('courses')
@UseGuards(PermissionsGuard)
export class CoursesController {
  
  @Post()
  @RequirePermissions(Permission.COURSE_CREATE)
  async create() {
    // Chỉ ADMIN mới có COURSE_CREATE permission
  }

  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  async findAll() {
    // USER và ADMIN đều có COURSE_READ permission
  }
}
```

### Public Endpoint (không cần auth)

```typescript
@Public()
@Get('public-data')
async getPublicData() {
  // Không cần authentication
}
```

### Get Current User

```typescript
import { CurrentUser } from '../../common/decorators';

@Get('profile')
async getProfile(@CurrentUser() user: any) {
  return user; // User từ JWT token
}
```

## Security Features

1. ✅ Password hashing với bcrypt
2. ✅ JWT token với expiration
3. ✅ Email verification required
4. ✅ Password reset với token expiration (1h)
5. ✅ Email verification token expiration (24h)
6. ✅ One-time use tokens
7. ✅ Permission-based access control
8. ✅ Rate limiting (ThrottlerGuard)
9. ✅ Secure password requirements (min 8 chars, uppercase, lowercase, number)

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Email không gửi được
1. Check Gmail App Password đã đúng chưa
2. Check 2-Step Verification đã bật chưa
3. Check logs trong `backend/logs/error.log`
4. Xem [GMAIL_SETUP.md](./GMAIL_SETUP.md)

### Permission denied
1. Check user có role phù hợp không
2. Check role có permission cần thiết không
3. Check `@UseGuards(PermissionsGuard)` đã được thêm chưa
4. Check `@RequirePermissions()` decorator

### Token expired
1. Email verification: 24h expiration
2. Password reset: 1h expiration
3. JWT: 7d expiration (configurable)

## Next Steps

1. ✅ Implement email queue (Bull/BullMQ) cho production
2. ✅ Add refresh token mechanism
3. ✅ Add 2FA (Two-Factor Authentication)
4. ✅ Add OAuth (Google, Facebook login)
5. ✅ Add audit logs cho admin actions
6. ✅ Add rate limiting per user
7. ✅ Add IP whitelist/blacklist
