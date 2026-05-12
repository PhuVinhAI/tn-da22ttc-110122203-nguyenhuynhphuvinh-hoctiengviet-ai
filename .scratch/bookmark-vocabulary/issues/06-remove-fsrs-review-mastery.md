Status: done

## Parent

`.scratch/bookmark-vocabulary/PRD.md`

## What to build

Remove the entire FSRS/review/mastery system from both backend and mobile. This is cleanup — all replacement functionality (bookmark, flashcard) must already be in place.

**Backend — DELETE**:
- `modules/vocabularies/domain/user-vocabulary.entity.ts`
- `modules/vocabularies/dto/review-vocabulary.dto.ts`
- `modules/vocabularies/dto/batch-review.dto.ts`
- `modules/vocabularies/application/user-vocabularies.service.ts`
- `modules/vocabularies/application/repositories/user-vocabularies.repository.ts` (+ `.spec.ts`)
- `modules/vocabularies/application/vocabulary-review.service.ts` (+ `.spec.ts`)
- `modules/progress/application/fsrs.service.ts`
- `modules/progress/application/spaced-repetition.service.ts`
- `common/enums/mastery-level.enum.ts`
- Constants in `common/constants/index.ts`: `SPACED_REPETITION_INTERVALS`, `FSRS_CONFIG`, `MASTERY_THRESHOLDS`

**Backend — MODIFY**:
- `vocabularies.controller.ts` — remove 5 endpoints: `POST /:vocabularyId/learn`, `POST /:vocabularyId/review`, `POST /review/batch`, `GET /my-vocabularies`, `GET /due-review`
- `vocabularies.module.ts` — remove UserVocabulary entity, UserVocabulariesRepository, VocabularyReviewService providers
- `progress.module.ts` — remove UserVocabulary entity, FSRSService, SpacedRepetitionService, UserVocabulariesRepository
- `progress-transaction.service.ts` — remove `vocabularyUpdates` parameter, remove `updateMastery()` call
- `user.entity.ts` — remove `@OneToMany('UserVocabulary', 'user')` relation
- `common/constants/index.ts` — remove FSRS/mastery constants

**Mobile — DELETE**:
- Entire `features/review/` directory (11 files)

**Mobile — MODIFY**:
- `core/presentation/shell_screen.dart` — remove "Review" tab (index 2), shift to 3 tabs
- `core/router/app_router.dart` — remove `/review`, `/review/session`, `/vocabulary` routes; add `/bookmarks/flashcard`
- `features/home/` — remove DueReviewCard, remove `dueReviewCountProvider` references
- `features/lessons/presentation/widgets/vocabulary_step.dart` — verify "Learn" button already replaced (should be done by slice 02)

## Acceptance criteria

- [x] All deleted files and code removed; no remaining imports referencing deleted modules
- [x] 5 review endpoints removed from controller; no route references them
- [x] Progress module no longer depends on UserVocabulary or FSRS
- [x] Mobile Review tab removed; 3-tab bottom nav (Home, Courses, Profile)
- [x] DueReviewCard removed from Home screen
- [x] `/review`, `/review/session`, `/vocabulary` routes removed
- [x] `lint` and `typecheck` pass on both backend and mobile

## Blocked by

- `.scratch/bookmark-vocabulary/issues/02-bookmark-toggle-lesson-search.md` (Learn button must be replaced first)
- `.scratch/bookmark-vocabulary/issues/03-bookmarks-list-screen.md` (BookmarksScreen must exist to replace Review tab destination)

## Implementation notes

### Files deleted

