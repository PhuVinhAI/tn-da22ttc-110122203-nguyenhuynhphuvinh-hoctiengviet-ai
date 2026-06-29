import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_providers.dart';
import 'package:linvnix/features/bookmarks/domain/bookmark_models.dart';

class _StubBookmarks extends BookmarksNotifier {
  _StubBookmarks(this._page);

  final BookmarksPage _page;

  @override
  Future<BookmarksPage> build() async => _page;
}

BookmarkWithVocabulary _sampleBookmark({
  required String vocabularyId,
  required String word,
}) {
  return BookmarkWithVocabulary(
    id: 'bm-$vocabularyId',
    vocabularyId: vocabularyId,
    word: word,
    translation: 'translation of $word',
    partOfSpeech: 'noun',
    bookmarkedAt: DateTime.utc(2026, 5, 1),
  );
}

void main() {
  group('bookmarksScreenContextBuilder', () {
    test('produces bookmarksList context with compact entries', () async {
      final page = BookmarksPage(
        items: [
          _sampleBookmark(vocabularyId: 'v1', word: 'xin chào'),
          _sampleBookmark(vocabularyId: 'v2', word: 'cảm ơn'),
        ],
        page: 1,
        limit: 20,
        totalPages: 1,
        totalItems: 2,
      );

      final container = ProviderContainer(
        overrides: [
          bookmarksProvider.overrideWith(() => _StubBookmarks(page)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(bookmarksProvider.future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/bookmarks',
              location: '/bookmarks',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'bookmarksList');
      expect(ctx.data['status'], 'data');
      expect(ctx.data['loadedCount'], 2);
      expect(ctx.data['totalItems'], 2);
      expect(ctx.data['sort'], 'newest');

      final bookmarks = ctx.data['bookmarks'] as List;
      expect(bookmarks, hasLength(2));
      expect(bookmarks.first, containsPair('word', 'xin chào'));
    });

    test('returns loading snapshot with empty bookmarks', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/bookmarks',
              location: '/bookmarks',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'bookmarksList');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data['bookmarks'], isEmpty);
    });
  });
}
