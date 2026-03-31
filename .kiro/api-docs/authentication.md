# Authentication API

> API endpoints for Authentication module

**Base URL:** `http://localhost:3000/api/v1`

---

### POST /api/v1/auth/register

**Đăng ký tài khoản mới**

Tạo tài khoản người dùng mới với email, password và thông tin cá nhân. Email xác thực sẽ được gửi tự động.

**Request Body:**

Type: [`RegisterDto`](#registerdto)

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "nativeLanguage": "English",
  "currentLevel": "A1"
}
```

**Responses:**

✅ **201** - Đăng ký thành công

⚠️ **400** - Dữ liệu không hợp lệ

⚠️ **409** - Email đã tồn tại


---

### POST /api/v1/auth/login

**Đăng nhập**

Đăng nhập bằng email và password để nhận JWT token

**Request Body:**

Type: [`LoginDto`](#logindto)

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Responses:**

✅ **200** - Đăng nhập thành công

⚠️ **401** - Email hoặc password không đúng


---

### POST /api/v1/auth/verify-email

**Xác thực email**

Xác thực email bằng token nhận được từ email

**Request Body:**

Type: [`VerifyEmailDto`](#verifyemaildto)

```json
{
  "token": "abc123xyz456"
}
```

**Responses:**

✅ **200** - Xác thực thành công

⚠️ **400** - Token không hợp lệ hoặc đã hết hạn


---

### POST /api/v1/auth/forgot-password

**Quên mật khẩu**

Gửi email chứa link đặt lại mật khẩu

**Request Body:**

Type: [`ForgotPasswordDto`](#forgotpassworddto)

```json
{
  "email": "user@example.com"
}
```

**Responses:**

✅ **200** - Email đã được gửi


---

### POST /api/v1/auth/reset-password

**Đặt lại mật khẩu**

Đặt lại mật khẩu mới bằng token từ email

**Request Body:**

Type: [`ResetPasswordDto`](#resetpassworddto)

```json
{
  "token": "abc123xyz456",
  "newPassword": "NewPassword123!"
}
```

**Responses:**

✅ **200** - Đặt lại mật khẩu thành công

⚠️ **400** - Token không hợp lệ hoặc đã hết hạn


---

### POST /api/v1/auth/resend-verification

**Gửi lại email xác thực**

Gửi lại email xác thực cho user chưa verify

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Responses:**

✅ **200** - Email đã được gửi lại

⚠️ **400** - Email đã được xác thực

⚠️ **404** - User không tồn tại


---

### GET /api/v1/auth/google

**Đăng nhập bằng Google**

Redirect đến trang đăng nhập Google OAuth

**Responses:**

↪️ **302** - Redirect đến Google


---

### GET /api/v1/auth/google/callback

**Google OAuth callback**

Xử lý callback từ Google sau khi đăng nhập thành công

**Responses:**

✅ **200** - Đăng nhập thành công


---

## 📦 Related Schemas

### RegisterDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `email` | string | ✅ | - |
| `password` | string | ✅ | - |
| `fullName` | string | ✅ | - |
| `nativeLanguage` | string | ❌ | - |
| `currentLevel` | string (A1, A2, B1, B2, C1, C2) | ❌ | - |

**Example:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "nativeLanguage": "English",
  "currentLevel": "A1"
}
```


### LoginDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `email` | string | ✅ | - |
| `password` | string | ✅ | - |

**Example:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```


### VerifyEmailDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `token` | string | ✅ | Token từ email xác thực |

**Example:**

```json
{
  "token": "abc123xyz456"
}
```


### ForgotPasswordDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `email` | string | ✅ | Email của tài khoản cần đặt lại mật khẩu |

**Example:**

```json
{
  "email": "user@example.com"
}
```


### ResetPasswordDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `token` | string | ✅ | Token từ email reset password |
| `newPassword` | string | ✅ | Mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số) |

**Example:**

```json
{
  "token": "abc123xyz456",
  "newPassword": "NewPassword123!"
}
```


