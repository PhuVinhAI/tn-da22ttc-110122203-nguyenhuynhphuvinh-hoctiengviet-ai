# Units API

> API endpoints for Units module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/units/course/{courseId}

**Lấy danh sách units theo course**

Lấy tất cả units thuộc một khóa học

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `courseId` | path | string | ✅ | ID của khóa học |

**Responses:**

✅ **200** - Danh sách units


---

### GET /api/v1/units/{id}

**Lấy chi tiết unit**

Lấy thông tin chi tiết của unit bao gồm danh sách lessons

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của unit |

**Responses:**

✅ **200** - Chi tiết unit

⚠️ **404** - Không tìm thấy unit


---

### PATCH /api/v1/units/{id}

**Cập nhật unit**

Cập nhật thông tin unit - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của unit |

**Request Body:**

Type: [`CreateUnitDto`](#createunitdto)

```json
{
  "title": "Unit 1: Chào hỏi và giới thiệu",
  "description": "Học cách chào hỏi và giới thiệu bản thân",
  "orderIndex": 1,
  "courseId": "uuid-of-course"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy unit


---

### DELETE /api/v1/units/{id}

**Xóa unit**

Xóa unit khỏi khóa học - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của unit |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy unit


---

### POST /api/v1/units

**Tạo unit mới**

Tạo unit mới trong khóa học - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateUnitDto`](#createunitdto)

```json
{
  "title": "Unit 1: Chào hỏi và giới thiệu",
  "description": "Học cách chào hỏi và giới thiệu bản thân",
  "orderIndex": 1,
  "courseId": "uuid-of-course"
}
```

**Responses:**

✅ **201** - Tạo unit thành công

⚠️ **401** - Chưa đăng nhập


---

## 📦 Related Schemas

### CreateUnitDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | - |
| `description` | string | ✅ | - |
| `orderIndex` | number | ✅ | - |
| `courseId` | string | ✅ | - |

**Example:**

```json
{
  "title": "Unit 1: Chào hỏi và giới thiệu",
  "description": "Học cách chào hỏi và giới thiệu bản thân",
  "orderIndex": 1,
  "courseId": "uuid-of-course"
}
```


