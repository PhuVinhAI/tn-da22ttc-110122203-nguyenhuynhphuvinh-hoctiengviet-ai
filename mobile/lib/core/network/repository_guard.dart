import 'package:dio/dio.dart';
import '../exceptions/app_exception.dart';
import 'exception_mapper.dart';

/// Runs [body] and converts any thrown [DioException] into the typed
/// [AppException] hierarchy via [mapDioException].
///
/// This replaces the `try { ... } on DioException catch (e) { throw
/// mapDioException(e); }` boilerplate that was duplicated ~67 times across
/// the repositories. Conversion stays at the repository boundary (not a Dio
/// interceptor) so MockDio-based unit tests — which do not run the interceptor
/// chain — keep working unchanged.
///
/// For the one call site that needs to branch on the raw status before mapping
/// (e.g. treat 404 as `null` instead of a [ServerException]), use [guardRaw]
/// and inspect the [DioException] inside [onDioError].
Future<T> guard<T>(Future<T> Function() body) async {
  try {
    return await body();
  } on DioException catch (e) {
    throw mapDioException(e);
  }
}

/// Like [guard] but exposes the raw [DioException] to [onDioError] so the
/// caller can short-circuit (e.g. return `null` on 404). If [onDioError]
/// returns, its return value is used; if it rethrows, the exception escapes.
/// Callers that do not handle the error should fall through to the default
/// mapping by rethrowing inside [onDioError] or by using [guard] instead.
Future<T?> guardRaw<T>(
  Future<T> Function() body, {
  required T? Function(DioException error) onDioError,
}) async {
  try {
    return await body();
  } on DioException catch (e) {
    return onDioError(e);
  }
}
