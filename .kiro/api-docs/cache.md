# Cache API

> API endpoints for Cache module

**Base URL:** `http://localhost:3000/api/v1`

---

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

