Status: `completed`

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

- [x] `exerciseSetsProvider` as family AsyncNotifier extending CachedRepository (TTL: 1 min)
- [x] `exerciseSetsProvider` subscribes to DataChangeBus tags `'exercise-set'` and `'lesson-$lessonId'`
- [x] `moduleTierSummariesProvider` subscribes to DataChangeBus tag `'exercise-set'`
- [x] ExerciseTierScreen uses `ref.watch()` for exercise set data — no manual `ref.invalidate()` for exerciseSetsProvider
- [x] Generate/delete/regenerate/create-custom mutations emit appropriate DataChangeBus tags after API success
- [x] ExerciseTierScreen keeps `setState` only for pure UI state (generating animation, form input)
- [x] No `ref.invalidate(exerciseSetsProvider(...))` calls remain in ExerciseTierScreen
- [x] Unit tests for exerciseSetsProvider DataChangeBus subscription
- [x] End-to-end verification: generate tier in ExerciseTierScreen → tier appears immediately

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure)
- Issue 02 (CachedRepository Generic + TTL)

## Implementation notes

### Files created

- Không có file mới nào được tạo.

### Files modified

- `mobile/lib/features/lessons/data/lesson_providers.dart` — Thay thế `exerciseSetsProvider` (FutureProvider.family) bằng `ExerciseSetsNotifier` extends `CachedRepository<LessonTierSummary>` với `DataChangeBusSubscriber` mixin, TTL 1 phút, và 4 mutation methods (`generateTier`, `regenerateSet`, `deleteSet`, `createCustomSet`) đều emit DataChangeBus tags `{'exercise-set', 'lesson-$lessonId'}` sau API success. Thay thế `moduleTierSummariesProvider` (FutureProvider.family) bằng `ModuleTierSummariesNotifier` extends `CachedRepository<Map<String, TierSummary>>` với TTL zero (ephemeral) và subscribe tag `'exercise-set'`.
- `mobile/lib/features/lessons/presentation/screens/exercise_tier_screen.dart` — Xoá tất cả 5 lệnh `ref.invalidate(exerciseSetsProvider(...))` (retry button, generate, regenerate, delete, create custom). Các mutation giờ gọi `ref.read(exerciseSetsProvider(...).notifier).xxx()` thay vì gọi repository trực tiếp. `setState` chỉ còn dùng cho pure UI state (`_generatingTier`, `_generationError`, `_newlyUnlockedTier`, `_isCreatingCustom`, `_busyCustomSetId`, `_customError`).
- `mobile/test/features/lessons/data/lesson_providers_test.dart` — Thêm 3 unit tests cho `ExerciseSetsNotifier` DataChangeBus subscription: matching tag `exercise-set`, matching tag `lesson-$lessonId`, và non-matching tag không trigger refetch.

### Files deleted

- Không có file nào bị xóa.

### Pipeline notes

- `flutter analyze` pass với 0 lỗi từ code mới.
- `flutter test test/features/lessons/data/lesson_providers_test.dart` pass 9/9 (6 tests từ issue trước + 3 tests mới).
- Full suite `flutter test` có 17 failures pre-existing trong `onboarding_screen_test.dart` và `widget_test.dart`, không liên quan đến thay đổi này.
