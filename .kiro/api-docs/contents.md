# Contents API

> API endpoints for Contents module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/contents/lesson/{lessonId}

**Lấy nội dung theo lesson**

Lấy tất cả nội dung học thuộc một lesson (text, audio, video, image)

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Danh sách nội dung


---

### GET /api/v1/contents/{id}

**Lấy chi tiết nội dung**

Lấy thông tin chi tiết của một nội dung học

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của nội dung |

**Responses:**

✅ **200** - Chi tiết nội dung

⚠️ **404** - Không tìm thấy nội dung


---

### PATCH /api/v1/contents/{id}

**Cập nhật nội dung**

Cập nhật thông tin nội dung - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của nội dung |

**Request Body:**

Type: [`CreateContentDto`](#createcontentdto)

```json
{
  "contentType": "text",
  "vietnameseText": "Xin chào! Tôi là Minh.",
  "translation": "Hello! I am Minh.",
  "phonetic": "sin chao! toy la min",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "orderIndex": 1,
  "notes": "Ghi chú thêm",
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy nội dung


---

### DELETE /api/v1/contents/{id}

**Xóa nội dung**

Xóa nội dung khỏi lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của nội dung |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy nội dung


---

### POST /api/v1/contents

**Tạo nội dung mới**

Tạo nội dung học mới trong lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateContentDto`](#createcontentdto)

```json
{
  "contentType": "text",
  "vietnameseText": "Xin chào! Tôi là Minh.",
  "translation": "Hello! I am Minh.",
  "phonetic": "sin chao! toy la min",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "orderIndex": 1,
  "notes": "Ghi chú thêm",
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **201** - Tạo nội dung thành công

⚠️ **401** - Chưa đăng nhập


---

## 📦 Related Schemas

### CreateContentDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `contentType` | string (text, audio, image, video) | ✅ | - |
| `vietnameseText` | string | ✅ | - |
| `translation` | string | ❌ | - |
| `phonetic` | string | ❌ | - |
| `audioUrl` | string | ❌ | - |
| `imageUrl` | string | ❌ | - |
| `videoUrl` | string | ❌ | - |
| `orderIndex` | number | ✅ | - |
| `notes` | string | ❌ | - |
| `lessonId` | string | ✅ | - |

**Example:**

```json
{
  "contentType": "text",
  "vietnameseText": "Xin chào! Tôi là Minh.",
  "translation": "Hello! I am Minh.",
  "phonetic": "sin chao! toy la min",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "orderIndex": 1,
  "notes": "Ghi chú thêm",
  "lessonId": "uuid-of-lesson"
}
```


