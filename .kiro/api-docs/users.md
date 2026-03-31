# Users API

> API endpoints for Users module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/users/me

**Lấy thông tin user hiện tại**

Lấy thông tin profile của user đang đăng nhập

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Thông tin user

⚠️ **401** - Chưa đăng nhập


---

### PATCH /api/v1/users/me

**Cập nhật thông tin user**

Cập nhật thông tin profile của user đang đăng nhập

🔒 **Authentication Required:** Bearer Token

**Request Body:**

```json
{
  "fullName": "John Smith",
  "nativeLanguage": "English",
  "currentLevel": "A2"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **401** - Chưa đăng nhập


---

