import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_repository.dart';
import 'package:linvnix/features/bookmarks/domain/bookmark_models.dart';
import 'package:linvnix/core/exceptions/app_exception.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late BookmarkRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = BookmarkRepository(mockDio);
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('BookmarkRepository', () {
    group('toggleBookmark', () {
      test('returns true when bookmarked', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>('/vocabularies/v1/bookmark'),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
            statusCode: 201,
            data: {'isBookmarked': true},
          ),
        );

        final result = await repository.toggleBookmark('v1');
        expect(result, true);
      });

      test('returns false when unbookmarked', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>('/vocabularies/v1/bookmark'),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
            statusCode: 200,
            data: {'isBookmarked': false},
          ),
        );

        final result = await repository.toggleBookmark('v1');
        expect(result, false);
      });

      test('passes personalVocabularyId for personal bookmarks', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/pv-1/bookmark',
            data: any(named: 'data'),
          ),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/pv-1/bookmark'),
            statusCode: 200,
            data: {'isBookmarked': false},
          ),
        );

        final result = await repository.toggleBookmark(
          'pv-1',
          personalVocabularyId: 'pv-1',
        );

        final captured =
            verify(
                  () => mockDio.post<Map<String, dynamic>>(
                    '/vocabularies/pv-1/bookmark',
                    data: captureAny(named: 'data'),
                  ),
                ).captured.single
                as Map<String, dynamic>;
        expect(captured, {'personalVocabularyId': 'pv-1'});
        expect(result, false);
      });

      test('throws AuthException on 401', () async {
        when(
          () => mockDio.post<Map<String, dynamic>>('/vocabularies/v1/bookmark'),
        ).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
            response: Response(
              requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
              statusCode: 401,
              data: {'message': 'Unauthorized'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.toggleBookmark('v1'),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('getBookmarks', () {
      test('returns BookmarksPage with items', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          ),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
            statusCode: 200,
            data: {
              'data': [
                {
                  'bookmarkedAt': '2026-01-01T00:00:00.000Z',
                  'vocabulary': {
                    'id': 'v1',
                    'word': 'con mèo',
                    'translation': 'cat',
                    'partOfSpeech': 'NOUN',
                  },
                },
              ],
              'meta': {'total': 1, 'page': 1, 'limit': 20, 'totalPages': 1},
            },
          ),
        );

        final result = await repository.getBookmarks();
        expect(result.items, hasLength(1));
        expect(result.items[0].word, 'con mèo');
        expect(result.page, 1);
        expect(result.totalItems, 1);
      });

      test('passes search and sort params', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: {
              'page': 1,
              'limit': 20,
              'search': 'mèo',
              'sort': 'az',
            },
          ),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
            statusCode: 200,
            data: {
              'data': [],
              'meta': {'total': 0, 'page': 1, 'limit': 20, 'totalPages': 0},
            },
          ),
        );

        final result = await repository.getBookmarks(
          search: 'mèo',
          sort: BookmarkSort.az,
        );
        expect(result.items, isEmpty);
      });

      test('parses personal bookmark type and id', () async {
        when(
          () => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          ),
        ).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
            statusCode: 200,
            data: {
              'data': [
                {
                  'bookmarkedAt': '2026-01-01T00:00:00.000Z',
                  'type': 'personal',
                  'personalVocabularyId': 'pv-1',
                  'vocabulary': {
                    'id': 'pv-1',
                    'word': 'cấm đỗ xe',
                    'translation': 'no parking',
                    'partOfSpeech': 'phrase',
                  },
                },
              ],
              'meta': {'total': 1, 'page': 1, 'limit': 20, 'totalPages': 1},
            },
          ),
        );

        final result = await repository.getBookmarks();

        expect(result.items.single.type, BookmarkType.personal);
        expect(result.items.single.isPersonal, isTrue);
        expect(result.items.single.vocabularyId, 'pv-1');
        expect(result.items.single.personalVocabularyId, 'pv-1');
      });
    });
  });
}
