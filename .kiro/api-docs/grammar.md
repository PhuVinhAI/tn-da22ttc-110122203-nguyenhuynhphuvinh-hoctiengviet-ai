# Grammar API

> API endpoints for Grammar module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/grammar/lesson/{lessonId}

**Lấy ngữ pháp theo lesson**

Lấy tất cả quy tắc ngữ pháp thuộc một lesson

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Danh sách ngữ pháp


---

### GET /api/v1/grammar/{id}

**Lấy chi tiết ngữ pháp**

Lấy thông tin chi tiết của một quy tắc ngữ pháp

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của ngữ pháp |

**Responses:**

✅ **200** - Chi tiết ngữ pháp

⚠️ **404** - Không tìm thấy ngữ pháp


---

### PATCH /api/v1/grammar/{id}

**Cập nhật ngữ pháp**

Cập nhật thông tin ngữ pháp - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của ngữ pháp |

**Request Body:**

Type: [`CreateGrammarDto`](#creategrammardto)

```json
{
  "title": "Câu khẳng định với \"là\"",
  "explanation": "\"Là\" dùng để nối chủ ngữ với danh từ/tính từ",
  "structure": "Chủ ngữ + là + Danh từ",
  "examples": [
    {
      "vi": "Tôi là sinh viên",
      "en": "I am a student"
    },
    {
      "vi": "Anh ấy là giáo viên",
      "en": "He is a teacher"
    }
  ],
  "notes": "Lưu ý đặc biệt",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy ngữ pháp


---

### DELETE /api/v1/grammar/{id}

**Xóa ngữ pháp**

Xóa quy tắc ngữ pháp khỏi lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của ngữ pháp |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy ngữ pháp


---

### POST /api/v1/grammar

**Tạo ngữ pháp mới**

Tạo quy tắc ngữ pháp mới trong lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateGrammarDto`](#creategrammardto)

```json
{
  "title": "Câu khẳng định với \"là\"",
  "explanation": "\"Là\" dùng để nối chủ ngữ với danh từ/tính từ",
  "structure": "Chủ ngữ + là + Danh từ",
  "examples": [
    {
      "vi": "Tôi là sinh viên",
      "en": "I am a student"
    },
    {
      "vi": "Anh ấy là giáo viên",
      "en": "He is a teacher"
    }
  ],
  "notes": "Lưu ý đặc biệt",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **201** - Tạo ngữ pháp thành công

⚠️ **401** - Chưa đăng nhập


---

## 📦 Related Schemas

### CreateGrammarDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | - |
| `explanation` | string | ✅ | - |
| `structure` | string | ❌ | - |
| `examples` | array<string> | ✅ | - |
| `notes` | string | ❌ | - |
| `difficultyLevel` | number | ❌ | - |
| `lessonId` | string | ✅ | - |

**Example:**

```json
{
  "title": "Câu khẳng định với \"là\"",
  "explanation": "\"Là\" dùng để nối chủ ngữ với danh từ/tính từ",
  "structure": "Chủ ngữ + là + Danh từ",
  "examples": [
    {
      "vi": "Tôi là sinh viên",
      "en": "I am a student"
    },
    {
      "vi": "Anh ấy là giáo viên",
      "en": "He is a teacher"
    }
  ],
  "notes": "Lưu ý đặc biệt",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```


