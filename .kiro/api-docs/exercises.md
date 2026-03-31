# Exercises API

> API endpoints for Exercises module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/exercises/my-results

**Lấy kết quả bài tập của user**

Lấy lịch sử làm bài tập của user hiện tại

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Danh sách kết quả bài tập


---

### GET /api/v1/exercises/my-stats

**Lấy thống kê bài tập**

Lấy thống kê tổng quan về bài tập của user

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Thống kê bài tập


---

### GET /api/v1/exercises/lesson/{lessonId}

**Lấy bài tập theo lesson**

Lấy tất cả bài tập thuộc một lesson

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Danh sách bài tập


---

### GET /api/v1/exercises/{id}

**Lấy chi tiết bài tập**

Lấy thông tin chi tiết của một bài tập

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của bài tập |

**Responses:**

✅ **200** - Chi tiết bài tập

⚠️ **404** - Không tìm thấy bài tập


---

### PATCH /api/v1/exercises/{id}

**Cập nhật bài tập**

Cập nhật thông tin bài tập - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của bài tập |

**Request Body:**

Type: [`CreateExerciseDto`](#createexercisedto)

```json
{
  "exerciseType": "multiple_choice",
  "question": "_____ là sinh viên.",
  "questionAudioUrl": "https://example.com/audio.mp3",
  "options": {
    "type": "multiple_choice",
    "choices": [
      "Tôi",
      "Bạn",
      "Anh ấy",
      "Cả 3 đều đúng"
    ]
  },
  "correctAnswer": {
    "selectedChoice": "Cả 3 đều đúng"
  },
  "explanation": "Cả 3 đại từ đều có thể đứng trước \"là sinh viên\"",
  "orderIndex": 1,
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy bài tập


---

### DELETE /api/v1/exercises/{id}

**Xóa bài tập**

Xóa bài tập khỏi lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của bài tập |

**Responses:**

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy bài tập


---

### POST /api/v1/exercises

**Tạo bài tập mới**

Tạo bài tập mới trong lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateExerciseDto`](#createexercisedto)

```json
{
  "exerciseType": "multiple_choice",
  "question": "_____ là sinh viên.",
  "questionAudioUrl": "https://example.com/audio.mp3",
  "options": {
    "type": "multiple_choice",
    "choices": [
      "Tôi",
      "Bạn",
      "Anh ấy",
      "Cả 3 đều đúng"
    ]
  },
  "correctAnswer": {
    "selectedChoice": "Cả 3 đều đúng"
  },
  "explanation": "Cả 3 đại từ đều có thể đứng trước \"là sinh viên\"",
  "orderIndex": 1,
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **201** - Tạo bài tập thành công

⚠️ **401** - Chưa đăng nhập


---

### POST /api/v1/exercises/{id}/submit

**Nộp bài tập**

Nộp câu trả lời cho bài tập và nhận kết quả chấm điểm

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của bài tập |

**Request Body:**

```json
{
  "userAnswer": "Cả 3 đều đúng",
  "timeSpent": 30
}
```

**Responses:**

✅ **200** - Kết quả chấm bài

⚠️ **404** - Không tìm thấy bài tập


---

## 📦 Related Schemas

### CreateExerciseDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `exerciseType` | string (multiple_choice, fill_blank, matching, ordering, translation, listening) | ✅ | - |
| `question` | string | ✅ | - |
| `questionAudioUrl` | string | ❌ | - |
| `options` | object | ❌ | - |
| `correctAnswer` | object | ✅ | - |
| `explanation` | string | ❌ | - |
| `orderIndex` | number | ✅ | - |
| `difficultyLevel` | number | ❌ | - |
| `lessonId` | string | ✅ | - |

**Example:**

```json
{
  "exerciseType": "multiple_choice",
  "question": "_____ là sinh viên.",
  "questionAudioUrl": "https://example.com/audio.mp3",
  "options": {
    "type": "multiple_choice",
    "choices": [
      "Tôi",
      "Bạn",
      "Anh ấy",
      "Cả 3 đều đúng"
    ]
  },
  "correctAnswer": {
    "selectedChoice": "Cả 3 đều đúng"
  },
  "explanation": "Cả 3 đại từ đều có thể đứng trước \"là sinh viên\"",
  "orderIndex": 1,
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```


