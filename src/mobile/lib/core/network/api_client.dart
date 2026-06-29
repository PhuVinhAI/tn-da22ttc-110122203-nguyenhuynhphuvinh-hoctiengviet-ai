import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/token_refresh_interceptor.dart';
import 'interceptors/response_unwrap_interceptor.dart';
import '../storage/secure_storage_service.dart';

const _apiPrefix = '/api/v1';

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: '$_baseUrl$_apiPrefix',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _tokenRefreshInterceptor = TokenRefreshInterceptor(_dio, _storage);

    _dio.interceptors.addAll([
      AuthInterceptor(_storage),
      _tokenRefreshInterceptor,
      ResponseUnwrapInterceptor(),
    ]);
  }

  final SecureStorageService _storage;
  late final Dio _dio;
  late final TokenRefreshInterceptor _tokenRefreshInterceptor;

  Dio get dio => _dio;

  set onAuthFailure(VoidCallback? callback) {
    _tokenRefreshInterceptor.onAuthFailure = callback;
  }

  static String get _baseUrl {
    // --dart-define takes precedence
    const defineUrl = String.fromEnvironment('API_URL');
    if (defineUrl.isNotEmpty) return defineUrl;

    // .env fallback
    return dotenv.env['API_URL'] ?? 'http://localhost:3000';
  }
}
