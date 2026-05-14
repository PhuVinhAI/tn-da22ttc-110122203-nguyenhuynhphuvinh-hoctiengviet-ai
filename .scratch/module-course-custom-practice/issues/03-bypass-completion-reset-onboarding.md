Status: done

## Parent

`.scratch/module-course-custom-practice/PRD.md`

## What to build

Implement bypass completion flow on the backend. Add `POST /progress/course/:courseId/complete-all` that validates the user's level is higher than the course level (403 if not), then transactionally creates CourseProgress (COMPLETED, score=null), ModuleProgress (COMPLETED, score=null) for every module, and UserProgress (COMPLETED, score=null, contentViewed=true) for every lesson in the course. Add `POST /progress/course/:courseId/reset` that transactionally deletes CourseProgress, all ModuleProgress for the course's modules, all UserProgress for the course's lessons, all UserExerciseResults for the course's exercises, and soft-deletes all custom ExerciseSets (isCustom=true) belonging to the course. Add `POST /users/onboarding` endpoint that accepts OnboardingDto with `completeLowerCourses` flag — when true, calls completeAllCourseProgress for all courses whose level is below the user's current level. Also update `PATCH /users/me` to trigger completeAllCourseProgress for lower courses when level increases.

## Acceptance criteria

- [x] `POST /progress/course/:courseId/complete-all` — validates user level > course level (403 if not, 404 if course not found), transactionally creates CourseProgress + all ModuleProgress + all UserProgress with score=null
- [x] `POST /progress/course/:courseId/reset` — transactionally deletes CourseProgress + all ModuleProgress + all UserProgress + all UserExerciseResults + soft-deletes custom ExerciseSets for the course
- [x] Both operations are atomic (@Transactional) — either all changes persist or none do
- [x] Bypass-completed lessons have score=null (distinguishable from normal completion)
- [x] `POST /users/onboarding` with `completeLowerCourses=true` cascades complete-all for all lower-level courses
- [x] `PATCH /users/me` level increase triggers complete-all for newly lower courses (upsert-safe via unique constraints)
- [x] `completeAllCourseProgress()` skips if no lower courses exist in DB (no error)
- [x] Reset can be called multiple times (idempotent after first reset)
- [x] Complete-all can be called again after reset
- [x] OnboardingDto: `{ currentLevel: string, preferredDialect?: string, dailyGoal?: number, completeLowerCourses: boolean }`
- [x] Unit tests for ProgressService bypass + reset logic
- [x] E2E tests for complete-all, reset, and onboarding endpoints

## Blocked by

- `01-module-course-progress-entities` (ModuleProgress & CourseProgress entities must exist)

## Implementation notes

### Files created

- `backend/src/modules/users/dto/onboarding.dto.ts` — OnboardingDto với currentLevel, preferredDialect, dailyGoal, completeLowerCourses
- `backend/test/bypass-completion.e2e-spec.ts` — E2E tests cho complete-all, reset, onboarding, và PATCH /users/me level increase

### Files modified

- `backend/src/modules/progress/application/progress-transaction.service.ts` — Thêm `completeAllCourseProgress()` (validates level, upsert CourseProgress/ModuleProgress, create/update UserProgress với score=null) và `resetCourseProgress()` (delete all progress + exercise results + soft-delete custom ExerciseSets). Export `isLevelHigher()` helper.
- `backend/src/modules/progress/application/progress.service.ts` — Inject ProgressTransactionService. Thêm `completeAllCourseProgress()`, `resetCourseProgress()`, `completeAllLowerCourses()` wrapper methods.
- `backend/src/modules/progress/presentation/progress.controller.ts` — Thêm `POST course/:courseId/complete-all` và `POST course/:courseId/reset` endpoints.
- `backend/src/modules/progress/application/progress.service.spec.ts` — Thêm mock cho ProgressTransactionService. Thêm tests cho completeAllCourseProgress (3 tests), resetCourseProgress (3 tests), completeAllLowerCourses (4 tests).
- `backend/src/modules/progress/application/progress-transaction.service.spec.ts` — Thêm mock methods (find, delete, upsert, create, update). Thêm tests cho completeAllCourseProgress (6 tests), resetCourseProgress (5 tests), isLevelHigher (3 tests).
- `backend/src/modules/users/presentation/users.controller.ts` — Inject ProgressService. Thêm `POST /onboarding` endpoint. Update `PATCH /me` để trigger completeAllLowerCourses khi level tăng.
- `backend/src/modules/users/users.module.ts` — Import forwardRef ProgressModule.
- `backend/eslint.config.mjs` — Ignore `test/**/*.e2e-spec.ts` thay vì chỉ `test/app.e2e-spec.ts`.
