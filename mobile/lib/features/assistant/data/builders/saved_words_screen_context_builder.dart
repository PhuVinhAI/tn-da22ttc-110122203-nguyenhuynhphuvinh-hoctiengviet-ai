import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'bookmark_context_summaries.dart';
import 'course_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/bookmarks/saved-words`. Pulls the full
/// saved words deck from `flashcardBookmarksProvider` so the AI can help with
/// review even though the current card index lives only in widget state.
ScreenContext savedWordsScreenContextBuilder(Ref ref, RouteMatch match) {
  final bookmarksAsync = ref.watch(flashcardBookmarksProvider);
  final status = asyncLoadStatus(bookmarksAsync);

  final profileAsync = ref.watch(userProfileProvider);
  final preferredDialect = profileAsync.value?.preferredDialect;

  final data = <String, dynamic>{
    'screenType': 'savedWords',
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(bookmarksAsync.error);
    data['cardCount'] = 0;
    data['cards'] = const <Map<String, dynamic>>[];
  } else if (status == 'loading') {
    data['cardCount'] = 0;
    data['cards'] = const <Map<String, dynamic>>[];
  } else {
    final cards = bookmarksAsync.requireValue;
    data['cardCount'] = cards.length;
    data['cards'] = cards
        .map((b) => bookmarkContextSummary(b, preferredDialect: preferredDialect))
        .toList(growable: false);
  }

  return ScreenContext(
    route: match.location,
    displayName: 'Saved Words',
    barPlaceholder: 'Ask about saved words?',
    data: data,
  );
}
