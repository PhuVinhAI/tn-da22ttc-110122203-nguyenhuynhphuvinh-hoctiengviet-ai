import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../storage/secure_storage_service.dart';

/// Interceptor that refreshes the access token on a 401 and retries the
/// original request.
///
/// Concurrency-safe: when several requests fail with 401 at the same time,
/// only the first triggers a refresh. The rest are queued and retried with
/// the new token once the in-flight refresh resolves — instead of being
/// failed outright (which previously caused spurious logouts under burst
/// traffic).
class TokenRefreshInterceptor extends Interceptor {
  TokenRefreshInterceptor(this._dio, this._storage, {this.onAuthFailure});
  final Dio _dio;
  final SecureStorageService _storage;
  VoidCallback? onAuthFailure;

  bool _isRefreshing = false;
  // Pending requests waiting for the in-flight refresh to finish. Each
  // completer is resolved with the new access token (or null on failure).
  final List<Completer<String?>> _refreshSubscribers = [];

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // If a refresh is already in flight, queue this request and wait for the
    // result rather than failing it immediately.
    if (_isRefreshing) {
      final completer = Completer<String?>();
      _refreshSubscribers.add(completer);
      try {
        final newAccessToken = await completer.future;
        if (newAccessToken == null) {
          // Refresh failed — propagate the original 401.
          return handler.next(err);
        }
        final requestOptions = err.requestOptions;
        requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await _dio.fetch(requestOptions);
        handler.resolve(retryResponse);
      } on DioException catch (e) {
        handler.next(e);
      } catch (e) {
        handler.next(err);
      }
      return;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        await _storage.clearTokens();
        onAuthFailure?.call();
        _notifySubscribers(null);
        return handler.next(err);
      }

      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final data = response.data;
      if (data == null) {
        await _storage.clearTokens();
        onAuthFailure?.call();
        _notifySubscribers(null);
        return handler.next(err);
      }

      final newAccessToken = data['access_token'] as String;
      final newRefreshToken = data['refresh_token'] as String;
      await _storage.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      // Unblock queued requests with the new token, then retry the original.
      _notifySubscribers(newAccessToken);

      final requestOptions = err.requestOptions;
      requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      final retryResponse = await _dio.fetch(requestOptions);
      handler.resolve(retryResponse);
    } catch (_) {
      await _storage.clearTokens();
      onAuthFailure?.call();
      _notifySubscribers(null);
      handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }

  /// Resolve every queued request with the refresh outcome (token on success,
  /// null on failure so each waiter propagates its original 401).
  void _notifySubscribers(String? newAccessToken) {
    for (final completer in _refreshSubscribers) {
      if (!completer.isCompleted) {
        completer.complete(newAccessToken);
      }
    }
    _refreshSubscribers.clear();
  }
}
