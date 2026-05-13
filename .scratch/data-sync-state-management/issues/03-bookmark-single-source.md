Status: `ready-for-agent`

## What to build

Unify the three fragmented bookmark state sources (VocabularyStepWidget's local Set, BookmarksNotifier, and server) into a single `bookmarkIdsProvider` that all screens watch. When a user toggles a bookmark in any screen, all other screens reflect the change immediately via DataChangeBus propagation.

### Current problem (from codebase exploration)

- `VocabularyStepWidget` builds a local `Set<String> _bookmarkedIds` from vocab data, calls `bookmarkRepositoryProvider` directly to toggle — bypasses `BookmarksNotifier` entirely, does NOT invalidate `bookmarksProvider` or `bookmarkStatsProvider`
- `BookmarksScreen` toggles via `BookmarksNotifier.toggleBookmark()`, which calls repo then invalidates `bookmarkStatsProvider` and manually removes from local state
- Neither path notifies the other — toggling in lesson doesn't refresh bookmarks list, and vice versa

### What changes

- Create `bookmarkIdsProvider` (`AsyncNotifierProvider<BookmarkIdsNotifier, Set<String>>`) extending `CachedRepository<Set<String>>`
- `toggle(vocabularyId)`: optimistic add/remove → API → reconcile → emit `DataChanged(tags: {'bookmark', 'vocabulary-$id'})`
- `VocabularyStepWidget`: replace local `_bookmarkedIds` Set + raw repo call → `ref.watch(bookmarkIdsProvider)` + `ref.read(bookmarkIdsProvider.notifier).toggle()`
- `BookmarksScreen`: use `bookmarkIdsProvider` for `isBookmarked` checks; simplify `BookmarksNotifier` to thin wrapper that also watches `bookmarkIdsProvider`
- `BookmarkIconButton`: parent widgets pass `isBookmarked` from `bookmarkIdsProvider` watch
- `bookmarkStatsProvider`: subscribe to DataChangeBus tag `'bookmark'` for auto-invalidation
- `bookmarksProvider`: subscribe to DataChangeBus tag `'bookmark'` for auto-invalidation
- `flashcardBookmarksProvider`: subscribe to DataChangeBus tag `'bookmark'` for auto-invalidation
- Remove all manual `ref.invalidate(bookmarkStatsProvider)` and `ref.invalidate(bookmarksProvider)` calls from UI code

## Acceptance criteria

- [ ] `bookmarkIdsProvider` with `toggle(vocabularyId)` method, extending CachedRepository
- [ ] Toggle emits `DataChanged(tags: {'bookmark', 'vocabulary-$id'})` on API success
- [ ] VocabularyStepWidget uses `ref.watch(bookmarkIdsProvider)` — no local `_bookmarkedIds` Set
- [ ] BookmarksScreen uses `bookmarkIdsProvider` for `isBookmarked` state
- [ ] BookmarksNotifier simplified to thin wrapper around `bookmarkIdsProvider`
- [ ] `bookmarkStatsProvider` auto-invalidates via DataChangeBus tag `'bookmark'`
- [ ] `bookmarksProvider` auto-invalidates via DataChangeBus tag `'bookmark'`
- [ ] `flashcardBookmarksProvider` auto-invalidates via DataChangeBus tag `'bookmark'`
- [ ] No manual `ref.invalidate()` for bookmark-related providers remains in UI code
- [ ] Unit test: toggle adds ID when not present, optimistic update visible immediately
- [ ] Unit test: toggle removes ID when present
- [ ] Unit test: API failure reverts toggle to previous state
- [ ] Unit test: `DataChanged` event emitted on success only
- [ ] End-to-end verification: toggle bookmark in lesson → BookmarksScreen updates without restart

## Blocked by

- Issue 01 (DataChangeBus + Event Infrastructure)
- Issue 02 (CachedRepository Generic + TTL)
