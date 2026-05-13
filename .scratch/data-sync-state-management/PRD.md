# PRD: Hệ thống Đồng bộ Dữ liệu & Quản lý Trạng thái Flutter

Status: `ready-for-agent`

## Problem Statement

Người học gặp 2 vấn đề nghiêm trọng trên app Flutter:

1. **Dữ liệu không đồng bộ giữa các screen:** Khi thêm/xóa bookmark trong lesson, màn hình Bookmarks không cập nhật. Thống kê profile không đổi khi hoàn thành bài tập. Exercise tier (easy/medium/hard/expert) không cập nhật ngay khi generate. Phải thoát app vào lại mới thấy thay đổi.

2. **Trạng thái rối nùi và không ổn định:** Nút "Continue lesson" không hoạt động khi quay lại từ ExerciseTierScreen. Lesson progress không cập nhật đúng. 91 `setState()` call quản lý async data thay vì Riverpod. 36 `ref.invalidate()` rải rác, HomeScreen invalidate 3 provider mỗi lần vào tab. Bookmark state tồn tại ở 3 nguồn riêng biệt (local Set, BookmarksNotifier, server) — không đồng bộ.

Gốc rễ: không có cơ chế propagation thống nhất, không có single-source-of-truth cho state chia sẻ, và các screen tự quản lý data/loading/error bằng setState thay vì Riverpod provider.

## Solution

Xây dựng 2 hệ thống tích hợp trên nền tảng Riverpod in-memory + backend Redis (không local DB):

1. **Hệ thống đồng bộ dữ liệu:** Mọi mutation (toggle bookmark, complete exercise, generate tier) lan truyền tự động qua `DataChangeBus` — một Riverpod-native tagged event bus. Mỗi provider đăng ký tag filter, tự invalidate khi nhận event liên quan. Không còn `ref.invalidate()` thủ công từ UI.

2. **Hệ thống quản lý trạng thái:** Migrate toàn bộ `setState()` quản lý async data sang `AsyncNotifier` dùng generic `CachedRepository<T>` với TTL in-memory. Cache-first: trả data ngay nếu chưa hết TTL, refetch nếu quá. Optimistic write + API reconcile cho mutation.

## User Stories

