# Vocabularies API

> API endpoints for Vocabularies module

**Base URL:** `http://localhost:3000/api/v1`

---

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

## 📦 Related Schemas

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


