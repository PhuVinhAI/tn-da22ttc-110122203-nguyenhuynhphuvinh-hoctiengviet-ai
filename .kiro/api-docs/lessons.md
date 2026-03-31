# Lessons API

> API endpoints for Lessons module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/lessons/unit/{unitId}

**Lấy danh sách lessons theo unit**

Lấy tất cả lessons thuộc một unit

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `unitId` | path | string | ✅ | ID của unit |

**Responses:**

✅ **200** - Danh sách lessons


---

### GET /api/v1/lessons/{id}

**Lấy chi tiết lesson với nội dung đầy đủ**

Lấy thông tin chi tiết lesson bao gồm contents, vocabularies, grammar, exercises

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Chi tiết lesson

⚠️ **404** - Không tìm thấy lesson


---

### PATCH /api/v1/lessons/{id}

**Cập nhật lesson**

Cập nhật thông tin lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của lesson |

**Request Body:**

Type: [`CreateLessonDto`](#createlessondto)

```json
{
  "title": "Bài 1: Từ vựng chào hỏi",
  "description": "Học các từ vựng cơ bản về chào hỏi",
  "lessonType": "vocabulary",
  "orderIndex": 1,
  "estimatedDuration": 30,
  "unitId": "uuid-of-unit"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy lesson


---

### DELETE /api/v1/lessons/{id}

**Xóa lesson**

Xóa lesson khỏi unit - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy lesson


---

### POST /api/v1/lessons

**Tạo lesson mới**

Tạo lesson mới trong unit - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateLessonDto`](#createlessondto)

```json
{
  "title": "Bài 1: Từ vựng chào hỏi",
  "description": "Học các từ vựng cơ bản về chào hỏi",
  "lessonType": "vocabulary",
  "orderIndex": 1,
  "estimatedDuration": 30,
  "unitId": "uuid-of-unit"
}
```

**Responses:**

✅ **201** - Tạo lesson thành công

⚠️ **401** - Chưa đăng nhập


---

## 📦 Related Schemas

### CreateLessonDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | - |
| `description` | string | ✅ | - |
| `lessonType` | string (vocabulary, grammar, reading, listening, speaking, writing) | ✅ | - |
| `orderIndex` | number | ✅ | - |
| `estimatedDuration` | number | ❌ | - |
| `unitId` | string | ✅ | - |

**Example:**

```json
{
  "title": "Bài 1: Từ vựng chào hỏi",
  "description": "Học các từ vựng cơ bản về chào hỏi",
  "lessonType": "vocabulary",
  "orderIndex": 1,
  "estimatedDuration": 30,
  "unitId": "uuid-of-unit"
}
```


