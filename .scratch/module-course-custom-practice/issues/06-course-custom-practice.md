Status: done

## Parent

`.scratch/module-course-custom-practice/PRD.md`

## What to build

Enable custom practice creation and AI generation at the course level. Update `ExerciseSetService.createCustom()` to accept courseId: query ModuleProgress for completed modules in the course, reject if 0 completed modules (400), create ExerciseSet with courseId FK. Update `ExerciseSetService.generate()` to detect course-level sets, collect all lesson IDs from completed modules (via ModuleProgress → Module → Lessons), pass them to ExerciseContextLoader.loadCourseContext(), use `exercise-generation-course.yaml` template (includes courseTitle, moduleCount, lessonContexts, emphasizes comprehensive cross-module review). Add `GET /exercise-sets/course/:courseId` endpoint returning eligibility (≥1 completed module), counts, and course's custom practice sets.

## Acceptance criteria

- [x] `createCustom()` with courseId: queries ModuleProgress for completed modules in course, 400 if 0 completed modules, creates ExerciseSet with courseId FK
- [x] `generate()` for course-level set: collects all lesson IDs from completed modules, passes to ExerciseContextLoader.loadCourseContext()
- [x] `exercise-generation-course.yaml` created with variables `{{courseTitle}}`, `{{moduleCount}}`, `{{lessonContexts}}`, `{{userPrompt}}`, instructions emphasizing comprehensive cross-module review
- [x] Course-level generation uses `renderPrompt('exercise-generation-course', ...)` and persists AI-generated title + description
- [x] `GET /exercise-sets/course/:courseId` returns `{ eligible: boolean, completedModulesCount, totalModulesCount, courseSets: ExerciseSetWithProgress[] }`
- [x] Course-level exercises only cover content from lessons in completed modules (not in-progress modules)
- [x] Unit tests: createCustom with courseId (eligible, not eligible), generate with course context
- [x] E2E test: `POST /exercise-sets/custom` with courseId, `GET /exercise-sets/course/:courseId`

## Blocked by

- `01-module-course-progress-entities` (CourseProgress needed for eligibility)
- `02-exercise-set-schema-extension-context-loader` (ExerciseContextLoader + schema changes needed)

## Implementation notes

### Files created

- `backend/src/infrastructure/genai/prompts/exercise-generation-course.yaml` — YAML prompt template for course-level exercise generation with variables `{{courseTitle}}`, `{{moduleCount}}`, `{{lessonContexts}}`, `{{userPromptSection}}`; instructions emphasize comprehensive cross-module integrative review
- `backend/test/course-custom-practice.e2e-spec.ts` — E2E tests for `POST /exercise-sets/custom` with courseId (create, with userPrompt, 400 no completed modules, 400 XOR violation) and `GET /exercise-sets/course/:courseId` (eligibility, eligible=false, returns created sets)

### Files modified

- `backend/src/modules/exercises/application/exercise-set.service.ts` — Added `CourseExerciseSummary` interface; added `findByCourseId()` method returning eligibility, completedModulesCount, totalModulesCount, courseSets with progress stats; removed unused `ProgressStatus` import; fixed `userExerciseResultRepository` → `userExerciseResultsRepository` typo in `findByCourseId`
- `backend/src/modules/exercises/application/exercise-set.service.spec.ts` — Added `findActiveCustomSetsByCourse` mock; added tests for `createCustom` with courseId (eligible, not eligible); added `findByCourseId` describe block (eligible=false, eligible=true with sets, NotFoundException)
- `backend/src/modules/exercises/presentation/exercise-set.controller.ts` — Added `GET /exercise-sets/course/:courseId` endpoint with Swagger docs, JwtAuthGuard, returning CourseExerciseSummary
- `backend/src/modules/exercises/application/exercise-generation.service.ts` — Added `CoursesRepository` import and injection; added `courseId` branch in `doGenerate()`: loads course, finds completed module IDs via ModuleProgressRepository, collects lesson IDs from completed modules only, calls `ExerciseContextLoader.loadCourseContext()`, renders `exercise-generation-course` template with courseTitle/moduleCount/lessonContexts; updated error message to mention courseId
- `backend/src/modules/exercises/application/exercise-generation.service.spec.ts` — Added `CoursesRepository` import and mock; added `coursesRepo` provider; added `course-level generation` describe block: tests `loadCourseContext` usage, only completed modules' lessons included, course-not-found error

### Files deleted

None
