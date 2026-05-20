import 'package:dio/dio.dart';
import '../exceptions/app_exception.dart';

AppException mapDioException(DioException error) {
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const NetworkException('Connection timed out');
    case DioExceptionType.connectionError:
      return const NetworkException('No internet connection');
    case DioExceptionType.badResponse:
      return _mapBadResponse(error);
    case DioExceptionType.cancel:
      return const RequestCancelledException();
    case DioExceptionType.unknown:
      return NetworkException(error.message ?? 'Unknown network error');
    default:
      return NetworkException(error.message ?? 'Unknown network error');
  }
}

AppException _mapBadResponse(DioException error) {
  final statusCode = error.response?.statusCode;
  final data = error.response?.data;

  switch (statusCode) {
    case 401:
      return AuthException(
        _extractMessage(data) ?? 'Authentication failed',
        statusCode: statusCode,
      );
    case 403:
      if (data is Map<String, dynamic> && data['emailNotVerified'] == true) {
        return EmailNotVerifiedException(
          _extractMessage(data) ?? 'Email is not verified',
          email: data['email'] as String? ?? '',
          statusCode: statusCode,
        );
      }
      return AuthException(
        _extractMessage(data) ?? 'Access denied',
        statusCode: statusCode,
      );
    case 422:
      return ValidationException(
        _extractMessage(data) ?? 'Validation failed',
        errors: _extractErrors(data),
        statusCode: statusCode,
      );
    case 409:
      return ValidationException(
        _extractMessage(data) ?? 'Conflict',
        statusCode: statusCode,
      );
    case final int s when s >= 500:
      return ServerException(
        _extractMessage(data) ?? 'Server error occurred',
        statusCode: statusCode,
      );
    default:
      return ServerException(
        _extractMessage(data) ?? 'Request failed',
        statusCode: statusCode,
      );
  }
}

String? _extractMessage(dynamic data) {
  if (data is Map<String, dynamic>) {
    return data['message'] as String?;
  }
  return null;
}

Map<String, List<String>>? _extractErrors(dynamic data) {
  if (data is Map<String, dynamic> && data['errors'] is Map) {
    final errors = data['errors'] as Map<String, dynamic>;
    return errors.map(
      (key, value) => MapEntry(
        key,
        (value as List).map((e) => e.toString()).toList(),
      ),
    );
  }
  return null;
}