1. As a learner, I want to see my bookmark added in the lesson immediately reflected in the Bookmarks screen, so that I don't have to restart the app to find my saved words
2. As a learner, I want to see my bookmark removed in the Bookmarks screen immediately reflected in the lesson, so that the bookmark icon stays accurate
3. As a learner, I want to see my exercise stats update immediately after completing an exercise set, so that my profile reflects my progress in real-time
4. As a learner, I want to see the "Continue learning" card update immediately after completing any lesson activity, so that I always know where to resume
5. As a learner, I want newly generated exercise tiers to appear immediately in the tier selector, so that I don't have to navigate away and back
6. As a learner, I want deleted custom practice sets to disappear immediately from the tier selector, so that the list stays clean
7. As a learner, I want regenerated exercise sets to show fresh questions immediately, so that I can practice new content without delay
8. As a learner, I want the "Continue" button in LessonWizardScreen to work correctly when returning from ExerciseTierScreen, so that I can proceed to exercises after viewing content
9. As a learner, I want my lesson progress to be accurate when navigating between screens, so that I see the correct status everywhere
10. As a learner, I want to resume an exercise set exactly where I left off if I close the app mid-session, so that I don't lose my answers and results
11. As a learner, I want my exercise answers preserved when I temporarily navigate away (e.g. check a notification), so that I can continue seamlessly
12. As a learner, I want to see loading states properly managed (no flicker between loading/data/error), so that the UI feels stable
13. As a learner, I want pull-to-refresh to work on all screens, so that I can manually refresh data when I suspect it's stale
14. As a learner, I want bookmark stats to update immediately after toggling a bookmark, so that the count is always correct
15. As a learner, I want tier progress to update immediately after submitting exercise answers, so that I see my completion percentage change
16. As a learner, I want the Home screen to show fresh data without needing to switch tabs, so that I see updates from other activities
17. As a developer, I want all async data managed through Riverpod providers (not setState), so that state is predictable and testable
18. As a developer, I want a single source of truth for bookmark status across all screens, so that I never have inconsistent bookmark state
19. As a developer, I want a generic CachedRepository pattern that handles TTL, cache-first reads, and optimistic writes, so that I don't repeat boilerplate for every entity
20. As a developer, I want a tagged event bus for mutation propagation, so that providers auto-invalidate without manual ref.invalidate() calls from UI code
21. As a developer, I want TTL per entity type, so that rarely-changing data (courses) doesn't re-fetch unnecessarily while volatile data (progress) stays fresh
22. As a developer, I want optimistic UI updates with API reconcile, so that users see instant feedback and data stays consistent with the server
23. As a developer, I want exercise session state persisted in Hive, so that resume works across app restarts
24. As a developer, I want freezed for models and riverpod_generator for providers, so that boilerplate is reduced and types are safer
25. As a developer, I want the DataChangeBus to emit events only after API success, so that ephemeral providers don't refetch on failed mutations
26. As a developer, I want each AsyncNotifier to auto-subscribe to relevant DataChangeBus tags, so that cross-screen sync happens without manual wiring
27. As a developer, I want CachedRepository to handle revert on API failure, so that optimistic updates roll back cleanly
28. As a developer, I want exercise session cleanup when a set is completed, so that stale sessions don't accumulate in Hive
29. As a developer, I want bookmark toggle to use a single bookmarkIdsProvider, so that all consumers (VocabularyStepWidget, BookmarksScreen, BookmarkIconButton) read from the same source
30. As a developer, I want lessonProgressProvider to auto-update when progress changes occur anywhere in the app, so that LessonWizardScreen shows correct state on return
31. As a developer, I want continueLearningProvider to respond to progress change events, so that the Home screen "Continue learning" card is always current
32. As a developer, I want the Home screen to stop invalidating all providers on every initState, so that unnecessary API calls are eliminated
33. As a developer, I want the DataChangeBus tag system to be extensible, so that adding new providers or mutations doesn't require creating new event types

## Implementation Decisions

### Architecture: Riverpod In-Memory + Backend Redis (No Local DB)

- No SQLite/Drift in the Flutter app. Backend Redis serves as the cache layer. Riverpod AsyncNotifier holds data in-memory with TTL timestamps.
- Rationale: one database (backend), not two. Simpler mental model, no schema migrations in Flutter, no DAOs.

### Data Flow: Cache-First + TTL

- When a screen opens and a provider has data:
  - If `lastFetchedAt + ttl > now` → return cached data immediately
  - If `lastFetchedAt + ttl <= now` → fetch from API, update state, reset `lastFetchedAt`
- If provider has no data → always fetch from API

### TTL Values Per Entity Type

| Entity | TTL | Rationale |
|---|---|---|
| Course, CourseModule | 30 minutes | Static content, rarely changes |
| LessonDetail | 10 minutes | Content rarely changes |
| LessonVocabulary | 5 minutes | isBookmarked flag changes |
| BookmarkWithVocabulary | 2 minutes | User adds/removes frequently |
| UserProgress | 1 minute | Changes constantly during learning |
| ExerciseSet / TierProgress | 1 minute | Changes on generate/submit |
| ExerciseStats | No TTL (ephemeral) | Always fetch when EventBus triggers |
| ContinueLearning | No TTL (ephemeral) | Always fetch when EventBus triggers |
| BookmarkStats | No TTL (ephemeral) | Always fetch when EventBus triggers |
| LessonTierSummary | No TTL (ephemeral) | Always fetch when EventBus triggers |

Note: when a mutation occurs (optimistic + reconcile), the state is updated immediately regardless of TTL. TTL only controls automatic re-fetch on screen open.

### Mutation Propagation: DataChangeBus (Tagged Events)

