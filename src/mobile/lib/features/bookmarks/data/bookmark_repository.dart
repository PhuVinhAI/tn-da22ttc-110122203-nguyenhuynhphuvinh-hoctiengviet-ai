import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/bookmark_models.dart';

class BookmarkRepository {
  BookmarkRepository(this._dio);
  final Dio _dio;

  Future<BookmarkStats> getBookmarkStats() => guard(() async =>
      BookmarkStats.fromJson(
          (await _dio.get<Map<String, dynamic>>('/vocabularies/bookmarks/stats')).data!));

  Future<bool> toggleBookmark(
    String vocabularyId, {
    String? personalVocabularyId,
  }) => guard(() async {
    final Response<Map<String, dynamic>> response;
    if (personalVocabularyId == null) {
      response = await _dio.post<Map<String, dynamic>>(
        '/vocabularies/$vocabularyId/bookmark',
      );
    } else {
      response = await _dio.post<Map<String, dynamic>>(
        '/vocabularies/$vocabularyId/bookmark',
        data: {'personalVocabularyId': personalVocabularyId},
      );
    }
    return response.data!['isBookmarked'] as bool;
  });

  Future<BookmarksPage> getBookmarks({
    int page = 1,
    int limit = 20,
    String? search,
    BookmarkSort sort = BookmarkSort.newest,
  }) => guard(() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/vocabularies/bookmarks',
      queryParameters: {
        'page': page,
        'limit': limit,
        'search': ?search,
        'sort': sort.value,
      },
    );
    return BookmarksPage.fromJson(response.data!);
  });
}
