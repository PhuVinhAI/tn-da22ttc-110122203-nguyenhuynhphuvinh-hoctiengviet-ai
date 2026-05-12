import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:linvnix/features/lessons/data/lesson_repository.dart';
import 'package:linvnix/core/exceptions/app_exception.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late LessonRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = LessonRepository(mockDio);
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('LessonRepository', () {
    group('getLessonDetail', () {
      test('returns LessonDetail on success', () async {
        when(() => mockDio.get<Map<String, dynamic>>('/lessons/lesson-1'))
            .thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/lessons/lesson-1'),
            statusCode: 200,
            data: {
              'id': 'lesson-1',
              'title': 'Greetings',
              'description': 'Learn greetings',
              'lessonType': 'vocabulary',
              'orderIndex': 1,
              'moduleId': 'module-1',
              'contents': [
                {
                  'id': 'c1',
                  'contentType': 'text',
                  'vietnameseText': 'Xin chào',
                  'orderIndex': 0,
                  'translation': 'Hello',
                },
              ],
              'grammarRules': [],
            },
          ),
        );

        final result = await repository.getLessonDetail('lesson-1');

        expect(result.id, 'lesson-1');
        expect(result.title, 'Greetings');
        expect(result.contents, hasLength(1));
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.get<Map<String, dynamic>>('/lessons/lesson-1'))
            .thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/lessons/lesson-1'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.getLessonDetail('lesson-1'),
          throwsA(isA<NetworkException>()),
        );
      });
    });

    group('getVocabulariesByLesson', () {
      test('returns list of vocabularies', () async {
        when(() =>
                mockDio.get<List<dynamic>>('/vocabularies/lesson/lesson-1'))
            .thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/vocabularies/lesson/lesson-1'),
            statusCode: 200,
            data: [
              {
                'id': 'v1',
                'word': 'con mèo',
                'translation': 'cat',
              },
              {
                'id': 'v2',
                'word': 'con chó',
                'translation': 'dog',
              },
            ],
          ),
        );

        final result =
            await repository.getVocabulariesByLesson('lesson-1');

        expect(result, hasLength(2));
        expect(result[0].word, 'con mèo');
        expect(result[1].translation, 'dog');
      });
    });

    group('startLesson', () {
      test('completes without error on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
                '/progress/lesson/lesson-1/start'))
            .thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/progress/lesson/lesson-1/start'),
            statusCode: 201,
            data: {
              'id': 'p1',
              'status': 'in_progress',
              'lessonId': 'lesson-1',
            },
          ),
        );

        await repository.startLesson('lesson-1');

        verify(() => mockDio.post<Map<String, dynamic>>(
            '/progress/lesson/lesson-1/start')).called(1);
      });
    });

    group('completeLesson', () {
      test('sends score and completes', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/progress/lesson/lesson-1/complete',
              data: {'score': 85},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(
                path: '/progress/lesson/lesson-1/complete'),
            statusCode: 200,
            data: {
              'id': 'p1',
              'status': 'completed',
              'score': 85,
              'lessonId': 'lesson-1',
            },
          ),
        );

        await repository.completeLesson('lesson-1', score: 85);

        verify(() => mockDio.post<Map<String, dynamic>>(
              '/progress/lesson/lesson-1/complete',
              data: {'score': 85},
            )).called(1);
      });

      test('defaults score to 0', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/progress/lesson/lesson-1/complete',
              data: {'score': 0},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(
                path: '/progress/lesson/lesson-1/complete'),
            statusCode: 200,
            data: {
              'id': 'p1',
              'status': 'completed',
              'score': 0,
              'lessonId': 'lesson-1',
            },
          ),
        );

        await repository.completeLesson('lesson-1');

        verify(() => mockDio.post<Map<String, dynamic>>(
              '/progress/lesson/lesson-1/complete',
              data: {'score': 0},
            )).called(1);
      });
    });

    group('getLessonProgress', () {
      test('returns progress data when exists', () async {
        when(() => mockDio
                .get<Map<String, dynamic>>('/progress/lesson/lesson-1'))
            .thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/progress/lesson/lesson-1'),
            statusCode: 200,
            data: {
              'id': 'p1',
              'status': 'in_progress',
              'lessonId': 'lesson-1',
            },
          ),
        );

        final result = await repository.getLessonProgress('lesson-1');

        expect(result, isNotNull);
        expect(result!['status'], 'in_progress');
      });

      test('returns null on 404', () async {
        when(() => mockDio
                .get<Map<String, dynamic>>('/progress/lesson/lesson-1'))
            .thenThrow(
          DioException(
            requestOptions:
                RequestOptions(path: '/progress/lesson/lesson-1'),
            response: Response(
              requestOptions:
                  RequestOptions(path: '/progress/lesson/lesson-1'),
              statusCode: 404,
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        final result = await repository.getLessonProgress('lesson-1');

        expect(result, isNull);
      });
    });
  });
}