- Single `StateNotifierProvider<DataChangeBus, DataChanged?>`
- Event shape: `DataChanged(tags: Set<String>)`
- Example tags: `'bookmark'`, `'vocabulary-$id'`, `'progress'`, `'lesson-$lessonId'`, `'exercise'`, `'exercise-set'`
- Ephemeral providers subscribe by filtering tags in their `build()` method
- Events are emitted **only after API success + reconcile** (not on optimistic write) — this prevents ephemeral providers from refetching on failed mutations
- Persistent providers update instantly via optimistic state change (no event needed — they already have new data in their Notifier state)

### Write Path: Optimistic + API Reconcile

1. Save snapshot of current state (`prevState`)
2. Update AsyncNotifier state immediately (optimistic) → UI reflects change instantly
3. Call API
4. On success: overwrite state with API response (reconcile), emit `DataChanged(tags)` via DataChangeBus
5. On failure: restore `prevState`, show error toast

### Provider Architecture: Generic CachedRepository\<T\>

Abstract class that encapsulates:
- `TTL` duration (configurable per entity)
- `fetchFromApi()` — abstract method, implemented per entity
- `lastFetchedAt` timestamp tracking
- `build()` — returns current state, checks TTL, calls `fetchFromApi()` if expired
- `mutate()` — optimistic write + API call + reconcile pattern
- `watch()` — Riverpod provider watch semantics

Each entity provider extends CachedRepository and implements `fetchFromApi()`.

### Bookmark Single Source: bookmarkIdsProvider

- `AsyncNotifierProvider<BookmarkIdsNotifier, Set<String>>` — holds set of bookmarked vocabulary IDs
- VocabularyStepWidget, BookmarksScreen, BookmarkIconButton all `ref.watch(bookmarkIdsProvider)` to determine isBookmarked
- Toggle: `bookmarkIdsProvider.notifier.toggle(vocabularyId)` → optimistic add/remove from Set → API → reconcile → emit `DataChanged(tags: {'bookmark', 'vocabulary-$id'})`
- Eliminates 3 separate bookmark state sources (local Set, BookmarksNotifier, server)

### Exercise Session Resume: Hive

- Hive box `exercise_sessions`, key = `setId`
- Value: JSON `{lessonId, tier, currentIndex, answers: Map<int, dynamic>, results: Map<int, Map>, exercises: List, createdAt, updatedAt}`
- ExercisePlayScreen: on init → check Hive for existing session → if found, restore state (currentIndex, answers, results)
- On each answer submit → update Hive entry
- On session complete or user explicitly exits → delete Hive entry
- Hive chosen over SharedPreferences because it handles Map/List natively without manual encode/decode

### Continue Lesson Bug Fix

- Root cause: LessonWizardScreen manages data via `setState` in `initState()`. When user pops back from ExerciseTierScreen, `initState()` doesn't re-run, so lesson progress state is stale.
- Fix: `lessonProgressProvider` becomes an AsyncNotifier that subscribes to DataChangeBus tags `'progress'` and `'lesson-$lessonId'`. When ExercisePlayScreen completes and emits `DataChanged(tags: {'progress', 'lesson-$lessonId'})`, the provider auto-refetches. LessonWizardScreen watches `lessonProgressProvider` and reflects new state.

### HomeScreen Invalidate Removal

- Current: `initState()` calls `ref.invalidate()` on 3 providers every time Home tab is selected → 3 unnecessary API calls
- Fix: providers have TTL. HomeScreen simply `ref.watch()` — data returns from cache if fresh, refetches if stale. No manual invalidation.

### Big Bang Migration

- All screens currently using `setState` for async data (loading/data/error) migrate to `ref.watch(asyncNotifierProvider)` simultaneously
- Target screens: LessonWizardScreen, ExercisePlayScreen, ExerciseTierScreen, and any others
- Pure UI state (currentPage, animation state) remains as `setState` — only async data management migrates

### Code Generation Adoption

