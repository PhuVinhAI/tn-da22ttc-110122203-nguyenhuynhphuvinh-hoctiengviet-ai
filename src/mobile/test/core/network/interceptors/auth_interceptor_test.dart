import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:linvnix/core/storage/secure_storage_service.dart';
import 'package:linvnix/core/network/interceptors/auth_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService storage;
  late AuthInterceptor interceptor;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    storage = SecureStorageService(mockStorage);
    interceptor = AuthInterceptor(storage);
  });

  group('AuthInterceptor', () {
    test('adds Authorization header when token exists', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'test_token');

      final handler = _TestRequestInterceptorHandler();
      final options = RequestOptions(path: '/test');

      interceptor.onRequest(options, handler);

      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(
        handler.options.headers['Authorization'],
        'Bearer test_token',
      );
    });

    test('does not add Authorization header when no token exists', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => null);

      final handler = _TestRequestInterceptorHandler();
      final options = RequestOptions(path: '/test');

      interceptor.onRequest(options, handler);

      await Future<void>.delayed(const Duration(milliseconds: 50));

      expect(handler.options.headers.containsKey('Authorization'), isFalse);
    });
  });
}

class _TestRequestInterceptorHandler extends RequestInterceptorHandler {
  late RequestOptions options;

  @override
  void next(RequestOptions requestOptions) {
    options = requestOptions;
  }
}
