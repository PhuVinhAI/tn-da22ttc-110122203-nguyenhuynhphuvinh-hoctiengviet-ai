Status: `done`

## Parent

`.scratch/exercise-tier-system/PRD.md`

## What to build

Separate exercises from the lesson wizard and establish the foundational data model + basic tier flow.

Backend: Create the `ExerciseSet` entity (lessonId, tier, isCustom, customConfig JSONB, isAIGenerated, title, generatedById, promptUsed, orderIndex) and `ExerciseTier` enum (BASIC, EASY, MEDIUM, HARD, EXPERT). Add `setId` FK to the existing Exercise entity. Add unique constraint: one active set per tier per lesson. Seed script auto-creates one basic ExerciseSet per lesson that has exercises, assigning existing exercises to that set via `setId`. New API endpoints: `GET /exercise-sets/lesson/:lessonId` (list active sets by tier with progress stats + `unlockedTiers`), `GET /exercise-sets/:id` (set detail with full exercises). Remove exercises from `GET /lessons/:id` response.

Mobile: Remove exercise steps from the lesson wizard — wizard now only shows content + vocabulary + grammar. When the user reaches the last wizard page, show a prompt dialog "Bắt đầu bài tập?" with Yes/No. No → back to lesson list. Yes → navigate to new ExerciseTierScreen showing only the basic tier (others locked). Tap basic → new ExercisePlayScreen: one question at a time, no timer bar, submit → immediate feedback (correct/incorrect + explanation), after last question → summary panel (stats). "Return to tier selector" button.

## Acceptance criteria

- [x] ExerciseSet entity created with all fields per PRD, extends BaseEntity
- [x] ExerciseTier enum created (BASIC, EASY, MEDIUM, HARD, EXPERT)
- [x] Exercise entity has `setId` FK, backward compatible with existing `lessonId`
- [x] Unique constraint on (lessonId, tier, deletedAt IS NULL) enforced
- [x] Seed creates basic ExerciseSet per lesson, assigns existing exercises
- [x] GET /exercise-sets/lesson/:lessonId returns sets with progress + unlockedTiers
- [x] GET /exercise-sets/:id returns set detail with exercises
- [x] Exercises removed from GET /lessons/:id response
- [x] Mobile wizard has only content + vocab + grammar steps (no exercises)
- [x] Prompt dialog "Bắt đầu bài tập?" appears on last wizard page
- [x] ExerciseTierScreen displays basic tier (others locked)
- [x] ExercisePlayScreen: one question at a time, no timer, immediate feedback, summary
- [x] Existing exercise submission still works through new flow
- [x] Unit tests for ExerciseSet service (CRUD, unique constraint)
- [x] Lint + typecheck pass

## Blocked by

None — can start immediately

## Implementation notes

### Files created

- `backend/src/common/enums/exercise-tier.enum.ts` — ExerciseTier enum (BASIC, EASY, MEDIUM, HARD, EXPERT)
- `backend/src/modules/exercises/domain/exercise-set.entity.ts` — ExerciseSet entity with all PRD fields, unique constraint, extends BaseEntity
- `backend/src/modules/exercises/application/repositories/exercise-sets.repository.ts` — ExerciseSetsRepository with CRUD + findActiveByLessonId + findByIdWithExercises
- `backend/src/modules/exercises/application/tier-progress.service.ts` — TierProgressService computing progress per set + unlockedTiers (80% boundary, sequential unlock)
- `backend/src/modules/exercises/application/exercise-set.service.ts` — ExerciseSetService (findByLessonId, findById, create)
- `backend/src/modules/exercises/presentation/exercise-set.controller.ts` — ExerciseSetController with GET /exercise-sets/lesson/:lessonId and GET /exercise-sets/:id
- `backend/src/modules/exercises/application/tier-progress.service.spec.ts` — Unit tests for TierProgressService (7 tests: unlock boundaries, sequential chain, summary)
- `backend/src/modules/exercises/application/exercise-set.service.spec.ts` — Unit tests for ExerciseSetService (4 tests: CRUD, NotFoundException)
- `mobile/lib/features/lessons/domain/exercise_set_models.dart` — ExerciseTier enum, ExerciseSetModel, TierProgress, LessonTierSummary models
- `mobile/lib/features/lessons/presentation/screens/exercise_tier_screen.dart` — ExerciseTierScreen showing 5 tier cards (locked/unlocked/in-progress/completed)
- `mobile/lib/features/lessons/presentation/screens/exercise_play_screen.dart` — ExercisePlayScreen: one question at a time, no timer, immediate feedback, summary dialog

### Files modified

- `backend/src/common/enums/index.ts` — Added export for exercise-tier.enum
- `backend/src/modules/exercises/domain/exercise.entity.ts` — Added setId FK column + ManyToOne relation to ExerciseSet
- `backend/src/modules/courses/domain/lesson.entity.ts` — Added exerciseSets OneToMany relation
- `backend/src/modules/exercises/exercises.module.ts` — Added ExerciseSet entity, ExerciseSetsRepository, ExerciseSetService, TierProgressService, ExerciseSetController
- `backend/src/modules/exercises/application/repositories/exercises.repository.ts` — Added findBySetId method
- `backend/src/modules/exercises/application/repositories/user-exercise-results.repository.ts` — Added findByUserAndExerciseIds method
- `backend/src/modules/courses/application/repositories/lessons.repository.ts` — Removed 'exercises' from findById relations
- `backend/src/modules/courses/presentation/lessons.controller.ts` — Updated Swagger description (removed exercises mention)
- `backend/scripts/seed-lessons.ts` — Added exercise_sets table cleanup + auto-create BASIC set per lesson + UPDATE exercises SET set_id
- `mobile/lib/features/lessons/data/lesson_repository.dart` — Added getExerciseSetsByLesson + getExerciseSet methods
- `mobile/lib/features/lessons/data/lesson_providers.dart` — Added exerciseSetsProvider
- `mobile/lib/features/lessons/domain/lesson_models.dart` — Added hasExercises getter to LessonDetail
- `mobile/lib/features/lessons/presentation/screens/lesson_wizard_screen.dart` — Removed exercise steps, added "Bắt đầu bài tập?" prompt dialog, simplified navigation
- `mobile/lib/core/router/app_router.dart` — Added /lessons/:id/exercises and /lessons/:id/exercises/play/:tier routes

### Files deleted

None
