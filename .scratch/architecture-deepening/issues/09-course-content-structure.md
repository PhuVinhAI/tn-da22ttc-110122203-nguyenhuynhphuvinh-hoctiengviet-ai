Status: done

## Parent

PRD: `.scratch/architecture-deepening/PRD.md`

## What to build

Tạo `CourseContentService` trong module `courses` với interface:

- `getCourseStructure(courseId) → { course, units: UnitWithLessons[] }` — trả cây đầy đủ
- `getUnitDetail(unitId) → UnitWithLessons` — trả unit + lessons
- `getLessonDetail(lessonId) → LessonWithContents` — trả lesson + contents + grammar

Service này hấp thụ logic query hiện tại từ `CoursesService`, `UnitsService`, `LessonsService`, `ContentsService`, `GrammarService` cho read operations. NotFoundException xử lý gom tại đây.

4 controller giữ riêng (route không đổi) nhưng ủy quyền cho `CourseContentService` thay vì service riêng lẻ cho read endpoints. CRUD write endpoints tạm thời vẫn gọi service cũ (slice #10 hấp thụ).

Viết Jest *.spec.ts cho `CourseContentService` — test `getCourseStructure`, `getUnitDetail`, `getLessonDetail`.

## Acceptance criteria

- [x] `CourseContentService` tồn tại với `getCourseStructure`, `getUnitDetail`, `getLessonDetail`
- [x] 4 controller ủy quyền read operations cho `CourseContentService`
- [x] NotFoundException xử lý gom tại `CourseContentService`
- [x] Jest *.spec.ts cho CourseContentService pass
- [ ] Courses integration tests (`courses.test.ts`) vẫn pass (cần Docker `db:up`)
- [x] HTTP API contract không đổi

## Blocked by

None - can start immediately
