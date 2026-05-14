Status: done

## Parent

`.scratch/module-course-custom-practice/PRD.md`

## What to build

Add a custom practice widget and bypass completion controls to the CourseDetailScreen. Custom practice section follows same pattern as module: hidden when no modules completed, "Create Custom Practice" button opens shared bottom sheet creation form, tapping a set opens info view. Display "X/Y modules completed" progress. Add "Complete All" button that appears when user's level is higher than the course level — tapping shows confirmation dialog, then calls `POST /progress/course/:courseId/complete-all`. Add "Reset" button — tapping shows confirmation dialog, then calls `POST /progress/course/:courseId/reset`. Both buttons update the UI reactively after the operation. Add API client methods for course-level exercise sets and progress bypass operations.

## Acceptance criteria

- [x] Custom practice section on CourseDetailScreen, hidden when 0 modules completed
- [x] "Create Custom Practice" button opens shared bottom sheet creation form
- [x] Tapping existing set opens shared bottom sheet info view
- [x] Course progress displayed as "X/Y modules completed"
- [x] "Complete All" button visible only when user level > course level
- [x] Confirmation dialog before complete-all: "Mark all lessons as completed?"
- [x] "Reset" button visible when course has any progress (including bypass)
- [x] Confirmation dialog before reset: "Reset all progress? This cannot be undone."
- [x] Both operations update UI reactively after completion
- [x] API client methods: fetchCourseExerciseSets, completeAllCourseProgress, resetCourseProgress
- [x] Widget test: Complete All button only shows when user level > course level
- [x] Widget test: confirmation dialogs appear before both operations
- [x] Widget test: Reset button hidden when no progress exists

## Blocked by

- `06-course-custom-practice` (backend course custom practice endpoints must exist)
- `03-bypass-completion-reset-onboarding` (complete-all + reset backend endpoints must exist)
- `08-mobile-shared-bottom-sheet` (shared bottom sheet component must exist)

## Implementation notes

### Files created

- `mobile/test/features/courses/presentation/screens/course_detail_screen_test.dart` — 12 widget tests covering all acceptance criteria: custom practice visibility, Complete All button level-gating, Reset button progress-gating, confirmation dialogs, set info bottom sheet

### Files modified

- `mobile/lib/features/lessons/domain/exercise_set_models.dart` — Added `courseId` field to `ExerciseSetModel`, added `CourseExerciseSummary` model (eligible, completedModulesCount, totalModulesCount, courseSets)
- `mobile/lib/features/lessons/data/lesson_repository.dart` — Added `fetchCourseExerciseSets()`, `createCustomSetForCourse()`, `completeAllCourseProgress()`, `resetCourseProgress()` API methods
- `mobile/lib/features/lessons/data/lesson_providers.dart` — Added `CourseExerciseSetsNotifier` with full lifecycle (create, generate, regenerate, delete, reset, completeAll, resetCourse) and `courseExerciseSetsProvider`
- `mobile/lib/features/courses/presentation/screens/course_detail_screen.dart` — Converted from `ConsumerWidget` to `ConsumerStatefulWidget`, added custom practice section, Complete All button with level-gating, Reset button with progress-gating, confirmation dialogs, `_CourseSetCard`, `_isLevelHigher()` level comparison utility