- Use `@freezed` for all domain models (already declared in pubspec.yaml but unused)
- Use `@riverpod` annotation for providers (already declared but unused)
- Reduces boilerplate, provides `copyWith`, `==`, `toString` for free

### Deep Modules

1. **DataChangeBus** — encapsulates event emission and tag-based subscription. Interface: `emit(tags)`, `watch(tags) → Stream`. Testable in isolation by emitting events and verifying subscribers react.
2. **CachedRepository\<T\>** — encapsulates TTL, cache-first, optimistic write, reconcile, revert. Interface: `fetchFromApi()`, `ttl`, `build()`, `mutate()`. Testable with mock API.
3. **ExerciseSessionService** — encapsulates Hive save/load/delete for exercise sessions. Interface: `save(session)`, `load(setId)`, `delete(setId)`. Testable with mock Hive box.
4. **BookmarkIdsNotifier** — encapsulates single-source bookmark set + toggle + API integration. Interface: `toggle(vocabularyId)`, `build()`. Testable with mock repository.

### Implementation Phases

**Phase 1: DataChangeBus + Event Infrastructure**
- Create `DataChangeBus` StateNotifierProvider
- Define `DataChanged` event model with tags
- Create tag subscription utility for providers
- Unit tests for emission and tag matching

**Phase 2: CachedRepository Generic + TTL**
- Create abstract `CachedRepository<T>` with TTL, cache-first, optimistic write, reconcile
- Implement `fetchFromApi()` abstract method pattern
- Unit tests for TTL logic, optimistic write, reconcile, revert

**Phase 3: Big Bang Provider + Screen Migration**
- Migrate all FutureProvider → AsyncNotifier extending CachedRepository
- Migrate all setState async data → ref.watch()
- Create `bookmarkIdsProvider` single source
- Wire DataChangeBus subscriptions into all providers
- Remove all manual `ref.invalidate()` from UI code
- Remove HomeScreen initState invalidation
- Fix LessonWizardScreen continue button (watch lessonProgressProvider)
- Fix ExerciseTierScreen (watch exerciseSetsProvider)
- Fix ExercisePlayScreen (watch lessonExercisesProvider)

**Phase 4: Hive Session + BookmarkIds + Code Gen**
- Create ExerciseSessionService with Hive
- Wire session save/resume into ExercisePlayScreen
- Adopt @freezed for domain models
- Adopt @riverpod for provider generation
- Integration tests: mutation → event → provider update

### DataChangeBus Tag Vocabulary

| Mutation | Tags emitted |
|---|---|
| Toggle bookmark | `{'bookmark', 'vocabulary-$vocabularyId'}` |
| Complete exercise set | `{'progress', 'exercise', 'exercise-set', 'lesson-$lessonId'}` |
| Generate exercises for tier | `{'exercise-set', 'lesson-$lessonId'}` |
| Delete custom exercise set | `{'exercise-set', 'lesson-$lessonId'}` |
| Regenerate exercises | `{'exercise-set', 'lesson-$lessonId'}` |
| Create custom exercise set | `{'exercise-set', 'lesson-$lessonId'}` |
| Submit exercise answer | `{'exercise', 'lesson-$lessonId'}` |
| Start lesson | `{'progress', 'lesson-$lessonId'}` |
| Complete lesson | `{'progress', 'lesson-$lessonId'}` |
| Mark content viewed | `{'progress', 'lesson-$lessonId'}` |
| Login | `{'auth'}` |
| Logout | `{'auth'}` |

### Provider → Tag Subscription Map

| Provider | Subscribed tags |
|---|---|
| `exerciseStatsProvider` | `'exercise'` |
| `continueLearningProvider` | `'progress'` |
| `bookmarkStatsProvider` | `'bookmark'` |
| `bookmarksProvider` | `'bookmark'` |
| `flashcardBookmarksProvider` | `'bookmark'` |
| `exerciseSetsProvider(lessonId)` | `'exercise-set'`, `'lesson-$lessonId'` |
| `moduleTierSummariesProvider(moduleId)` | `'exercise-set'` |
| `lessonProgressProvider(lessonId)` | `'progress'`, `'lesson-$lessonId'` |
| `userProgressProvider` | `'progress'` |
| `userProfileProvider` | `'auth'` |
| `coursesProvider` | (none — 30min TTL, rarely changes) |
| `courseDetailProvider` | (none — 30min TTL, rarely changes) |

