import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_providers.dart';
import 'package:linvnix/features/bookmarks/domain/bookmark_models.dart';
import 'package:linvnix/core/providers/providers.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('BookmarksNotifier', () {
    test('loads initial page', () async {
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
                  'partOfSpeech': 'NOUN',
                },
              },
            ],
            'meta': {
              'total': 1,
              'page': 1,
              'limit': 20,
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

      final result = await container.read(bookmarksProvider.future);
      expect(result.items, hasLength(1));
      expect(result.items[0].word, 'con mèo');
      expect(result.totalItems, 1);
    });

    test('toggleBookmark delegates to bookmarkIdsProvider', () async {
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
                  'partOfSpeech': 'NOUN',
                },
              },
            ],
            'meta': {
              'total': 1,
              'page': 1,
              'limit': 20,
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

      await container.read(bookmarksProvider.future);
      await container.read(bookmarksProvider.notifier).toggleBookmark('v1');

      final updated = container.read(bookmarkIdsProvider).value;
      expect(updated, isNot(contains('v1')));
    });

    test('refresh resets and reloads', () async {
      int callCount = 0;
      when(() => mockDio.get<Map<String, dynamic>>(
            '/vocabularies/bookmarks',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer((_) async {
        callCount++;
        return Response(
          requestOptions: RequestOptions(path: '/vocabularies/bookmarks'),
          statusCode: 200,
          data: {
            'data': [
              {
                'bookmarkedAt': '2026-01-01T00:00:00.000Z',
                'vocabulary': {
                  'id': 'v1',
                  'word': 'con mèo $callCount',
                  'translation': 'cat',
                  'partOfSpeech': 'NOUN',
                },
              },
            ],
            'meta': {
              'total': 1,
              'page': 1,
              'limit': 20,
              'totalPages': 1,
            },
          },
        );
      });

      final container = ProviderContainer(
        overrides: [
          dioProvider.overrideWithValue(mockDio),
        ],
      );

      await container.read(bookmarksProvider.future);
      expect(callCount, 1);

      await container.read(bookmarksProvider.notifier).refresh();
      final result = await container.read(bookmarksProvider.future);
      expect(result.items[0].word, 'con mèo 2');
    });
  });

  group('bookmarkSortProvider', () {
    test('defaults to newest', () {
      final container = ProviderContainer();
      expect(container.read(bookmarkSortProvider), BookmarkSort.newest);
    });
  });

  group('bookmarkSearchProvider', () {
    test('defaults to null', () {
      final container = ProviderContainer();
      expect(container.read(bookmarkSearchProvider), isNull);
    });
  });
}
