import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../data/bookmark_repository.dart';
import '../domain/bookmark_models.dart';

final bookmarkStatsProvider = FutureProvider<BookmarkStats>((ref) {
  final repo = ref.watch(bookmarkRepositoryProvider);
  return repo.getBookmarkStats();
});

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  return BookmarkRepository(ref.watch(dioProvider));
});

class BookmarkSortNotifier extends Notifier<BookmarkSort> {
  @override
  BookmarkSort build() => BookmarkSort.newest;

  void setSort(BookmarkSort sort) => state = sort;
}

final bookmarkSortProvider = NotifierProvider<BookmarkSortNotifier, BookmarkSort>(
  BookmarkSortNotifier.new,
);

class BookmarkSearchNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setSearch(String? search) => state = search;
}

final bookmarkSearchProvider = NotifierProvider<BookmarkSearchNotifier, String?>(
  BookmarkSearchNotifier.new,
);

final bookmarksProvider = AsyncNotifierProvider<BookmarksNotifier, BookmarksPage>(
  BookmarksNotifier.new,
);

final flashcardBookmarksProvider = FutureProvider<List<BookmarkWithVocabulary>>((ref) async {
  final repo = ref.watch(bookmarkRepositoryProvider);
  final allItems = <BookmarkWithVocabulary>[];
  int page = 1;
  const limit = 50;
  while (true) {
    final result = await repo.getBookmarks(page: page, limit: limit);
    allItems.addAll(result.items);
    if (page >= result.totalPages) break;
    page++;
  }
  return allItems;
});

class BookmarksNotifier extends AsyncNotifier<BookmarksPage> {
  int _page = 1;
  bool _hasMore = true;
  static const _limit = 20;

  @override
  Future<BookmarksPage> build() async {
    _page = 1;
    _hasMore = true;
    final search = ref.watch(bookmarkSearchProvider);
    final sort = ref.watch(bookmarkSortProvider);
    return _loadPage(1, search: search, sort: sort);
  }

  Future<BookmarksPage> _loadPage(
    int page, {
    String? search,
    BookmarkSort sort = BookmarkSort.newest,
  }) async {
    final repo = ref.read(bookmarkRepositoryProvider);
    return repo.getBookmarks(page: page, limit: _limit, search: search, sort: sort);
  }

  Future<void> loadMore() async {
    if (!_hasMore) return;
    final current = state.value;
    if (current == null) return;

    try {
      final search = ref.read(bookmarkSearchProvider);
      final sort = ref.read(bookmarkSortProvider);
      final nextPage = await _loadPage(_page + 1, search: search, sort: sort);
      _page++;
      _hasMore = nextPage.items.length >= _limit;
      state = AsyncData(BookmarksPage(
        items: [...current.items, ...nextPage.items],
        page: nextPage.page,
        limit: nextPage.limit,
        totalPages: nextPage.totalPages,
        totalItems: nextPage.totalItems,
      ));
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }

  Future<bool> toggleBookmark(String vocabularyId) async {
    final repo = ref.read(bookmarkRepositoryProvider);
    final isBookmarked = await repo.toggleBookmark(vocabularyId);
    ref.invalidate(bookmarkStatsProvider);
    if (!isBookmarked) {
      final current = state.value;
      if (current != null) {
        final updatedItems = current.items.where((i) => i.vocabularyId != vocabularyId).toList();
        state = AsyncData(BookmarksPage(
          items: updatedItems,
          page: current.page,
          limit: current.limit,
          totalPages: current.totalPages,
          totalItems: current.totalItems - 1,
        ));
      }
    }
    return isBookmarked;
  }
}
