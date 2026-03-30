# LinVNix API

API cho ứng dụng học tiếng Việt

**Version:** 1.0

**Base URL:** `http://localhost:3000/api/v1`

---

## 📑 Table of Contents

- [Cache](#cache)
- [Authentication](#authentication)
- [Users](#users)
- [Courses](#courses)
- [Units](#units)
- [Lessons](#lessons)
- [Contents](#contents)
- [Vocabularies](#vocabularies)
- [Grammar](#grammar)
- [Exercises](#exercises)
- [Progress](#progress)

---

## Cache

### GET /api/v1/cache/stats

**Lấy thống kê cache**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### DELETE /api/v1/cache/clear

**Xóa toàn bộ cache**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

## Authentication

### POST /api/v1/auth/register

**Đăng ký tài khoản mới**

**Request Body:**

Schema: [`RegisterDto`](#registerdto)

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

- **201**: Success


---

### POST /api/v1/auth/login

**Đăng nhập**

**Request Body:**

Schema: [`LoginDto`](#logindto)

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Responses:**

- **201**: Success


---

## Users

### GET /api/v1/users/me

**Lấy thông tin user hiện tại**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### PATCH /api/v1/users/me

**Cập nhật thông tin user**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

## Courses

### GET /api/v1/courses

**Lấy danh sách tất cả khóa học**

**Responses:**

- **200**: Success


---

### POST /api/v1/courses

**Tạo khóa học mới (Admin)**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **201**: Success


---

### GET /api/v1/courses/{id}

**Lấy chi tiết khóa học**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/courses/{id}

**Cập nhật khóa học (Admin)**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/courses/{id}

**Xóa khóa học (Admin)**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

## Units

### GET /api/v1/units/course/{courseId}

**Lấy danh sách units theo course**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `courseId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### GET /api/v1/units/{id}

**Lấy chi tiết unit**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/units/{id}

**Cập nhật unit**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/units/{id}

**Xóa unit**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/units

**Tạo unit mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateUnitDto`](#createunitdto)

```json
{
  "title": "Unit 1: Chào hỏi và giới thiệu",
  "description": "Học cách chào hỏi và giới thiệu bản thân",
  "orderIndex": 1,
  "courseId": "uuid-of-course"
}
```

**Responses:**

- **201**: Success


---

## Lessons

### GET /api/v1/lessons/unit/{unitId}

**Lấy danh sách lessons theo unit**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `unitId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### GET /api/v1/lessons/{id}

**Lấy chi tiết lesson với nội dung đầy đủ**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/lessons/{id}

**Cập nhật lesson**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/lessons/{id}

**Xóa lesson**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/lessons

**Tạo lesson mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateLessonDto`](#createlessondto)

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

- **201**: Success


---

## Contents

### GET /api/v1/contents/lesson/{lessonId}

**Lấy nội dung theo lesson**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### GET /api/v1/contents/{id}

**Lấy chi tiết nội dung**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/contents/{id}

**Cập nhật nội dung**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/contents/{id}

**Xóa nội dung**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/contents

**Tạo nội dung mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateContentDto`](#createcontentdto)

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

- **201**: Success


---

## Vocabularies

### GET /api/v1/vocabularies/lesson/{lessonId}

**Lấy từ vựng theo lesson**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/vocabularies

**Tạo từ vựng mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateVocabularyDto`](#createvocabularydto)

```json
{
  "word": "xin chào",
  "translation": "hello",
  "phonetic": "sin chao",
  "partOfSpeech": "phrase",
  "exampleSentence": "Xin chào, bạn khỏe không?",
  "exampleTranslation": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

- **201**: Success


---

### PATCH /api/v1/vocabularies/{id}

**Cập nhật từ vựng**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/vocabularies/{id}

**Xóa từ vựng**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/vocabularies/{vocabularyId}/learn

**Thêm từ vựng vào danh sách học**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `vocabularyId` | path | string | ✅ | - |

**Responses:**

- **201**: Success


---

### POST /api/v1/vocabularies/{vocabularyId}/review

**Ôn tập từ vựng**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `vocabularyId` | path | string | ✅ | - |

**Responses:**

- **201**: Success


---

### GET /api/v1/vocabularies/my-vocabularies

**Lấy danh sách từ vựng đã học**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### GET /api/v1/vocabularies/due-review

**Lấy từ vựng cần ôn tập**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### POST /api/v1/vocabularies/upload-audio

**Upload audio cho từ vựng**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **201**: Success


---

### POST /api/v1/vocabularies/upload-image

**Upload hình ảnh cho từ vựng**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **201**: Success


---

## Grammar

### GET /api/v1/grammar/lesson/{lessonId}

**Lấy ngữ pháp theo lesson**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### GET /api/v1/grammar/{id}

**Lấy chi tiết ngữ pháp**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/grammar/{id}

**Cập nhật ngữ pháp**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/grammar/{id}

**Xóa ngữ pháp**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/grammar

**Tạo ngữ pháp mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateGrammarDto`](#creategrammardto)

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

- **201**: Success


---

## Exercises

### GET /api/v1/exercises/my-results

**Lấy kết quả bài tập của user**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### GET /api/v1/exercises/my-stats

**Lấy thống kê bài tập**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### GET /api/v1/exercises/lesson/{lessonId}

**Lấy bài tập theo lesson**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### GET /api/v1/exercises/{id}

**Lấy chi tiết bài tập**

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### PATCH /api/v1/exercises/{id}

**Cập nhật bài tập**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### DELETE /api/v1/exercises/{id}

**Xóa bài tập**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/exercises

**Tạo bài tập mới**

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Schema: [`CreateExerciseDto`](#createexercisedto)

```json
{
  "exerciseType": "multiple_choice",
  "question": "_____ là sinh viên.",
  "questionAudioUrl": "https://example.com/audio.mp3",
  "options": [
    "Tôi",
    "Bạn",
    "Anh ấy",
    "Cả 3 đều đúng"
  ],
  "correctAnswer": "Cả 3 đều đúng",
  "explanation": "Cả 3 đại từ đều có thể đứng trước \"là sinh viên\"",
  "orderIndex": 1,
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

- **201**: Success


---

### POST /api/v1/exercises/{id}/submit

**Nộp bài tập**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | - |

**Responses:**

- **201**: Success


---

## Progress

### GET /api/v1/progress

**Lấy toàn bộ tiến độ học của user**

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Success


---

### GET /api/v1/progress/lesson/{lessonId}

**Lấy tiến độ của 1 lesson**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

### POST /api/v1/progress/lesson/{lessonId}/start

**Bắt đầu học lesson**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **201**: Success


---

### POST /api/v1/progress/lesson/{lessonId}/complete

**Hoàn thành lesson**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **201**: Success


---

### PATCH /api/v1/progress/lesson/{lessonId}/time

**Cập nhật thời gian học**

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | - |

**Responses:**

- **200**: Success


---

## 📦 Schemas

### RegisterDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `email` | string | ✅ | user@example.com |
| `password` | string | ✅ | password123 |
| `fullName` | string | ✅ | John Doe |
| `nativeLanguage` | string | ❌ | English |
| `currentLevel` | string | ❌ | A1 |

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
| `email` | string | ✅ | user@example.com |
| `password` | string | ✅ | password123 |

**Example:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```


### CreateUnitDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | Unit 1: Chào hỏi và giới thiệu |
| `description` | string | ✅ | Học cách chào hỏi và giới thiệu bản thân |
| `orderIndex` | number | ✅ | 1 |
| `courseId` | string | ✅ | uuid-of-course |

**Example:**

```json
{
  "title": "Unit 1: Chào hỏi và giới thiệu",
  "description": "Học cách chào hỏi và giới thiệu bản thân",
  "orderIndex": 1,
  "courseId": "uuid-of-course"
}
```


### CreateLessonDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | Bài 1: Từ vựng chào hỏi |
| `description` | string | ✅ | Học các từ vựng cơ bản về chào hỏi |
| `lessonType` | string | ✅ | vocabulary |
| `orderIndex` | number | ✅ | 1 |
| `estimatedDuration` | number | ❌ | 30 |
| `unitId` | string | ✅ | uuid-of-unit |

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


### CreateContentDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `contentType` | string | ✅ | text |
| `vietnameseText` | string | ✅ | Xin chào! Tôi là Minh. |
| `translation` | string | ❌ | Hello! I am Minh. |
| `phonetic` | string | ❌ | sin chao! toy la min |
| `audioUrl` | string | ❌ | https://example.com/audio.mp3 |
| `imageUrl` | string | ❌ | https://example.com/image.jpg |
| `videoUrl` | string | ❌ | https://example.com/video.mp4 |
| `orderIndex` | number | ✅ | 1 |
| `notes` | string | ❌ | Ghi chú thêm |
| `lessonId` | string | ✅ | uuid-of-lesson |

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


### CreateVocabularyDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `word` | string | ✅ | xin chào |
| `translation` | string | ✅ | hello |
| `phonetic` | string | ❌ | sin chao |
| `partOfSpeech` | string | ✅ | phrase |
| `exampleSentence` | string | ❌ | Xin chào, bạn khỏe không? |
| `exampleTranslation` | string | ❌ | Hello, how are you? |
| `audioUrl` | string | ❌ | https://example.com/audio.mp3 |
| `imageUrl` | string | ❌ | https://example.com/image.jpg |
| `difficultyLevel` | number | ❌ | 1 |
| `lessonId` | string | ✅ | uuid-of-lesson |

**Example:**

```json
{
  "word": "xin chào",
  "translation": "hello",
  "phonetic": "sin chao",
  "partOfSpeech": "phrase",
  "exampleSentence": "Xin chào, bạn khỏe không?",
  "exampleTranslation": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```


### CreateGrammarDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | Câu khẳng định với "là" |
| `explanation` | string | ✅ | "Là" dùng để nối chủ ngữ với danh từ/tính từ |
| `structure` | string | ❌ | Chủ ngữ + là + Danh từ |
| `examples` | array | ✅ | [object Object],[object Object] |
| `notes` | string | ❌ | Lưu ý đặc biệt |
| `difficultyLevel` | number | ❌ | 1 |
| `lessonId` | string | ✅ | uuid-of-lesson |

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


### CreateExerciseDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `exerciseType` | string | ✅ | multiple_choice |
| `question` | string | ✅ | _____ là sinh viên. |
| `questionAudioUrl` | string | ❌ | https://example.com/audio.mp3 |
| `options` | object | ❌ | Tôi,Bạn,Anh ấy,Cả 3 đều đúng |
| `correctAnswer` | object | ✅ | Cả 3 đều đúng |
| `explanation` | string | ❌ | Cả 3 đại từ đều có thể đứng trước "là sinh viên" |
| `orderIndex` | number | ✅ | 1 |
| `difficultyLevel` | number | ❌ | 1 |
| `lessonId` | string | ✅ | uuid-of-lesson |

**Example:**

```json
{
  "exerciseType": "multiple_choice",
  "question": "_____ là sinh viên.",
  "questionAudioUrl": "https://example.com/audio.mp3",
  "options": [
    "Tôi",
    "Bạn",
    "Anh ấy",
    "Cả 3 đều đúng"
  ],
  "correctAnswer": "Cả 3 đều đúng",
  "explanation": "Cả 3 đại từ đều có thể đứng trước \"là sinh viên\"",
  "orderIndex": 1,
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```


