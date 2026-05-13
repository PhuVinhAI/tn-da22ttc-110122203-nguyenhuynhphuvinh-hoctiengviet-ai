Status: `ready-for-agent`

## What to build

Complete the migration of all remaining `FutureProvider` instances to `AsyncNotifier` extending `CachedRepository` with appropriate TTL, remove HomeScreen's `initState()` provider invalidation pattern, and add pull-to-refresh support across all screens.

### Current problem (from codebase exploration)

- HomeScreen `initState()` uses `Future.microtask()` to invalidate 3 providers every time the tab is selected: `continueLearningProvider`, `userProgressProvider`, `coursesProvider` — forcing unnecessary API calls
- `coursesProvider` and `courseDetailProvider` are `FutureProvider` with no TTL — refetched on every watch
- `courseDetailProvider`, `moduleDetailProvider` are `FutureProvider.family` with no caching
- No pull-to-refresh mechanism beyond manual `ref.invalidate()`

### What changes

- Migrate `coursesProvider` to AsyncNotifier extending CachedRepository (TTL: 30 minutes) — no DataChangeBus subscription needed (rarely changes)
- Migrate `courseDetailProvider` to family AsyncNotifier extending CachedRepository (TTL: 30 minutes)
- Migrate `moduleDetailProvider` to family AsyncNotifier extending CachedRepository (TTL: 30 minutes)
- `userProfileProvider` subscribes to DataChangeBus tag `'auth'` — auto-refetch on login/logout
- Remove HomeScreen `initState()` invalidation — providers have TTL, `ref.watch()` returns cached data if fresh
- Remove HomeScreen `_onRefresh()` invalidation — replace with provider refresh method (respects TTL)
- Add pull-to-refresh: expose `refresh()` method on CachedRepository that forces refetch regardless of TTL
- Replace all remaining manual `ref.invalidate()` calls in auth-related screens with DataChangeBus `'auth'` event (emitted by AuthNotifier on login/logout)
- Use `@riverpod` and `@freezed` for all new/modified providers and models

## Acceptance criteria

- [ ] `coursesProvider` as AsyncNotifier extending CachedRepository (TTL: 30 min)
- [ ] `courseDetailProvider` as family AsyncNotifier extending CachedRepository (TTL: 30 min)
- [ ] `moduleDetailProvider` as family AsyncNotifier extending CachedRepository (TTL: 30 min)
- [ ] `userProfileProvider` subscribes to DataChangeBus tag `'auth'`
- [ ] HomeScreen `initState()` no longer invalidates any providers
- [ ] HomeScreen `_onRefresh()` uses provider `refresh()` method instead of `ref.invalidate()`
- [ ] CachedRepository exposes `refresh()` method that forces refetch regardless of TTL
- [ ] AuthNotifier emits `DataChanged(tags: {'auth'})` on login/logout
- [ ] No manual `ref.invalidate()` for user-related providers remains in auth screens
- [ ] Pull-to-refresh works on HomeScreen, BookmarksScreen, ProfileScreen
- [ ] No `FutureProvider` instances remain in the codebase (all migrated to AsyncNotifier)
- [ ] Unit tests for CachedRepository `refresh()` method
- [ ] End-to-end verification: open HomeScreen → no unnecessary API calls; pull-to-refresh → data refreshes

## Blocked by

- Issue 03 (Bookmark Single Source) — bookmarkStatsProvider migration
- Issue 04 (Lesson Progress + Continue Fix) — continueLearningProvider migration
- Issue 06 (Exercise Play + Stats Sync) — userProgressProvider migration
