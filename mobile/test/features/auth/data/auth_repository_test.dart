import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:linvnix/features/auth/data/auth_repository.dart';
import 'package:linvnix/core/exceptions/app_exception.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late AuthRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = AuthRepository(mockDio);
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('AuthRepository', () {
    group('register', () {
      test('returns MessageResponse on successful registration', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/register',
              data: {
                'email': 'test@example.com',
                'password': 'password123',
                'fullName': 'Test User',
              },
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/register'),
            statusCode: 201,
            data: {
              'message':
                  'Registration successful! Check your email for a verification code.',
              'email': 'test@example.com',
            },
          ),
        );

        final result = await repository.register(
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        );

        expect(result.message, contains('Registration successful'));
      });

      test('throws ValidationException on 422 response', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/register',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/register'),
            response: Response(
              requestOptions: RequestOptions(path: '/auth/register'),
              statusCode: 422,
              data: {
                'message': 'Validation failed',
                'errors': {
                  'email': ['Email already exists'],
                },
              },
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.register(
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
          ),
          throwsA(isA<ValidationException>()),
        );
      });

      test('throws ServerException on 500 response', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/register',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/register'),
            response: Response(
              requestOptions: RequestOptions(path: '/auth/register'),
              statusCode: 500,
              data: {'message': 'Internal server error'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.register(
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
          ),
          throwsA(isA<ServerException>()),
        );
      });
    });

    group('login', () {
      test('returns AuthResponse on successful login', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/login',
              data: {
                'email': 'test@example.com',
                'password': 'password123',
              },
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/login'),
            statusCode: 200,
            data: {
              'user': {
                'id': '1',
                'email': 'test@example.com',
                'fullName': 'Test User',
                'emailVerified': true,
                'roles': <Map<String, dynamic>>[],
              },
              'access_token': 'access_token',
              'refresh_token': 'refresh_token',
              'expires_in': 900,
            },
          ),
        );

        final result = await repository.login(
          email: 'test@example.com',
          password: 'password123',
        );

        expect(result.user.email, 'test@example.com');
        expect(result.user.emailVerified, isTrue);
        expect(result.accessToken, 'access_token');
      });

      test('throws AuthException on 401 response', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/login',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/login'),
            response: Response(
              requestOptions: RequestOptions(path: '/auth/login'),
              statusCode: 401,
              data: {'message': 'Invalid credentials'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.login(
            email: 'test@example.com',
            password: 'wrong',
          ),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('verifyEmail', () {
      test('returns MessageResponse on successful verification', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/verify-email',
              data: {'token': 'verify_token'},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/verify-email'),
            statusCode: 200,
            data: {'message': 'Email verified successfully'},
          ),
        );

        final result = await repository.verifyEmail(token: 'verify_token');

        expect(result.message, 'Email verified successfully');
      });
    });

    group('forgotPassword', () {
      test('returns MessageResponse on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/forgot-password',
              data: {'email': 'test@example.com'},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/forgot-password'),
            statusCode: 200,
            data: {
              'message':
                  'If the email exists, you will receive a reset link.',
            },
          ),
        );

        final result = await repository.forgotPassword(
          email: 'test@example.com',
        );

        expect(result.message, isNotEmpty);
      });
    });

    group('resetPassword', () {
      test('returns MessageResponse on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/reset-password',
              data: {
                'token': 'reset_token',
                'newPassword': 'NewPass123',
              },
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/reset-password'),
            statusCode: 200,
            data: {'message': 'Password reset successfully'},
          ),
        );

        final result = await repository.resetPassword(
          token: 'reset_token',
          newPassword: 'NewPass123',
        );

        expect(result.message, 'Password reset successfully');
      });
    });

    group('refreshToken', () {
      test('returns TokenResponse on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/refresh',
              data: {'refreshToken': 'old_refresh'},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/refresh'),
            statusCode: 200,
            data: {
              'access_token': 'new_access',
              'refresh_token': 'new_refresh',
              'expires_in': 900,
            },
          ),
        );

        final result = await repository.refreshToken(
          refreshToken: 'old_refresh',
        );

        expect(result.accessToken, 'new_access');
        expect(result.refreshToken, 'new_refresh');
        expect(result.expiresIn, 900);
      });

      test('throws AuthException on invalid refresh token', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/refresh',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/refresh'),
            response: Response(
              requestOptions: RequestOptions(path: '/auth/refresh'),
              statusCode: 401,
              data: {'message': 'Invalid refresh token'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.refreshToken(refreshToken: 'invalid'),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('logout', () {
      test('returns MessageResponse on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/logout',
              data: {'refreshToken': 'refresh_token'},
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/auth/logout'),
            statusCode: 200,
            data: {'message': 'Logged out successfully'},
          ),
        );

        final result = await repository.logout(
          refreshToken: 'refresh_token',
        );

        expect(result.message, 'Logged out successfully');
      });
    });

    group('Network errors', () {
      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/login',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/login'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.login(
            email: 'test@example.com',
            password: 'password',
          ),
          throwsA(isA<NetworkException>()),
        );
      });

      test('throws NetworkException on connection error', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              '/auth/login',
              data: any(named: 'data'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/auth/login'),
            type: DioExceptionType.connectionError,
          ),
        );

        expect(
          () => repository.login(
            email: 'test@example.com',
            password: 'password',
          ),
          throwsA(isA<NetworkException>()),
        );
      });
    });
  });
}
