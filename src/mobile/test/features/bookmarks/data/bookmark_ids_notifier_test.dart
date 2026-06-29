import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_providers.dart';
import 'package:linvnix/core/providers/providers.dart';
import 'package:linvnix/core/sync/sync.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('BookmarkIdsNotifier', () {
    test('loads bookmark IDs on build', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
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
                },
              },
              {
                'bookmarkedAt': '2026-01-02T00:00:00.000Z',
                'vocabulary': {
                  'id': 'v2',
                  'word': 'con chó',
                  'translation': 'dog',
                },
              },
            ],
            'meta': {
              'total': 2,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      final result = await container.read(bookmarkIdsProvider.future);
      expect(result, {'v1', 'v2'});
    });

    test('toggle adds ID when not present', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
          statusCode: 200,
          data: {
            'data': [],
            'meta': {
              'total': 0,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/v1/bookmark',
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
          statusCode: 201,
          data: {'isBookmarked': true},
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      await container.read(bookmarkIdsProvider.future);
      await container.read(bookmarkIdsProvider.notifier).toggle('v1');

      final updated = container.read(bookmarkIdsProvider).value;
      expect(updated, contains('v1'));
    });

    test('toggle removes ID when present', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
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
                },
              },
            ],
            'meta': {
              'total': 1,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/v1/bookmark',
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
          statusCode: 200,
          data: {'isBookmarked': false},
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      await container.read(bookmarkIdsProvider.future);
      await container.read(bookmarkIdsProvider.notifier).toggle('v1');

      final updated = container.read(bookmarkIdsProvider).value;
      expect(updated, isNot(contains('v1')));
    });

    test('API failure reverts toggle to previous state', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
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
                },
              },
            ],
            'meta': {
              'total': 1,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/v1/bookmark',
          )).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
          error: 'Network error',
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      await container.read(bookmarkIdsProvider.future);
      expect(
        () => container.read(bookmarkIdsProvider.notifier).toggle('v1'),
        throwsA(isA<Exception>()),
      );

      await Future.delayed(Duration.zero);
      final updated = container.read(bookmarkIdsProvider).value;
      expect(updated, contains('v1'));
    });

    test('DataChanged event emitted on success only', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
          statusCode: 200,
          data: {
            'data': [],
            'meta': {
              'total': 0,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/v1/bookmark',
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
          statusCode: 201,
          data: {'isBookmarked': true},
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      DataChanged? captured;
      container.listen(dataChangeBusProvider, (previous, next) {
        captured = next;
      });

      await container.read(bookmarkIdsProvider.future);
      await container.read(bookmarkIdsProvider.notifier).toggle('v1');

      expect(captured, isNotNull);
      expect(captured!.tags, contains('bookmark'));
      expect(captured!.tags, contains('vocabulary-v1'));
    });

    test('DataChanged event not emitted on failure', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
          statusCode: 200,
          data: {
            'data': [],
            'meta': {
              'total': 0,
              'page': 1,
              'limit': 50,
              'totalPages': 1,
            },
          },
        ),
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/vocabularies/v1/bookmark',
          )).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/vocabularies/v1/bookmark'),
          error: 'Network error',
        ),
      );

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      DataChanged? captured;
      container.listen(dataChangeBusProvider, (previous, next) {
        captured = next;
      });

      await container.read(bookmarkIdsProvider.future);
      try {
        await container.read(bookmarkIdsProvider.notifier).toggle('v1');
      } catch (_) {}

      expect(captured, isNull);
    });
  });
}
