Status: `ready-for-agent`

## What to build

Create the abstract `CachedRepository<T>` — a generic base class that encapsulates TTL-based cache-first reads, optimistic writes, API reconciliation, and failure revert. Every entity-specific provider in subsequent slices will extend this class instead of writing boilerplate.

### Key design decisions (from PRD)

- **TTL per entity type**: configurable duration — rarely-changing data (courses: 30min) re-fetches less often than volatile data (progress: 1min)
- **Cache-first read**: if `lastFetchedAt + ttl > now` → return cached data; if expired → fetch from API
- **Fresh provider (no data)**: always fetches from API
- **`mutate()` method**: saves snapshot → optimistic state update → API call → on success: reconcile with API response + emit DataChangeBus event → on failure: restore snapshot + show error
- **`fetchFromApi()`**: abstract method, implemented per entity
- **`build()`**: returns current state, checks TTL, calls `fetchFromApi()` if expired
- **DataChangeBus integration**: `mutate()` calls `emit()` on the bus after successful reconcile
- When a mutation occurs (optimistic + reconcile), state updates immediately regardless of TTL. TTL only controls automatic re-fetch on screen open.

### TTL reference table

| Entity | TTL |
|---|---|
| Course, CourseModule | 30 minutes |
| LessonDetail | 10 minutes |
| LessonVocabulary | 5 minutes |
| BookmarkWithVocabulary | 2 minutes |
| UserProgress | 1 minute |
| ExerciseSet / TierProgress | 1 minute |
| ExerciseStats, ContinueLearning, BookmarkStats, LessonTierSummary | No TTL (ephemeral) |

## Acceptance criteria

- [ ] Abstract `CachedRepository<T>` class with configurable TTL per entity
- [ ] `fetchFromApi()` abstract method for entity-specific implementation
- [ ] `build()` method with TTL check and cache-first logic
- [ ] `mutate()` method implementing optimistic write → API → reconcile/revert pattern
- [ ] `mutate()` emits DataChangeBus event only after API success (not on optimistic write)
- [ ] `mutate()` restores previous state snapshot on API failure
- [ ] Unit test: fresh provider → always fetches from API
- [ ] Unit test: data within TTL → returns cached, no API call
- [ ] Unit test: data past TTL → refetches from API
- [ ] Unit test: optimistic write → state updates immediately
- [ ] Unit test: API success → state reconciled with response
- [ ] Unit test: API failure → state reverted to snapshot, error available

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure) — `mutate()` needs DataChangeBus.emit()
