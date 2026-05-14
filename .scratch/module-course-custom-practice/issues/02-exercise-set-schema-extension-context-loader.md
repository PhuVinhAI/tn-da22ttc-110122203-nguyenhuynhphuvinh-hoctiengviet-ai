Status: done

## Parent

`.scratch/module-course-custom-practice/PRD.md`

## What to build

Extend ExerciseSet entity: make `lessonId` nullable, add nullable `moduleId` (FK → Module, SET NULL on delete), nullable `courseId` (FK → Course, SET NULL on delete), nullable `description` (string), nullable `userPrompt` (string, max 500 chars). Make Exercise's `lessonId` nullable as well. Create ExerciseContextLoader service in the exercises module with three methods: `loadLessonContext(lessonId)` (migrated from existing inline logic in ExerciseGenerationService), `loadModuleContext(lessonIds[])` (merge + deduplicate vocabularies by word, grammar rules by ruleName across lessons), `loadCourseContext(lessonIds[])` (same merge logic as module). The loader does NOT query progress — callers pass completed lesson IDs. This enables module/course custom practice generation without circular dependencies.

## Acceptance criteria

- [x] ExerciseSet: `lessonId` nullable, `moduleId` nullable (FK → Module, SET NULL), `courseId` nullable (FK → Course, SET NULL), `description` nullable string, `userPrompt` nullable string (max 500)
- [x] Exercise: `lessonId` nullable
- [x] ExerciseContextLoader service with `loadLessonContext(lessonId)`, `loadModuleContext(lessonIds[])`, `loadCourseContext(lessonIds[])`
- [x] `loadModuleContext` and `loadCourseContext` deduplicate vocabularies by word and grammar rules by ruleName (keep version from most recently completed lesson — callers sort before passing)
- [x] `loadModuleContext([])` and `loadCourseContext([])` return empty context
- [x] ExerciseSetService.generate() migrated to use ExerciseContextLoader.loadLessonContext() instead of inline loading
- [x] Unit tests for ExerciseContextLoader: single lesson, multi-lesson merge+dedupe, empty input
- [x] No circular dependencies: exercises module exports ExerciseContextLoader, progress module does not import exercises module services

## Blocked by

None — can start immediately

## Implementation notes

### Files created
- `backend/src/modules/exercises/application/exercise-context-loader.ts` — New service with `loadLessonContext`, `loadModuleContext`, `loadCourseContext` methods; deduplicates vocabularies by word and grammar rules by title using Map (last-write-wins for caller-sorted lesson order); empty input returns empty context
- `backend/src/modules/exercises/application/exercise-context-loader.spec.ts` — 10 unit tests covering: single lesson load, existing exercises collection, lesson-not-found error, empty input for module/course, multi-lesson merge, vocab dedupe by word, grammar dedupe by title, skip-missing-lessons, course-level same merge logic

### Files modified
- `backend/src/modules/exercises/domain/exercise-set.entity.ts` — Made `lessonId` nullable; added `moduleId` (FK→Module, SET NULL), `courseId` (FK→Course, SET NULL), `description` (nullable text), `userPrompt` (nullable varchar 500)
- `backend/src/modules/exercises/domain/exercise.entity.ts` — Made `lessonId` nullable
- `backend/src/modules/exercises/application/exercise-generation.service.ts` — Replaced DataSource with ExerciseContextLoader dependency; `doGenerate` now calls `exerciseContextLoader.loadLessonContext()` instead of inline loading; removed `loadLessonContext` method and `LessonContext` interface (moved to loader); `createRegeneratedSet` copies `moduleId`, `courseId`, `description`, `userPrompt`; `persistExercises` uses `set.lessonId` (now optional)
- `backend/src/modules/exercises/application/exercise-generation.service.spec.ts` — Replaced DataSource mock with ExerciseContextLoader mock; removed `loadLessonContext` tests (now in loader spec); added test for regenerated set copying new fields
- `backend/src/modules/exercises/exercises.module.ts` — Added `ExerciseContextLoader` to providers and exports

### Files deleted
- None
