import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:linvnix/core/storage/secure_storage_service.dart';
import 'package:linvnix/core/network/interceptors/token_refresh_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}
class MockDio extends Mock implements Dio {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService storage;
  late MockDio mockDio;
  late TokenRefreshInterceptor interceptor;
  late bool authFailureCalled;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    storage = SecureStorageService(mockStorage);
    mockDio = MockDio();
    authFailureCalled = false;
    interceptor = TokenRefreshInterceptor(
      mockDio,
      storage,
      onAuthFailure: () => authFailureCalled = true,
    );
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('TokenRefreshInterceptor', () {
    test('passes through non-401 errors', () {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'access');

      final error = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 500,
        ),
        type: DioExceptionType.badResponse,
      );

      final handler = _TestErrorHandler();
      interceptor.onError(error, handler);

      expect(handler.error, error);
      expect(authFailureCalled, isFalse);
    });

    test('clears tokens and calls onAuthFailure when no refresh token',
        () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => null);
      when(() => mockStorage.delete(key: any(named: 'key')))
          .thenAnswer((_) async {});

      final error = DioException(
        requestOptions: RequestOptions(path: '/test'),
        response: Response(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      final handler = _TestErrorHandler();
      interceptor.onError(error, handler);

      await Future<void>.delayed(const Duration(milliseconds: 100));

      expect(handler.error, error);
      expect(authFailureCalled, isTrue);
      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
    });

    test('refreshes tokens on 401 and retries request', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'old_refresh');
      when(() => mockStorage.write(
            key: any(named: 'key'),
            value: any(named: 'value'),
          )).thenAnswer((_) async {});

      final requestOptions = RequestOptions(path: '/test');
      final error = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

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
          },
        ),
      );

      when(() => mockDio.fetch(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/test'),
          statusCode: 200,
          data: {'success': true},
        ),
      );

      final handler = _TestErrorHandler();
      interceptor.onError(error, handler);

      await Future<void>.delayed(const Duration(milliseconds: 200));

      verify(() => mockStorage.write(
            key: 'access_token',
            value: 'new_access',
          )).called(1);
      verify(() => mockStorage.write(
            key: 'refresh_token',
            value: 'new_refresh',
          )).called(1);
      verify(() => mockDio.fetch(any())).called(1);
      expect(authFailureCalled, isFalse);
    });

    test('clears tokens and calls onAuthFailure when refresh fails', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'old_refresh');
      when(() => mockStorage.delete(key: any(named: 'key')))
          .thenAnswer((_) async {});

      final requestOptions = RequestOptions(path: '/test');
      final error = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/auth/refresh',
            data: {'refreshToken': 'old_refresh'},
          )).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/auth/refresh'),
          response: Response(
            requestOptions: RequestOptions(path: '/auth/refresh'),
            statusCode: 401,
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      final handler = _TestErrorHandler();
      interceptor.onError(error, handler);

      await Future<void>.delayed(const Duration(milliseconds: 200));

      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
      expect(authFailureCalled, isTrue);
    });

    test('clears tokens when refresh response has null data', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'old_refresh');
      when(() => mockStorage.delete(key: any(named: 'key')))
          .thenAnswer((_) async {});

      final requestOptions = RequestOptions(path: '/test');
      final error = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockDio.post<Map<String, dynamic>>(
            '/auth/refresh',
            data: {'refreshToken': 'old_refresh'},
          )).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/auth/refresh'),
          statusCode: 200,
          data: null,
        ),
      );

      final handler = _TestErrorHandler();
      interceptor.onError(error, handler);

      await Future<void>.delayed(const Duration(milliseconds: 200));

      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
      expect(authFailureCalled, isTrue);
    });
  });
}

class _TestErrorHandler extends ErrorInterceptorHandler {
  DioException? error;

  @override
  void next(DioException err) {
    error = err;
  }
}
