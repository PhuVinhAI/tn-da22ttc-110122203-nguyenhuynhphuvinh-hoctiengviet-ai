sealed class AppException implements Exception {
  const AppException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => 'AppException: $message (status: $statusCode)';
}

class AuthException extends AppException {
  const AuthException(super.message, {super.statusCode});
}

class EmailNotVerifiedException extends AuthException {
  const EmailNotVerifiedException(super.message, {required this.email, super.statusCode});
  final String email;
}

class NetworkException extends AppException {
  const NetworkException(super.message, {super.statusCode});
}

/// User hoặc widget huỷ request (ví dụ [CancelToken], điều hướng khỏi màn hình).
class RequestCancelledException extends AppException {
  const RequestCancelledException() : super('Request was cancelled');
}

class ServerException extends AppException {
  const ServerException(super.message, {super.statusCode});
}

class ValidationException extends AppException {
  const ValidationException(super.message, {this.errors, super.statusCode});
  final Map<String, List<String>>? errors;
}

class CacheException extends AppException {
  const CacheException(super.message, {super.statusCode});
}
