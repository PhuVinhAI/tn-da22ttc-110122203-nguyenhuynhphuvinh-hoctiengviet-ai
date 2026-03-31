# LinVNix API

> API cho ứng dụng học tiếng Việt

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api/v1`

## 🤖 AI Integration Notes

This documentation is optimized for AI/LLM consumption:
- All request bodies include complete JSON examples
- All response bodies show expected structure
- Enum values are listed inline with types
- Nested objects are fully expanded
- Error responses include status codes and descriptions

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
- [Progress](#progress)
- [Grammar](#grammar)
- [Exercises](#exercises)
- [Admin](#admin)
- [Schemas](#-schemas)

---

## Cache

### GET /api/v1/cache/stats

**Lấy thống kê cache**

Lấy thông tin thống kê về cache Redis (số keys, memory usage, hit rate...)

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Thống kê cache

⚠️ **401** - Chưa đăng nhập


---

### DELETE /api/v1/cache/clear

**Xóa toàn bộ cache**

Xóa tất cả cache trong Redis - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Xóa cache thành công

⚠️ **401** - Chưa đăng nhập


---

## Authentication

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

### POST /api/v1/auth/refresh

**Làm mới access token**

Sử dụng refresh token để lấy access token mới. Refresh token cũ sẽ bị thu hồi (token rotation).

**Request Body:**

Type: [`RefreshTokenDto`](#refreshtokendto)

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Responses:**

✅ **200** - Token đã được làm mới

⚠️ **401** - Refresh token không hợp lệ hoặc đã hết hạn


---

### POST /api/v1/auth/logout

**Đăng xuất**

Thu hồi refresh token và đăng xuất khỏi hệ thống

**Request Body:**

Type: [`RefreshTokenDto`](#refreshtokendto)

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Responses:**

✅ **200** - Đăng xuất thành công


---

## Users

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

## Courses

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

## Units

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

## Lessons

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

## Contents

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

## Vocabularies

### GET /api/v1/vocabularies/search

**Tìm kiếm từ vựng**

Tìm kiếm từ vựng theo word, translation hoặc phonetic. Trả về tối đa 50 kết quả.

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `q` | query | string | ✅ | - |

**Responses:**

✅ **200** - Kết quả tìm kiếm


---

### GET /api/v1/vocabularies/lesson/{lessonId}

**Lấy từ vựng theo lesson**

Lấy tất cả từ vựng thuộc một lesson. Nếu user đã đăng nhập, sẽ tự động áp dụng dialect preference của user.

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `lessonId` | path | string | ✅ | ID của lesson |

**Responses:**

✅ **200** - Danh sách từ vựng


---

### POST /api/v1/vocabularies

**Tạo từ vựng mới**

Tạo từ vựng mới trong lesson - yêu cầu quyền Admin

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`CreateVocabularyDto`](#createvocabularydto)

```json
{
  "word": "xin chào",
  "translation": "hello",
  "phonetic": "sin chao",
  "partOfSpeech": "noun",
  "exampleSentence": "Xin chào, bạn khỏe không?",
  "exampleTranslation": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "classifier": "con",
  "dialectVariants": {
    "SOUTHERN": "heo",
    "NORTHERN": "lợn"
  },
  "audioUrls": {
    "NORTHERN": "https://example.com/audio-northern.mp3",
    "SOUTHERN": "https://example.com/audio-southern.mp3"
  },
  "region": "STANDARD",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **201** - Tạo từ vựng thành công

⚠️ **401** - Chưa đăng nhập


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

Type: [`CreateVocabularyDto`](#createvocabularydto)

```json
{
  "word": "xin chào",
  "translation": "hello",
  "phonetic": "sin chao",
  "partOfSpeech": "noun",
  "exampleSentence": "Xin chào, bạn khỏe không?",
  "exampleTranslation": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "classifier": "con",
  "dialectVariants": {
    "SOUTHERN": "heo",
    "NORTHERN": "lợn"
  },
  "audioUrls": {
    "NORTHERN": "https://example.com/audio-northern.mp3",
    "SOUTHERN": "https://example.com/audio-southern.mp3"
  },
  "region": "STANDARD",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```

**Responses:**

✅ **200** - Cập nhật thành công

⚠️ **404** - Không tìm thấy từ vựng


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

✅ **200** - Xóa thành công

⚠️ **404** - Không tìm thấy từ vựng


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

✅ **201** - Thêm thành công


---

### POST /api/v1/vocabularies/review/batch

**Ôn tập nhiều từ vựng cùng lúc**

Submit kết quả ôn tập cho nhiều từ vựng trong một request. Giúp giảm số lượng API calls khi học flashcard hàng loạt.

🔒 **Authentication Required:** Bearer Token

**Request Body:**

Type: [`BatchReviewDto`](#batchreviewdto)

```json
{
  "reviews": [
    {
      "vocabularyId": "string",
      "rating": 0
    }
  ],
  "reviewDate": "string"
}
```

**Responses:**

✅ **200** - Kết quả batch review


---

### POST /api/v1/vocabularies/{vocabularyId}/review

**Ôn tập từ vựng**

Ghi nhận kết quả ôn tập từ vựng và cập nhật lịch ôn tập theo thuật toán FSRS. Rating: 1=Again (quên hoàn toàn), 2=Hard (nhớ khó), 3=Good (nhớ đúng), 4=Easy (nhớ dễ dàng)

🔒 **Authentication Required:** Bearer Token

**Parameters:**

| Name | In | Type | Required | Description |
|------|-------|------|----------|-------------|
| `vocabularyId` | path | string | ✅ | ID của từ vựng |

**Request Body:**

```json
{
  "rating": 3,
  "reviewDate": "2024-01-01T00:00:00.000Z"
}
```

**Responses:**

✅ **200** - Cập nhật kết quả ôn tập


---

### GET /api/v1/vocabularies/my-vocabularies

**Lấy danh sách từ vựng đã học**

Lấy tất cả từ vựng mà user đã thêm vào danh sách học

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Danh sách từ vựng đã học


---

### GET /api/v1/vocabularies/due-review

**Lấy từ vựng cần ôn tập**

Lấy danh sách từ vựng đến hạn ôn tập theo lịch spaced repetition

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Danh sách từ vựng cần ôn tập


---

### POST /api/v1/vocabularies/upload-audio

**Upload audio cho từ vựng**

Upload file audio phát âm cho từ vựng

🔒 **Authentication Required:** Bearer Token

**Request Body:**

```json
{
  "file": "string"
}
```

**Responses:**

✅ **201** - Upload thành công


---

### POST /api/v1/vocabularies/upload-image

**Upload hình ảnh cho từ vựng**

Upload file hình ảnh minh họa cho từ vựng

🔒 **Authentication Required:** Bearer Token

**Request Body:**

```json
{
  "file": "string"
}
```

**Responses:**

✅ **201** - Upload thành công


---

## Progress

### GET /api/v1/progress

**Lấy toàn bộ tiến độ học của user**

Lấy tổng quan tiến độ học tập của user bao gồm tất cả lessons đã học

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Tiến độ học tập

⚠️ **401** - Chưa đăng nhập


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

✅ **200** - Tiến độ lesson

⚠️ **404** - Không tìm thấy tiến độ


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

✅ **201** - Bắt đầu lesson thành công


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

```json
{
  "score": 85
}
```

**Responses:**

✅ **200** - Hoàn thành lesson


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

```json
{
  "additionalTime": 300
}
```

**Responses:**

✅ **200** - Cập nhật thời gian thành công


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

## Exercises

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

## Admin

### GET /api/v1/admin/dashboard

**Lấy thống kê dashboard cho Admin**

Trả về tổng số users, DAU, top courses, và exercises có error rate cao nhất. Chỉ Admin mới truy cập được.

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Dashboard statistics

⚠️ **403** - Forbidden - Admin only


---

## 📦 Schemas

Complete schema definitions for all DTOs used in the API.

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


### RefreshTokenDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `refreshToken` | string | ✅ | Refresh token nhận được từ login/register |

**Example:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```


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


### CreateVocabularyDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `word` | string | ✅ | - |
| `translation` | string | ✅ | - |
| `phonetic` | string | ❌ | - |
| `partOfSpeech` | string (noun, verb, adjective, adverb, pronoun, preposition, conjunction, phrase, interjection) | ✅ | - |
| `exampleSentence` | string | ❌ | - |
| `exampleTranslation` | string | ❌ | - |
| `audioUrl` | string | ❌ | - |
| `imageUrl` | string | ❌ | - |
| `classifier` | string | ❌ | Classifier for nouns (e.g., "con" for animals, "cái" for objects) |
| `dialectVariants` | object | ❌ | Regional dialect variants of the word |
| `audioUrls` | object | ❌ | Audio URLs for different dialects |
| `region` | string (STANDARD, NORTHERN, CENTRAL, SOUTHERN) | ❌ | Primary dialect/region for this vocabulary |
| `difficultyLevel` | number | ❌ | - |
| `lessonId` | string | ✅ | - |

**Example:**

```json
{
  "word": "xin chào",
  "translation": "hello",
  "phonetic": "sin chao",
  "partOfSpeech": "noun",
  "exampleSentence": "Xin chào, bạn khỏe không?",
  "exampleTranslation": "Hello, how are you?",
  "audioUrl": "https://example.com/audio.mp3",
  "imageUrl": "https://example.com/image.jpg",
  "classifier": "con",
  "dialectVariants": {
    "SOUTHERN": "heo",
    "NORTHERN": "lợn"
  },
  "audioUrls": {
    "NORTHERN": "https://example.com/audio-northern.mp3",
    "SOUTHERN": "https://example.com/audio-southern.mp3"
  },
  "region": "STANDARD",
  "difficultyLevel": 1,
  "lessonId": "uuid-of-lesson"
}
```


### ReviewItemDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `vocabularyId` | string | ✅ | ID của từ vựng |
| `rating` | number | ✅ | Đánh giá: 1=Again (quên), 2=Hard, 3=Good, 4=Easy |

**Example:**

```json
{
  "vocabularyId": "string",
  "rating": 0
}
```


### BatchReviewDto

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `reviews` | array<[ReviewItemDto](#reviewitemdto)> | ✅ | Danh sách các review |
| `reviewDate` | string | ❌ | Thời điểm review (optional, dùng cho testing) |

**Example:**

```json
{
  "reviews": [
    {
      "vocabularyId": "string",
      "rating": 0
    }
  ],
  "reviewDate": "string"
}
```


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


