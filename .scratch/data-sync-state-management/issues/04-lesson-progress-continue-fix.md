Status: `ready-for-agent`

## What to build

Migrate lesson progress from `setState` + direct repo calls to an `AsyncNotifier` extending `CachedRepository`, and fix the "Continue lesson" button bug in LessonWizardScreen. When a user returns from ExerciseTierScreen, lesson progress should auto-update because the provider subscribes to DataChangeBus tags and refetches on relevant mutations.

### Current problem (from codebase exploration)

- `LessonWizardScreen` makes 3 sequential repo calls in `initState()` (`getLessonDetail`, `getVocabulariesByLesson`, `getLessonProgress`) storing results in local `setState` variables (`_loading`, `_error`, `_lesson`, `_steps`)
- When user pops back from ExerciseTierScreen, `initState()` doesn't re-run → lesson progress state is stale → "Continue" button shows wrong state
- Lesson progress is a `FutureProvider.family` with no auto-refresh mechanism

### What changes

- Migrate `lessonProgressProvider` from `FutureProvider.family` to `AsyncNotifier` extending `CachedRepository` (TTL: 1 minute)
- Subscribe to DataChangeBus tags `'progress'` and `'lesson-$lessonId'` — auto-refetch when exercises are completed or lesson progress changes
- Migrate `lessonDetailProvider` to `AsyncNotifier` extending `CachedRepository` (TTL: 10 minutes)
- Migrate `lessonVocabulariesProvider` to `AsyncNotifier` extending `CachedRepository` (TTL: 5 minutes) — shorter TTL because `isBookmarked` flag changes
- Migrate `LessonWizardScreen` from `setState` + direct repo calls → `ref.watch()` on the three providers
- The continue/resume logic checks `lessonProgressProvider` state (which auto-updates via DataChangeBus)
- `continueLearningProvider` subscribes to DataChangeBus tag `'progress'` — auto-refetch when any progress changes
- Use `@riverpod` and `@freezed` for new provider and model code

## Acceptance criteria

- [ ] `lessonProgressProvider` as family AsyncNotifier extending CachedRepository (TTL: 1 min)
- [ ] `lessonProgressProvider` subscribes to DataChangeBus tags `'progress'` and `'lesson-$lessonId'`
- [ ] `lessonDetailProvider` migrated to AsyncNotifier extending CachedRepository (TTL: 10 min)
- [ ] `lessonVocabulariesProvider` migrated to AsyncNotifier extending CachedRepository (TTL: 5 min)
- [ ] `continueLearningProvider` subscribes to DataChangeBus tag `'progress'`
- [ ] LessonWizardScreen uses `ref.watch()` for all three providers — no `setState` for async data
- [ ] Continue button works correctly when returning from ExerciseTierScreen (provider auto-updated via DataChangeBus)
- [ ] Lesson start/content-reviewed/complete mutations emit appropriate DataChangeBus tags (`{'progress', 'lesson-$lessonId'}`)
- [ ] Unit tests for lessonProgressProvider TTL and DataChangeBus subscription
- [ ] End-to-end verification: complete exercise → return to lesson → progress state is current

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure)
- Issue 02 (CachedRepository Generic + TTL)
