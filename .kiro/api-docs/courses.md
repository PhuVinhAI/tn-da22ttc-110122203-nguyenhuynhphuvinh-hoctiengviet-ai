# Courses API

> API endpoints for Courses module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/courses

**Lấy danh sách tất cả khóa học**

Trả về danh sách tất cả khóa học có sẵn trong hệ thống

**Responses:**

✅ **200** - Danh sách khóa học


---

### POST /api/v1/courses

**Tạo khóa học mới (Admin only)**

Tạo khóa học mới - yêu cầu permission COURSE_CREATE

🔒 **Authentication Required:** Bearer Token

**Request Body:**

```json
{
  "title": "Tiếng Việt Cơ Bản",
  "description": "Khóa học tiếng Việt cho người mới bắt đầu",
  "level": "A1",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Responses:**

✅ **201** - Tạo khóa học thành công

⚠️ **401** - Chưa đăng nhập

⚠️ **403** - Không có quyền COURSE_CREATE


---

### GET /api/v1/courses/{id}

**Lấy chi tiết khóa học**

Lấy thông tin chi tiết của một khóa học bao gồm units và lessons

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Responses:**

✅ **200** - Chi tiết khóa học

⚠️ **404** - Không tìm thấy khóa học


---

### PATCH /api/v1/courses/{id}

**Cập nhật khóa học (Admin only)**

Cập nhật thông tin khóa học - yêu cầu permission COURSE_UPDATE

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Request Body:**

```json
{
  "title": "Tiếng Việt Nâng Cao",
  "description": "Mô tả mới"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **403** - Không có quyền COURSE_UPDATE

⚠️ **404** - Không tìm thấy khóa học


---

### DELETE /api/v1/courses/{id}

**Xóa khóa học (Admin only)**

Xóa khóa học khỏi hệ thống - yêu cầu permission COURSE_DELETE

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **403** - Không có quyền COURSE_DELETE

⚠️ **404** - Không tìm thấy khóa học


---

