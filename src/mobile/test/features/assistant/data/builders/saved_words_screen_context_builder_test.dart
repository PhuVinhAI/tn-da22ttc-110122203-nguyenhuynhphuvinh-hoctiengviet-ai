import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_providers.dart';
import 'package:linvnix/features/bookmarks/domain/bookmark_models.dart';

class _StubFlashcardBookmarks extends FlashcardBookmarksNotifier {
  _StubFlashcardBookmarks(this._items);

  final List<BookmarkWithVocabulary> _items;

  @override
  Future<List<BookmarkWithVocabulary>> build() async => _items;
}

void main() {
  group('savedWordsScreenContextBuilder', () {
    test('produces savedWords context with deck summaries', () async {
      final items = [
        BookmarkWithVocabulary(
          id: 'bm-1',
          vocabularyId: 'v1',
          word: 'phở',
          translation: 'pho',
          bookmarkedAt: DateTime.utc(2026, 5, 1),
        ),
      ];

      final container = ProviderContainer(
        overrides: [
          flashcardBookmarksProvider
              .overrideWith(() => _StubFlashcardBookmarks(items)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(flashcardBookmarksProvider.future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/bookmarks/flashcard',
              location: '/bookmarks/flashcard',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'savedWords');
      expect(ctx.data['status'], 'data');
      expect(ctx.data['cardCount'], 1);

      final cards = ctx.data['cards'] as List;
      expect(cards.first, containsPair('word', 'phở'));
    });
  });
}
