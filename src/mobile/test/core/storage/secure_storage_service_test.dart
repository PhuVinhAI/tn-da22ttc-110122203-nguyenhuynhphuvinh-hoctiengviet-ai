import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:linvnix/core/storage/secure_storage_service.dart';
import 'package:mocktail/mocktail.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService service;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    service = SecureStorageService(mockStorage);
  });

  group('SecureStorageService', () {
    test('saveTokens stores both access and refresh tokens', () async {
      when(() => mockStorage.write(
            key: any(named: 'key'),
            value: any(named: 'value'),
          )).thenAnswer((_) async {});

      await service.saveTokens(
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
      );

      verify(() => mockStorage.write(
            key: 'access_token',
            value: 'test_access_token',
          )).called(1);
      verify(() => mockStorage.write(
            key: 'refresh_token',
            value: 'test_refresh_token',
          )).called(1);
    });

    test('getAccessToken returns stored token', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'stored_token');

      final token = await service.getAccessToken();

      expect(token, 'stored_token');
    });

    test('getAccessToken returns null when no token stored', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => null);

      final token = await service.getAccessToken();

      expect(token, isNull);
    });

    test('getRefreshToken returns stored token', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'stored_refresh');

      final token = await service.getRefreshToken();

      expect(token, 'stored_refresh');
    });

    test('getRefreshToken returns null when no token stored', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => null);

      final token = await service.getRefreshToken();

      expect(token, isNull);
    });

    test('clearTokens removes both tokens', () async {
      when(() => mockStorage.delete(key: any(named: 'key')))
          .thenAnswer((_) async {});

      await service.clearTokens();

      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
    });

    test('hasToken returns true when access token exists', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'token');

      expect(await service.hasToken, isTrue);
    });

    test('hasToken returns false when no access token exists', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => null);

      expect(await service.hasToken, isFalse);
    });
  });
}
