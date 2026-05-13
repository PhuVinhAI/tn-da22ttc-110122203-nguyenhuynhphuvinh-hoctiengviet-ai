Status: `ready-for-agent`

## What to build

Migrate ExercisePlayScreen from `setState` + direct repo calls to `ref.watch()` on Riverpod providers, and wire exercise completion to emit DataChangeBus events that propagate to stats and progress providers across the app.

### Current problem (from codebase exploration)

- ExercisePlayScreen loads exercises manually in `initState()` via `ref.read(lessonRepositoryProvider)` — does NOT use `ref.watch()` for exercise data
- Manages all play state with `setState`: `_exercises`, `_currentIndex`, `_loading`, `_error`, `_submitted`, `_submitting`, `_result`, `_submitError`, `_answers`, `_results`
- On summary "Return to tier selector": invalidates `exerciseSetsProvider` and `userProgressProvider` manually
- `exerciseStatsProvider` has no auto-refresh from exercise completion events
- `userProgressProvider` is invalidated from 8+ locations manually

### What changes

- Migrate `lessonExercisesProvider` to AsyncNotifier extending CachedRepository (ephemeral — no TTL, always fetch when DataChangeBus triggers)
- ExercisePlayScreen: use `ref.watch()` for exercise data instead of manual `_loadExercises()` in initState
- ExercisePlayScreen: keep `setState` only for pure play UI state (`_currentIndex`, `_answers`, `_results`, `_submitted`, `_submitting`)
- On exercise answer submit: emit `DataChanged(tags: {'exercise', 'lesson-$lessonId'})`
- On exercise set completion: emit `DataChanged(tags: {'progress', 'exercise', 'exercise-set', 'lesson-$lessonId'})`
- Migrate `exerciseStatsProvider` to subscribe to DataChangeBus tag `'exercise'` — auto-refetch when exercises are completed
- Migrate `userProgressProvider` to AsyncNotifier extending CachedRepository (TTL: 1 minute), subscribe to tag `'progress'` — auto-refetch
- Remove all manual `ref.invalidate(userProgressProvider)` calls from UI code (currently 8+ locations)
- Remove manual `ref.invalidate(exerciseSetsProvider)` from ExercisePlayScreen summary
- Use `@riverpod` for new providers

## Acceptance criteria

- [ ] `lessonExercisesProvider` migrated to AsyncNotifier (ephemeral, subscribes to DataChangeBus `'exercise'`)
- [ ] ExercisePlayScreen uses `ref.watch()` for exercise data — no manual `_loadExercises()` via direct repo
- [ ] ExercisePlayScreen keeps `setState` only for play UI state (answers, results, current index)
- [ ] Answer submission emits `DataChanged(tags: {'exercise', 'lesson-$lessonId'})` after API success
- [ ] Set completion emits `DataChanged(tags: {'progress', 'exercise', 'exercise-set', 'lesson-$lessonId'})` after API success
- [ ] `exerciseStatsProvider` subscribes to DataChangeBus tag `'exercise'` — auto-updates after completion
- [ ] `userProgressProvider` as AsyncNotifier extending CachedRepository (TTL: 1 min), subscribes to `'progress'`
- [ ] No manual `ref.invalidate(userProgressProvider)` calls remain in UI code
- [ ] No manual `ref.invalidate(exerciseSetsProvider)` in ExercisePlayScreen
- [ ] Unit tests for DataChangeBus event emission on exercise mutations
- [ ] End-to-end verification: complete exercise → profile stats update → home screen progress updates

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure)
- Issue 02 (CachedRepository Generic + TTL)
- Issue 05 (Exercise Tier Auto-Sync) — avoids double-fetch while both old and new patterns coexist on ExerciseTierScreen
