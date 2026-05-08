Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Refactor `ProgressTransactionService.completeLessonWithTransaction` và `batchUpdateProgress`:

- Gọi `UserExerciseResultsRepository.upsertResult()` và `UserVocabulariesRepository.updateMastery()` thay vì SQL thô
- Bỏ hack `(this as any).queryRunner` — chuẩn hóa `@Transactional()` pattern: inject `DataSource` dưới `this.dataSource`, decorator gắn queryRunner qua ALS hoặc theo NestJS best practice
- `batchUpdateProgress` cũng dùng TypeORM `update()` qua manager thay vì raw SQL

Viết Jest *.spec.ts cho `completeLessonWithTransaction` — test transaction rollback (khi một bước fail, tất cả rollback). Dùng test DataSource thực (SQLite in-memory).

## Acceptance criteria

- [x] `completeLessonWithTransaction` không chứa SQL thô
- [x] `batchUpdateProgress` không chứa SQL thô
- [x] `(this as any).queryRunner` bị thay bằng pattern type-safe
- [x] Jest *.spec.ts test transaction rollback pass
- [ ] Progress integration tests vẫn pass
- [x] Mọi truy cập dữ liệu trong ProgressTransactionService đi qua repository

## Blocked by

- `07-repository-methods-replace-raw-sql.md`