## Testing Decisions

### What makes a good test

- Test external behavior (inputs → outputs), not implementation details
- For CachedRepository: test TTL expiry triggers refetch, optimistic write updates state, reconcile overwrites with API response, revert restores snapshot on failure
- For DataChangeBus: test that emitting tags triggers only subscribers with matching tags
- For BookmarkIdsNotifier: test toggle adds/removes from set, API failure reverts
- For ExerciseSessionService: test save/load/delete cycle, resume restores exact state
- Mock: API repositories, Hive box. Do NOT mock Riverpod internals.

### Modules to test

1. **DataChangeBus** — emission, tag matching, subscriber notification
   - Emit event with tags → verify only matching subscribers invalidate
   - Emit event with no matching tags → verify no subscriber reacts
   - Multiple emissions → verify all are processed

2. **CachedRepository\<T\>** — TTL, cache-first, optimistic, reconcile, revert
   - Fresh provider (no data) → always fetches from API
   - Data within TTL → returns cached, no API call
   - Data past TTL → refetches from API
   - Optimistic write → state updates immediately
   - API success → state reconciled with response
   - API failure → state reverted to snapshot, error available

3. **BookmarkIdsNotifier** — single source bookmark truth
   - Toggle adds ID when not present
   - Toggle removes ID when present
   - API failure reverts toggle
   - DataChanged event emitted on success

4. **ExerciseSessionService** — Hive session persistence
   - Save session → load returns same state
   - Delete session → load returns null
   - Partial session (some answers) → load preserves partial state

### Prior art

- Flutter unit tests follow `*_test.dart` pattern in `test/` directory
- Existing Riverpod provider tests mock repositories
- No existing tests for the current providers (all are untested FutureProviders)

## Out of Scope

- Offline mode / connectivity-aware caching — requires local DB, deferred
- Push-based real-time sync (WebSocket/SSE) — current HTTP + event bus is sufficient
- Admin panel changes — backend API contracts unchanged
- New API endpoints — only Flutter-side changes
- Backend Redis cache configuration changes — backend already has Redis
- Audio/Video/Dialogue placeholder widgets — unrelated to state management
- TokenRefreshInterceptor request queuing — separate issue
- AudioPlayerService resource leak — separate issue
- `_getLevelColor()` code duplication — separate refactor
- FlashcardScreen side effects in build() — separate fix
- Local DB (Drift/SQLite) — explicitly rejected in favor of single database (backend)

## Further Notes

- The `freezed` and `riverpod_generator` packages are already declared in `pubspec.yaml` but completely unused. Big bang migration is the right time to adopt them — every model and provider will be rewritten anyway.
- The `hive` and `hive_flutter` packages will need to be added to `pubspec.yaml`.
- The `connectivity_plus` package is declared but unused — it may be useful later for offline detection but is out of scope here.
- Current `ExerciseSubmissionResult` has a `nextTierUnlocked` field from the backend — this drives the unlock animation in ExercisePlayScreen. The DataChangeBus tags for exercise submission include `'exercise-set'` which ensures ExerciseTierScreen refreshes its tier data when a new tier is unlocked.
- The existing `BookmarksNotifier` (AsyncNotifier) will be simplified to a thin wrapper around `bookmarkIdsProvider` — no more separate bookmark list state management.
- All 91 `setState()` calls for async data will be removed. Pure UI state `setState()` calls (page index, animation state, form input) remain.
- The `CachedRepository` pattern means adding a new entity type requires: (1) implement `fetchFromApi()`, (2) set TTL, (3) add DataChangeBus tag subscription if ephemeral. Three steps, no boilerplate.
