Status: `ready-for-agent`

## What to build

Migrate exercise tier provider and ExerciseTierScreen from manual `ref.invalidate()` to auto-invalidation via DataChangeBus. When exercises are generated, deleted, or regenerated, the tier selector screen updates automatically without manual invalidation calls.

### Current problem (from codebase exploration)

- `ExerciseTierScreen` calls `ref.invalidate(exerciseSetsProvider(widget.lessonId))` in 5 separate places (after generate, delete, regenerate, create custom)
- Heavy `setState` for local UI state: `_generatingTier`, `_generationError`, `_newlyUnlockedTier`, `_isCreatingCustom`, `_busyCustomSetId`
- `moduleTierSummariesProvider` has no auto-refresh mechanism

### What changes

- Migrate `exerciseSetsProvider` from `FutureProvider.family` to family AsyncNotifier extending `CachedRepository` (TTL: 1 minute)
- Subscribe to DataChangeBus tags `'exercise-set'` and `'lesson-$lessonId'`
- Migrate `moduleTierSummariesProvider` to AsyncNotifier extending CachedRepository, subscribe to tag `'exercise-set'`
- ExerciseTierScreen: remove all 5 manual `ref.invalidate()` calls — provider auto-invalidates via DataChangeBus
- ExerciseTierScreen: migrate `setState` async data management to `ref.watch()` — keep `setState` only for pure UI state (generating animation, custom form input)
- Generate/delete/regenerate/create-custom mutations emit `DataChanged(tags: {'exercise-set', 'lesson-$lessonId'})` after API success
- Use `@riverpod` for new providers

## Acceptance criteria

- [ ] `exerciseSetsProvider` as family AsyncNotifier extending CachedRepository (TTL: 1 min)
- [ ] `exerciseSetsProvider` subscribes to DataChangeBus tags `'exercise-set'` and `'lesson-$lessonId'`
- [ ] `moduleTierSummariesProvider` subscribes to DataChangeBus tag `'exercise-set'`
- [ ] ExerciseTierScreen uses `ref.watch()` for exercise set data — no manual `ref.invalidate()` for exerciseSetsProvider
- [ ] Generate/delete/regenerate/create-custom mutations emit appropriate DataChangeBus tags after API success
- [ ] ExerciseTierScreen keeps `setState` only for pure UI state (generating animation, form input)
- [ ] No `ref.invalidate(exerciseSetsProvider(...))` calls remain in ExerciseTierScreen
- [ ] Unit tests for exerciseSetsProvider DataChangeBus subscription
- [ ] End-to-end verification: generate tier in ExerciseTierScreen → tier appears immediately

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure)
- Issue 02 (CachedRepository Generic + TTL)
