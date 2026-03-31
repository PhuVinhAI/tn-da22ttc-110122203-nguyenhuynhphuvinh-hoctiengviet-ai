# Admin API

> API endpoints for Admin module

**Base URL:** `http://localhost:3000/api/v1`

---

### GET /api/v1/admin/dashboard

**Lấy thống kê dashboard cho Admin**

Trả về tổng số users, DAU, top courses, và exercises có error rate cao nhất. Chỉ Admin mới truy cập được.

🔒 **Authentication Required:** Bearer Token

**Responses:**

✅ **200** - Dashboard statistics

⚠️ **403** - Forbidden - Admin only


---

