# Progress API

> API endpoints for Progress module

**Base URL:** `http://localhost:3000/api/v1`

---

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

