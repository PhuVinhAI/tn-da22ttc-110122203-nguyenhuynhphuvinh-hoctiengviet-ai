import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'bookmark_context_summaries.dart';
import 'course_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/bookmarks`. Pulls the visible bookmark page,
/// active sort, and search query so the AI can answer vocabulary review
/// questions without a tool call.
ScreenContext bookmarksScreenContextBuilder(Ref ref, RouteMatch match) {
  final bookmarksAsync = ref.watch(bookmarksProvider);
  final sort = ref.watch(bookmarkSortProvider);
  final search = ref.watch(bookmarkSearchProvider);
  final status = asyncLoadStatus(bookmarksAsync);

  final profileAsync = ref.watch(userProfileProvider);
  final preferredDialect = profileAsync.value?.preferredDialect;

  final data = <String, dynamic>{
    'screenType': 'bookmarksList',
    'status': status,
    'sort': sort.value,
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
    data['loadedCount'] = page.items.length;
    data['totalItems'] = page.totalItems;
    data['page'] = page.page;
    data['totalPages'] = page.totalPages;
    data['bookmarks'] = page.items
        .map((b) => bookmarkContextSummary(b, preferredDialect: preferredDialect))
        .toList(growable: false);
  }

  return ScreenContext(
    route: match.location,
    displayName: 'Bookmarks',
    barPlaceholder: 'Ask about saved words?',
    data: data,
  );
}
