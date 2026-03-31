# Code Improvements Documentation

## 1. Strict Typing cho Exercise Options

### Vấn đề
- Trường `options` và `correctAnswer` trong Exercise entity đang dùng type `any` (JSONB)
- Không có type safety, dễ gây lỗi runtime

### Giải pháp
Tạo Discriminated Unions với interfaces cụ thể cho từng ExerciseType:

```typescript
// backend/src/modules/exercises/domain/exercise-options.types.ts

export type ExerciseOptions =
  | MultipleChoiceOptions
  | FillBlankOptions
  | MatchingOptions
  | OrderingOptions
  | TranslationOptions
  | ListeningOptions;
```

### Lợi ích
- Type safety tại compile time
- IntelliSense/autocomplete trong IDE
- Type guards để narrow types
- Dễ maintain và extend

### Usage Example

```typescript
import { ExerciseOptions, isMultipleChoiceOptions } from './exercise-options.types';

function processExercise(exercise: Exercise) {
  if (isMultipleChoiceOptions(exercise.options)) {
    // TypeScript biết đây là MultipleChoiceOptions
    console.log(exercise.options.choices);
  }
}
```

---

## 2. Soft Delete + Unique Constraints Fix

### Vấn đề
- User entity có `@DeleteDateColumn` (soft delete)
- Email và googleId có `unique: true` constraint
- Khi user A bị soft-delete, user mới không thể đăng ký bằng email của user A

### Giải pháp
Sử dụng **Partial Index** (PostgreSQL):

```sql
-- Chỉ unique khi deleted_at IS NULL
CREATE UNIQUE INDEX "IDX_users_email_not_deleted" 
ON "users" ("email") 
WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "IDX_users_google_id_not_deleted" 
ON "users" ("google_id") 
WHERE "deleted_at" IS NULL AND "google_id" IS NOT NULL;
```

### Migration
```bash
npm run migration:run
```

File: `backend/src/database/migrations/1234567890124-AddPartialUniqueIndexes.ts`

### Lợi ích
- Cho phép reuse email/googleId sau khi soft delete
- Vẫn đảm bảo uniqueness cho active users
- Không cần thay đổi application logic

---

## 3. Database Transactions

### Vấn đề
Các thao tác phức tạp không được wrap trong transaction:
- Update progress + exercise results + vocabulary → Có thể bị bất đồng bộ nếu 1 bước fail

### Giải pháp
Tạo `@Transactional()` decorator:

```typescript
// backend/src/common/decorators/transactional.decorator.ts

@Transactional()
async completeLessonWithTransaction(
  userId: string,
  lessonId: string,
  exerciseResults: Array<...>,
  vocabularyUpdates: Array<...>,
): Promise<UserProgress> {
  // Tất cả operations trong method này sẽ được wrap trong transaction
  // Auto rollback nếu có lỗi
  // Auto commit nếu thành công
}
```

### Requirements
Service phải inject `DataSource`:

```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly dataSource: DataSource,
    // ... other dependencies
  ) {}
}
```

### Lợi ích
- Đảm bảo atomicity (all or nothing)
- Tự động rollback khi có lỗi
- Code clean hơn, không cần manually manage queryRunner
- Dễ test và maintain

### Usage Example

```typescript
import { Transactional } from '../../../common/decorators';

@Injectable()
export class ProgressTransactionService {
  constructor(private readonly dataSource: DataSource) {}

  @Transactional()
  async completeLessonWithTransaction(
    userId: string,
    lessonId: string,
    exerciseResults: Array<{ exerciseId: string; score: number }>,
  ): Promise<UserProgress> {
    // 1. Update progress
    // 2. Save exercise results
    // 3. Update vocabulary
    // Nếu bất kỳ bước nào fail → rollback tất cả
  }
}
```

---

## Testing

### Test Strict Types
```typescript
// Compile-time check
const options: MultipleChoiceOptions = {
  type: ExerciseType.MULTIPLE_CHOICE,
  choices: ['A', 'B', 'C'],
};

// TypeScript sẽ báo lỗi nếu thiếu field hoặc sai type
```

### Test Partial Index
```sql
-- Test 1: Insert user
INSERT INTO users (email, ...) VALUES ('test@example.com', ...);

-- Test 2: Soft delete
UPDATE users SET deleted_at = NOW() WHERE email = 'test@example.com';

-- Test 3: Insert user mới với cùng email → Should work
INSERT INTO users (email, ...) VALUES ('test@example.com', ...);
```

### Test Transaction
```typescript
// Test rollback
try {
  await service.completeLessonWithTransaction(
    userId,
    lessonId,
    exerciseResults, // Giả sử có lỗi ở đây
    vocabularyUpdates,
  );
} catch (error) {
  // Verify: Progress không được update
  // Verify: Exercise results không được save
}
```

---

## Migration Checklist

- [ ] Run migration: `npm run migration:run`
- [ ] Verify partial indexes: `\d users` trong psql
- [ ] Test soft delete + re-register với cùng email
- [ ] Update existing code để dùng strict types
- [ ] Add `@Transactional()` cho các critical operations
- [ ] Update tests

---

## Notes

### Khi nào dùng @Transactional()?
- ✅ Multiple writes across different tables
- ✅ Critical operations cần atomicity (payment, enrollment, etc.)
- ✅ Batch operations
- ❌ Single read operations
- ❌ Simple single-table updates

### Performance Considerations
- Transactions có overhead → chỉ dùng khi cần thiết
- Giữ transaction scope nhỏ nhất có thể
- Tránh long-running operations trong transaction

### Alternatives
Nếu không muốn dùng decorator, có thể dùng QueryRunner trực tiếp:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // operations
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```
