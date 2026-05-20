import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:linvnix/features/user/data/user_repository.dart';
import 'package:linvnix/core/exceptions/app_exception.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late UserRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = UserRepository(mockDio);
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('UserRepository', () {
    group('getMyStats', () {
      test('returns exercise stats on success', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/exercises/my-stats',
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/exercises/my-stats'),
            statusCode: 200,
            data: {
              'totalExercises': 100,
              'correctAnswers': 60,
              'incorrectAnswers': 40,
              'accuracy': 60.0,
              'completedExercises': 12,
              'totalTimeSpent': 7200,
            },
          ),
        );

        final result = await repository.getMyStats();

        expect(result['totalExercises'], 100);
        expect(result['correctAnswers'], 60);
        expect(result['incorrectAnswers'], 40);
        expect(result['accuracy'], 60.0);
        expect(result['completedExercises'], 12);
        expect(result['totalTimeSpent'], 7200);
      });

      test('throws AuthException on 401 response', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/exercises/my-stats',
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/exercises/my-stats'),
            response: Response(
              requestOptions: RequestOptions(path: '/exercises/my-stats'),
              statusCode: 401,
              data: {'message': 'Unauthorized'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.getMyStats(),
          throwsA(isA<AuthException>()),
        );
      });

      test('throws ServerException on 500 response', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/exercises/my-stats',
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/exercises/my-stats'),
            response: Response(
              requestOptions: RequestOptions(path: '/exercises/my-stats'),
              statusCode: 500,
              data: {'message': 'Internal server error'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.getMyStats(),
          throwsA(isA<ServerException>()),
        );
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/exercises/my-stats',
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/exercises/my-stats'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.getMyStats(),
          throwsA(isA<NetworkException>()),
        );
      });
    });
  });
}
