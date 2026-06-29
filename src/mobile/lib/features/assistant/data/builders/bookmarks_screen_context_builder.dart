import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/domain/bookmark_models.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'bookmark_context_summaries.dart';
import 'course_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/bookmarks`. Pulls the visible bookmark page,
/// active sort, source filter, and search query so the AI can answer
/// vocabulary review questions without a tool call.
ScreenContext bookmarksScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final bookmarksAsync = ref.watch(bookmarksProvider);
  final sort = ref.watch(bookmarkSortProvider);
  final search = ref.watch(bookmarkSearchProvider);
  final sourceFilter = ref.watch(bookmarkSourceFilterProvider);
  final status = asyncLoadStatus(bookmarksAsync);

  final profileAsync = ref.watch(userProfileProvider);
  final preferredDialect = profileAsync.value?.preferredDialect;

  final data = <String, dynamic>{
    'screenType': 'bookmarksList',
    'status': status,
    'sort': sort.value,
    'sourceFilter': sourceFilter.name,
    if (search != null && search.isNotEmpty) 'search': search,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(bookmarksAsync.error);
    data['loadedCount'] = 0;
    data['totalItems'] = 0;
    data['bookmarks'] = const <Map<String, dynamic>>[];
  } else if (status == 'loading') {
    data['loadedCount'] = 0;
    data['totalItems'] = 0;
    data['bookmarks'] = const <Map<String, dynamic>>[];
  } else {
    final page = bookmarksAsync.requireValue;
    // The list the user actually sees is filtered client-side by the
    // active `BookmarkSourceFilter`. Mirror that here so `loadedCount` and
    // `bookmarks` match the visible UI, and `totalItems` (server total)
    // continues to expose the unfiltered universe so the assistant can
    // reason about "there are 12 more matching items on the server".
    final visible = sourceFilter == BookmarkSourceFilter.all
        ? page.items
        : page.items.where(sourceFilter.matches).toList(growable: false);
    data['loadedCount'] = visible.length;
    data['totalItems'] = page.totalItems;
    data['page'] = page.page;
    data['totalPages'] = page.totalPages;
    data['hasMore'] = page.items.length < page.totalItems;
    data['bookmarks'] = visible
        .map((b) => bookmarkContextSummary(b, preferredDialect: preferredDialect))
        .toList(growable: false);
  }

  return ScreenContext(
    route: match.location,
    displayName: s.assistantBookmarksTitle,
    barPlaceholder: s.assistantBookmarksPlaceholder,
    data: data,
  );
}
