# Hệ thống RBAC (Role-Based Access Control)

## Tổng quan

Hệ thống RBAC chi tiết với 2 roles chính và permissions granular cho từng resource.

## Roles

### 1. USER (Người dùng thông thường)
- Role mặc định khi đăng ký
- Có quyền học tập và sử dụng các tính năng cơ bản

### 2. ADMIN (Quản trị viên)
- Có tất cả permissions
- Quản lý toàn bộ hệ thống

## Permissions Chi tiết

### User Management
- `USER_CREATE` - Tạo user mới
- `USER_READ` - Xem thông tin user
- `USER_UPDATE` - Cập nhật user
- `USER_DELETE` - Xóa user
- `USER_LIST` - Xem danh sách users
- `USER_MANAGE_ROLES` - Quản lý roles của user

### Course Management
- `COURSE_CREATE` - Tạo khóa học
- `COURSE_READ` - Xem khóa học
- `COURSE_UPDATE` - Cập nhật khóa học
- `COURSE_DELETE` - Xóa khóa học
- `COURSE_LIST` - Xem danh sách khóa học
- `COURSE_PUBLISH` - Publish khóa học

### Unit Management
- `UNIT_CREATE` - Tạo unit
- `UNIT_READ` - Xem unit
- `UNIT_UPDATE` - Cập nhật unit
- `UNIT_DELETE` - Xóa unit

### Lesson Management
- `LESSON_CREATE` - Tạo lesson
- `LESSON_READ` - Xem lesson
- `LESSON_UPDATE` - Cập nhật lesson
- `LESSON_DELETE` - Xóa lesson

### Exercise Management
- `EXERCISE_CREATE` - Tạo exercise
- `EXERCISE_READ` - Xem exercise
- `EXERCISE_UPDATE` - Cập nhật exercise
- `EXERCISE_DELETE` - Xóa exercise
- `EXERCISE_SUBMIT` - Submit exercise

### Vocabulary Management
- `VOCABULARY_CREATE` - Tạo vocabulary
- `VOCABULARY_READ` - Xem vocabulary
- `VOCABULARY_UPDATE` - Cập nhật vocabulary
- `VOCABULARY_DELETE` - Xóa vocabulary

### Grammar Management
- `GRAMMAR_CREATE` - Tạo grammar rule
- `GRAMMAR_READ` - Xem grammar rule
- `GRAMMAR_UPDATE` - Cập nhật grammar rule
- `GRAMMAR_DELETE` - Xóa grammar rule

### Progress Management
- `PROGRESS_READ` - Xem progress của mình
- `PROGRESS_UPDATE` - Cập nhật progress
- `PROGRESS_DELETE` - Xóa progress
- `PROGRESS_VIEW_ALL` - Xem progress của tất cả users

### Content Management
- `CONTENT_CREATE` - Tạo content
- `CONTENT_READ` - Xem content
- `CONTENT_UPDATE` - Cập nhật content
- `CONTENT_DELETE` - Xóa content

### System Management
- `SYSTEM_SETTINGS` - Quản lý system settings
- `SYSTEM_LOGS` - Xem system logs
- `CACHE_MANAGE` - Quản lý cache

## Sử dụng trong Code

### 1. Protect endpoint với Permissions

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/enums';

@Controller('courses')
@UseGuards(PermissionsGuard)
export class CoursesController {
  
  // Chỉ ADMIN mới tạo được course
  @Post()
  @RequirePermissions(Permission.COURSE_CREATE)
  async create() {
    // ...
  }

  // Ai cũng xem được (USER và ADMIN)
  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  async findAll() {
    // ...
  }

  // Chỉ ADMIN mới xóa được
  @Delete(':id')
  @RequirePermissions(Permission.COURSE_DELETE)
  async remove(@Param('id') id: string) {
    // ...
  }
}
```

### 2. Require nhiều permissions

```typescript
// User phải có CẢ 2 permissions
@Post('publish/:id')
@RequirePermissions(
  Permission.COURSE_UPDATE,
  Permission.COURSE_PUBLISH
)
async publish(@Param('id') id: string) {
  // ...
}
```

### 3. Check permission trong Service

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Permission } from '../../common/enums';

@Injectable()
export class CoursesService {
  async updateCourse(userId: string, courseId: string, data: any) {
    const user = await this.usersService.findOne(userId);
    
    // Check permission manually
    const hasPermission = this.hasPermission(user, Permission.COURSE_UPDATE);
    
    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền cập nhật khóa học');
    }

    // Update course...
  }

  private hasPermission(user: any, permission: Permission): boolean {
    if (!user.roles) return false;
    
    for (const role of user.roles) {
      if (role.permissions?.some(p => p.name === permission)) {
        return true;
      }
    }
    
    return false;
  }
}
```

### 4. Protect toàn bộ Controller

```typescript
@Controller('admin')
@UseGuards(PermissionsGuard)
@RequirePermissions(Permission.SYSTEM_SETTINGS)
export class AdminController {
  // Tất cả endpoints trong controller này đều cần SYSTEM_SETTINGS permission
}
```

## Database Schema

### roles table
```sql
id          UUID PRIMARY KEY
name        ENUM('USER', 'ADMIN')
description TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### permissions table
```sql
id          UUID PRIMARY KEY
name        ENUM (tất cả permissions)
description TEXT
category    VARCHAR (user, course, system, etc.)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### user_roles table (Many-to-Many)
```sql
user_id     UUID REFERENCES users(id)
role_id     UUID REFERENCES roles(id)
PRIMARY KEY (user_id, role_id)
```

### role_permissions table (Many-to-Many)
```sql
role_id        UUID REFERENCES roles(id)
permission_id  UUID REFERENCES permissions(id)
PRIMARY KEY (role_id, permission_id)
```

## Seeding

Roles và Permissions được tự động seed khi app khởi động (xem `RbacService.onModuleInit()`).

### USER Role Permissions
- Tất cả `_READ` permissions
- `EXERCISE_SUBMIT`
- `PROGRESS_READ`, `PROGRESS_UPDATE`

### ADMIN Role Permissions
- TẤT CẢ permissions

## Thêm Permission mới

1. Thêm vào enum `Permission` trong `backend/src/common/enums/permission.enum.ts`
2. Thêm vào `seedPermissions()` trong `RbacService`
3. Assign cho role phù hợp trong `seedRoles()`
4. Restart app để seed

## Best Practices

1. ✅ Luôn dùng `@RequirePermissions()` thay vì `@Roles()`
2. ✅ Permissions chi tiết hơn roles, dễ maintain hơn
3. ✅ Đặt tên permission theo format: `RESOURCE_ACTION`
4. ✅ Group permissions theo category
5. ✅ Test permissions thoroughly
6. ❌ Không hardcode role names trong code
7. ❌ Không skip permission checks vì "tiện"

## Testing

```typescript
describe('CoursesController', () => {
  it('should allow ADMIN to create course', async () => {
    const adminUser = await createUserWithRole(Role.ADMIN);
    const response = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send(courseData);
    
    expect(response.status).toBe(201);
  });

  it('should deny USER from creating course', async () => {
    const normalUser = await createUserWithRole(Role.USER);
    const response = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${normalUser.token}`)
      .send(courseData);
    
    expect(response.status).toBe(403);
  });
});
```

## Migration

Khi deploy lần đầu, chạy migration để tạo tables:

```bash
# Tạo migration
npm run migration:generate -- -n CreateRbacTables

# Chạy migration
npm run migration:run
```

Hoặc để TypeORM tự động sync (chỉ dùng trong development):

```typescript
// database.config.ts
synchronize: process.env.NODE_ENV === 'development'
```
