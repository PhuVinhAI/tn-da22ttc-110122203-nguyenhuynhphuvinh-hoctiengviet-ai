import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/auth_models.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<MessageResponse> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'fullName': fullName,
        },
      );
      return MessageResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<MessageResponse> verifyEmail({required String token}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/verify-email',
        data: {'token': token},
      );
      return MessageResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<AuthResponse> verifyEmailCode({
    required String email,
    required String code,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/verify-email-code',
        data: {'email': email, 'code': code},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<MessageResponse> forgotPassword({required String email}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/forgot-password',
        data: {'email': email},
      );
      return MessageResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ResetCodeResponse> verifyResetCode({
    required String email,
    required String code,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/verify-reset-code',
        data: {'email': email, 'code': code},
      );
      return ResetCodeResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<MessageResponse> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/reset-password',
        data: {
          'token': token,
          'newPassword': newPassword,
        },
      );
      return MessageResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<TokenResponse> refreshToken({
    required String refreshToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      return TokenResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<MessageResponse> logout({
    required String refreshToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/logout',
        data: {'refreshToken': refreshToken},
      );
      return MessageResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }
}
