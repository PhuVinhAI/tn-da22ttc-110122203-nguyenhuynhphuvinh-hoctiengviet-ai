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

Lấy thông tin thống kê về cache Redis (số keys, memory usage, hit rate...)

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Thống kê cache
- **401**: Chưa đăng nhập


---

### DELETE /api/v1/cache/clear

**Xóa toàn bộ cache**

Xóa tất cả cache trong Redis - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Xóa cache thành công
- **401**: Chưa đăng nhập


---

## Authentication

### POST /api/v1/auth/register

**Đăng ký tài khoản mới**

Tạo tài khoản người dùng mới với email, password và thông tin cá nhân

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

- **201**: Đăng ký thành công
- **400**: Dữ liệu không hợp lệ
- **409**: Email đã tồn tại


---

### POST /api/v1/auth/login

**Đăng nhập**

Đăng nhập bằng email và password để nhận JWT token

**Request Body:**

Schema: [`LoginDto`](#logindto)

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Responses:**

- **200**: Đăng nhập thành công
- **401**: Email hoặc password không đúng


---

## Users

### GET /api/v1/users/me

**Lấy thông tin user hiện tại**

Lấy thông tin profile của user đang đăng nhập

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Thông tin user
- **401**: Chưa đăng nhập


---

### PATCH /api/v1/users/me

**Cập nhật thông tin user**

Cập nhật thông tin profile của user đang đăng nhập

🔒 **Authentication Required:** Bearer Token

**Request Body:**

**Responses:**

- **200**: Cập nhật thành công
- **401**: Chưa đăng nhập


---

## Courses

### GET /api/v1/courses

**Lấy danh sách tất cả khóa học**

Trả về danh sách tất cả khóa học có sẵn trong hệ thống

**Responses:**

- **200**: Danh sách khóa học


---

### POST /api/v1/courses

**Tạo khóa học mới (Admin)**

Tạo khóa học mới - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

**Responses:**

- **201**: Tạo khóa học thành công
- **401**: Chưa đăng nhập
- **403**: Không có quyền


---

### GET /api/v1/courses/{id}

**Lấy chi tiết khóa học**

Lấy thông tin chi tiết của một khóa học bao gồm units và lessons

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Responses:**

- **200**: Chi tiết khóa học
- **404**: Không tìm thấy khóa học


---

### PATCH /api/v1/courses/{id}

**Cập nhật khóa học (Admin)**

Cập nhật thông tin khóa học - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Request Body:**

**Responses:**

- **200**: Cập nhật thành công
- **404**: Không tìm thấy khóa học


---

### DELETE /api/v1/courses/{id}

**Xóa khóa học (Admin)**

Xóa khóa học khỏi hệ thống - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của khóa học |

**Responses:**

- **200**: Xóa thành công
- **404**: Không tìm thấy khóa học


---

## Units

### GET /api/v1/units/course/{courseId}

**Lấy danh sách units theo course**

Lấy tất cả units thuộc một khóa học

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `courseId` | path | string | ✅ | ID của khóa học |

**Responses:**

- **200**: Danh sách units


---

### GET /api/v1/units/{id}

**Lấy chi tiết unit**

Lấy thông tin chi tiết của unit bao gồm danh sách lessons

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của unit |

**Responses:**

- **200**: Chi tiết unit
- **404**: Không tìm thấy unit


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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy unit


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

- **200**: Xóa thành công
- **404**: Không tìm thấy unit


---

### POST /api/v1/units

**Tạo unit mới**

Tạo unit mới trong khóa học - yêu cầu quyền Admin

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

- **201**: Tạo unit thành công
- **401**: Chưa đăng nhập


---

## Lessons

### GET /api/v1/lessons/unit/{unitId}

**Lấy danh sách lessons theo unit**

Lấy tất cả lessons thuộc một unit

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `unitId` | path | string | ✅ | ID của unit |

**Responses:**

- **200**: Danh sách lessons


---

### GET /api/v1/lessons/{id}

**Lấy chi tiết lesson với nội dung đầy đủ**

Lấy thông tin chi tiết lesson bao gồm contents, vocabularies, grammar, exercises

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Chi tiết lesson
- **404**: Không tìm thấy lesson


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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy lesson


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

- **200**: Xóa thành công
- **404**: Không tìm thấy lesson


---

### POST /api/v1/lessons

**Tạo lesson mới**

Tạo lesson mới trong unit - yêu cầu quyền Admin

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

- **201**: Tạo lesson thành công
- **401**: Chưa đăng nhập


---

## Contents

### GET /api/v1/contents/lesson/{lessonId}

**Lấy nội dung theo lesson**

Lấy tất cả nội dung học thuộc một lesson (text, audio, video, image)

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Danh sách nội dung


---

### GET /api/v1/contents/{id}

**Lấy chi tiết nội dung**

Lấy thông tin chi tiết của một nội dung học

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của nội dung |

**Responses:**

- **200**: Chi tiết nội dung
- **404**: Không tìm thấy nội dung


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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy nội dung


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

- **200**: Xóa thành công
- **404**: Không tìm thấy nội dung


---

### POST /api/v1/contents

**Tạo nội dung mới**

Tạo nội dung học mới trong lesson - yêu cầu quyền Admin

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

- **201**: Tạo nội dung thành công
- **401**: Chưa đăng nhập


---

## Vocabularies

### GET /api/v1/vocabularies/lesson/{lessonId}

**Lấy từ vựng theo lesson**

Lấy tất cả từ vựng thuộc một lesson

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Danh sách từ vựng


---

### POST /api/v1/vocabularies

**Tạo từ vựng mới**

Tạo từ vựng mới trong lesson - yêu cầu quyền Admin

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

- **201**: Tạo từ vựng thành công
- **401**: Chưa đăng nhập


---

### PATCH /api/v1/vocabularies/{id}

**Cập nhật từ vựng**

Cập nhật thông tin từ vựng - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của từ vựng |

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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy từ vựng


---

### DELETE /api/v1/vocabularies/{id}

**Xóa từ vựng**

Xóa từ vựng khỏi lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của từ vựng |

**Responses:**

- **200**: Xóa thành công
- **404**: Không tìm thấy từ vựng


---

### POST /api/v1/vocabularies/{vocabularyId}/learn

**Thêm từ vựng vào danh sách học**

Thêm từ vựng vào danh sách học của user để theo dõi tiến độ

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `vocabularyId` | path | string | ✅ | ID của từ vựng |

**Responses:**

- **201**: Thêm thành công


---

### POST /api/v1/vocabularies/{vocabularyId}/review

**Ôn tập từ vựng**

Ghi nhận kết quả ôn tập từ vựng và cập nhật lịch ôn tập theo thuật toán spaced repetition

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `vocabularyId` | path | string | ✅ | ID của từ vựng |

**Request Body:**

**Responses:**

- **200**: Cập nhật kết quả ôn tập


---

### GET /api/v1/vocabularies/my-vocabularies

**Lấy danh sách từ vựng đã học**

Lấy tất cả từ vựng mà user đã thêm vào danh sách học

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Danh sách từ vựng đã học


---

### GET /api/v1/vocabularies/due-review

**Lấy từ vựng cần ôn tập**

Lấy danh sách từ vựng đến hạn ôn tập theo lịch spaced repetition

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Danh sách từ vựng cần ôn tập


---

### POST /api/v1/vocabularies/upload-audio

**Upload audio cho từ vựng**

Upload file audio phát âm cho từ vựng

🔒 **Authentication Required:** Bearer Token

**Request Body:**

**Responses:**

- **201**: Upload thành công


---

### POST /api/v1/vocabularies/upload-image

**Upload hình ảnh cho từ vựng**

Upload file hình ảnh minh họa cho từ vựng

🔒 **Authentication Required:** Bearer Token

**Request Body:**

**Responses:**

- **201**: Upload thành công


---

## Grammar

### GET /api/v1/grammar/lesson/{lessonId}

**Lấy ngữ pháp theo lesson**

Lấy tất cả quy tắc ngữ pháp thuộc một lesson

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Danh sách ngữ pháp


---

### GET /api/v1/grammar/{id}

**Lấy chi tiết ngữ pháp**

Lấy thông tin chi tiết của một quy tắc ngữ pháp

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của ngữ pháp |

**Responses:**

- **200**: Chi tiết ngữ pháp
- **404**: Không tìm thấy ngữ pháp


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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy ngữ pháp


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

- **200**: Xóa thành công
- **404**: Không tìm thấy ngữ pháp


---

### POST /api/v1/grammar

**Tạo ngữ pháp mới**

Tạo quy tắc ngữ pháp mới trong lesson - yêu cầu quyền Admin

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

- **201**: Tạo ngữ pháp thành công
- **401**: Chưa đăng nhập


---

## Exercises

### GET /api/v1/exercises/my-results

**Lấy kết quả bài tập của user**

Lấy lịch sử làm bài tập của user hiện tại

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Danh sách kết quả bài tập


---

### GET /api/v1/exercises/my-stats

**Lấy thống kê bài tập**

Lấy thống kê tổng quan về bài tập của user

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Thống kê bài tập


---

### GET /api/v1/exercises/lesson/{lessonId}

**Lấy bài tập theo lesson**

Lấy tất cả bài tập thuộc một lesson

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Danh sách bài tập


---

### GET /api/v1/exercises/{id}

**Lấy chi tiết bài tập**

Lấy thông tin chi tiết của một bài tập

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `id` | path | string | ✅ | ID của bài tập |

**Responses:**

- **200**: Chi tiết bài tập
- **404**: Không tìm thấy bài tập


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

- **200**: Cập nhật thành công
- **404**: Không tìm thấy bài tập


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

- **200**: Xóa thành công
- **404**: Không tìm thấy bài tập


---

### POST /api/v1/exercises

**Tạo bài tập mới**

Tạo bài tập mới trong lesson - yêu cầu quyền Admin

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

- **201**: Tạo bài tập thành công
- **401**: Chưa đăng nhập


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

**Responses:**

- **200**: Kết quả chấm bài
- **404**: Không tìm thấy bài tập


---

## Progress

### GET /api/v1/progress

**Lấy toàn bộ tiến độ học của user**

Lấy tổng quan tiến độ học tập của user bao gồm tất cả lessons đã học

🔒 **Authentication Required:** Bearer Token

**Responses:**

- **200**: Tiến độ học tập
- **401**: Chưa đăng nhập


---

### GET /api/v1/progress/lesson/{lessonId}

**Lấy tiến độ của 1 lesson**

Lấy thông tin chi tiết tiến độ học của một lesson cụ thể

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **200**: Tiến độ lesson
- **404**: Không tìm thấy tiến độ


---

### POST /api/v1/progress/lesson/{lessonId}/start

**Bắt đầu học lesson**

Đánh dấu bắt đầu học một lesson mới

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

- **201**: Bắt đầu lesson thành công


---

### POST /api/v1/progress/lesson/{lessonId}/complete

**Hoàn thành lesson**

Đánh dấu hoàn thành lesson và lưu điểm số

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Request Body:**

**Responses:**

- **200**: Hoàn thành lesson


---

### PATCH /api/v1/progress/lesson/{lessonId}/time

**Cập nhật thời gian học**

Cập nhật thời gian đã dành cho lesson (tính bằng giây)

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Request Body:**

**Responses:**

- **200**: Cập nhật thời gian thành công


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


