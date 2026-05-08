Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Hấp thụ 4 service CRUD nông vào `CourseContentService`. Xóa `UnitsService`, `LessonsService`, `ContentsService`, `GrammarService` (mỗi cái 34 dòng pass-through). Xóa repository nông tương ứng (`ExercisesRepository`, `GrammarRepository`, `ContentsRepository` — pass-through, không query giá trị).

`CourseContentService` sở hữu toàn bộ CRUD: `createUnit`, `updateUnit`, `deleteUnit`, `createLesson`, `updateLesson`, `deleteLesson`, `createContent`, `updateContent`, `deleteContent`, `createGrammarRule`, `updateGrammarRule`, `deleteGrammarRule`.

4 controller ủy quyền cả read lẫn write cho `CourseContentService`. Repository có query giá trị (eager-load CoursesRepository, UnitsRepository, LessonsRepository, search VocabulariesRepository) giữ nguyên và được `CourseContentService` dùng nội bộ.

Cập nhật Jest *.spec.ts cho CourseContentService — thêm test CRUD operations.

## Acceptance criteria

- [x] `UnitsService`, `LessonsService`, `ContentsService`, `GrammarService` bị xóa
- [x] Repository pass-through bị nội bộ hóa (ContentsRepository, GrammarRepository chuyển vào CoursesModule providers)
- [x] 4 controller ủy quyền toàn bộ cho `CourseContentService`
- [x] CRUD operations hoạt động đúng qua `CourseContentService`
- [x] Jest *.spec.ts cho CourseContentService CRUD pass (34 tests)
- [ ] Integration tests vẫn pass (cần db:up)
- [x] HTTP API contract không đổi (route paths và response shapes giữ nguyên)

## Blocked by

- `09-course-content-structure.md`
