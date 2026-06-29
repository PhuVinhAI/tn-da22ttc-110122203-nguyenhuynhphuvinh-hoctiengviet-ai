import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import '../saved_words_view_state_provider.dart';
import 'bookmark_context_summaries.dart';
import 'course_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/bookmarks/flashcard`. Pulls the full saved
/// words deck from `flashcardBookmarksProvider`, plus the current card index
/// and flip side from `savedWordsViewStateProvider` (which the flashcard
/// screen pushes to as the learner swipes/flips). The assistant can then
/// answer "what does this word mean?" against the right card.
ScreenContext savedWordsScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final bookmarksAsync = ref.watch(flashcardBookmarksProvider);
  final view = ref.watch(savedWordsViewStateProvider);
  final status = asyncLoadStatus(bookmarksAsync);

  final profileAsync = ref.watch(userProfileProvider);
  final preferredDialect = profileAsync.value?.preferredDialect;

  final data = <String, dynamic>{
    'screenType': 'savedWords',
    'status': status,
    'isFlipped': view.isFlipped,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(bookmarksAsync.error);
    data['cardCount'] = 0;
    data['cards'] = const <Map<String, dynamic>>[];
    data['isEmpty'] = true;
  } else if (status == 'loading') {
    data['cardCount'] = 0;
    data['cards'] = const <Map<String, dynamic>>[];
    data['isEmpty'] = false;
  } else {
    final cards = bookmarksAsync.requireValue;
    final clamped = cards.isEmpty
        ? 0
        : view.currentIndex.clamp(0, cards.length - 1);
    data['cardCount'] = cards.length;
    data['isEmpty'] = cards.isEmpty;
    data['currentIndex'] = clamped;
    data['cards'] = cards
        .map(
          (b) => bookmarkContextSummary(
            b,
            preferredDialect: preferredDialect,
            // Flashcard back exposes example, classifier, etc. — include
            // them in the snapshot so the assistant can talk about whatever
            // face the learner is currently looking at.
            includeStudyDetails: true,
          ),
        )
        .toList(growable: false);
    if (cards.isNotEmpty) {
      data['currentCard'] = bookmarkContextSummary(
        cards[clamped],
        preferredDialect: preferredDialect,
        includeStudyDetails: true,
      );
    }
  }

  return ScreenContext(
    route: match.location,
    displayName: s.assistantFlashcardTitle,
    barPlaceholder: s.assistantFlashcardPlaceholder,
    data: data,
  );
}