| File | Description |
|------|-------------|
| `backend/src/modules/vocabularies/domain/user-vocabulary.entity.ts` | UserVocabulary entity (FSRS fields: stability, difficulty, state, reps, lapses, etc.) |
| `backend/src/modules/vocabularies/dto/review-vocabulary.dto.ts` | Review vocabulary DTO (orphan, unused by controller) |
| `backend/src/modules/vocabularies/dto/batch-review.dto.ts` | Batch review DTO |
| `backend/src/modules/vocabularies/application/user-vocabularies.service.ts` | UserVocabulariesService (getUserVocabularies) |
| `backend/src/modules/vocabularies/application/repositories/user-vocabularies.repository.ts` | UserVocabulariesRepository (CRUD + updateMastery) |
| `backend/src/modules/vocabularies/application/repositories/user-vocabularies.repository.spec.ts` | UserVocabulariesRepository unit tests |
| `backend/src/modules/vocabularies/application/vocabulary-review.service.ts` | VocabularyReviewService (FSRS review logic, addVocabulary, batchReview, getDueForReview) |
| `backend/src/modules/vocabularies/application/vocabulary-review.service.spec.ts` | VocabularyReviewService unit tests |
| `backend/src/modules/progress/application/fsrs.service.ts` | FSRSService (FSRS algorithm implementation) |
| `backend/src/modules/progress/application/spaced-repetition.service.ts` | SpacedRepetitionService (legacy spaced repetition) |
| `backend/src/common/enums/mastery-level.enum.ts` | MasteryLevel enum (NEW, LEARNING, FAMILIAR, MASTERED) |
| `mobile/lib/features/review/` | Entire review feature directory (10 files: screens, widgets, data, domain) |
| `mobile/lib/features/home/presentation/widgets/due_review_card.dart` | DueReviewCard widget |
| `mobile/test/features/review/` | Review feature test directory |

### Files modified

| File | Changes |
|------|---------|
| `backend/src/modules/vocabularies/presentation/vocabularies.controller.ts` | Removed UserVocabulariesService + VocabularyReviewService imports/injections; removed 5 endpoints (learn, review, batch-review, my-vocabularies, due-review) |
| `backend/src/modules/vocabularies/vocabularies.module.ts` | Removed UserVocabulary entity from TypeORM, removed UserVocabulariesService/VocabularyReviewService/UserVocabulariesRepository from providers/exports |
| `backend/src/modules/progress/progress.module.ts` | Removed UserVocabulary entity, FSRSService, SpacedRepetitionService, UserVocabulariesRepository from providers/imports/exports |
| `backend/src/modules/progress/application/progress-transaction.service.ts` | Removed UserVocabulariesRepository dependency, MasteryLevel import, vocabularyUpdates parameter, updateMastery loop |
| `backend/src/modules/users/domain/user.entity.ts` | Removed `@OneToMany('UserVocabulary', 'user') vocabularies` relation |
| `backend/src/modules/vocabularies/domain/vocabulary.entity.ts` | Removed `@OneToMany('UserVocabulary', 'vocabulary') userVocabularies` relation |
| `backend/src/common/constants/index.ts` | Removed SPACED_REPETITION_INTERVALS, FSRS_CONFIG, MASTERY_THRESHOLDS constants |
| `backend/src/common/enums/index.ts` | Removed `export * from './mastery-level.enum'` |
| `backend/src/modules/vocabularies/presentation/vocabularies.controller.spec.ts` | Removed UserVocabulariesService + VocabularyReviewService imports, mock objects, and providers |
| `backend/src/modules/progress/application/progress-transaction.service.spec.ts` | Removed UserVocabulariesRepository + MasteryLevel references, vocabularyUpdates test data, mastery update tests; simplified all test calls to 3-arg |
| `mobile/lib/core/presentation/shell_screen.dart` | Removed Review tab (NavigationDestination + route matching), changed to 3-tab nav (Home/Courses/Profile) |
| `mobile/lib/core/router/app_router.dart` | Removed review_screen + vocabulary_browser_screen imports; removed `/vocabulary`, `/review/session`, `/review` routes |
| `mobile/lib/features/home/presentation/screens/home_screen.dart` | Removed DueReviewCard widget, dueReviewCountProvider references, review_providers import |
| `mobile/lib/features/lessons/data/lesson_repository.dart` | Removed review_models import, removed `learnVocabulary()` method |
| `mobile/test/features/lessons/data/lesson_repository_test.dart` | Removed learnVocabulary test group |
| `mobile/test/widget_test.dart` | Removed Review tab assertions from bottom nav test, removed Review tab tap test |
