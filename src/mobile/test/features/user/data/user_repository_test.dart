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
    group('updateMe', () {
      test('returns updated user data on success', () async {
        when(() => mockDio.patch<Map<String, dynamic>>(
              '/users/me',
              data: {
                'currentLevel': 'B1',
                'preferredDialect': 'NORTHERN',
              },
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/users/me'),
            statusCode: 200,
            data: {
              'id': 'user-1',
              'email': 'test@example.com',
              'fullName': 'Test User',
              'currentLevel': 'B1',
              'preferredDialect': 'NORTHERN',
              'nativeLanguage': 'English',
            },
          ),
        );

        final result = await repository.updateMe({
          'currentLevel': 'B1',
          'preferredDialect': 'NORTHERN',
        });

        expect(result['currentLevel'], 'B1');
        expect(result['preferredDialect'], 'NORTHERN');
      });

      test('throws ValidationException on 422 response', () async {
        when(() => mockDio.patch<Map<String, dynamic>>(
              '/users/me',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            response: Response(
              requestOptions: RequestOptions(path: '/users/me'),
              statusCode: 422,
              data: {
                'message': 'Validation failed',
                'errors': {
                  'currentLevel': ['Invalid level'],
                },
              },
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.updateMe({'currentLevel': 'INVALID'}),
          throwsA(isA<ValidationException>()),
        );
      });

      test('throws AuthException on 401 response', () async {
        when(() => mockDio.patch<Map<String, dynamic>>(
              '/users/me',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            response: Response(
              requestOptions: RequestOptions(path: '/users/me'),
              statusCode: 401,
              data: {'message': 'Unauthorized'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.updateMe({'currentLevel': 'B1'}),
          throwsA(isA<AuthException>()),
        );
      });

      test('throws ServerException on 500 response', () async {
        when(() => mockDio.patch<Map<String, dynamic>>(
              '/users/me',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            response: Response(
              requestOptions: RequestOptions(path: '/users/me'),
              statusCode: 500,
              data: {'message': 'Internal server error'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.updateMe({'currentLevel': 'B1'}),
          throwsA(isA<ServerException>()),
        );
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.patch<Map<String, dynamic>>(
              '/users/me',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.updateMe({'currentLevel': 'B1'}),
          throwsA(isA<NetworkException>()),
        );
      });
    });

    group('getMe', () {
      test('returns current user data on success', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/users/me',
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/users/me'),
            statusCode: 200,
            data: {
              'id': 'user-1',
              'email': 'test@example.com',
              'fullName': 'Test User',
              'currentLevel': 'A1',
              'preferredDialect': 'STANDARD',
              'nativeLanguage': 'English',
            },
          ),
        );

        final result = await repository.getMe();

        expect(result['email'], 'test@example.com');
        expect(result['currentLevel'], 'A1');
      });

      test('throws AuthException on 401 response', () async {
        when(() => mockDio.get<Map<String, dynamic>>(
              '/users/me',
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            response: Response(
              requestOptions: RequestOptions(path: '/users/me'),
              statusCode: 401,
              data: {'message': 'Unauthorized'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.getMe(),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('clearUserData', () {
      test('calls DELETE /users/me/data', () async {
        when(() => mockDio.delete<void>('/users/me/data')).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/users/me/data'),
            statusCode: 200,
          ),
        );

        await repository.clearUserData();

        verify(() => mockDio.delete<void>('/users/me/data')).called(1);
      });
    });

    group('deleteAccount', () {
      test('calls DELETE /users/me', () async {
        when(() => mockDio.delete<void>('/users/me')).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/users/me'),
            statusCode: 200,
          ),
        );

        await repository.deleteAccount();

        verify(() => mockDio.delete<void>('/users/me')).called(1);
      });

      test('throws AuthException on 401 response', () async {
        when(() => mockDio.delete<void>('/users/me')).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            response: Response(
              requestOptions: RequestOptions(path: '/users/me'),
              statusCode: 401,
              data: {'message': 'Unauthorized'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.deleteAccount(),
          throwsA(isA<AuthException>()),
        );
      });
    });
  });
}
