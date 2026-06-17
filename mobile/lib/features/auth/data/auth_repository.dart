import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/auth_models.dart';

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  Future<MessageResponse> register({
    required String email,
    required String password,
    required String fullName,
  }) => guard(() async => MessageResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/register',
          data: {
            'email': email,
            'password': password,
            'fullName': fullName,
          },
        ))
            .data!));

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) => guard(() async => AuthResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/login',
          data: {
            'email': email,
            'password': password,
          },
        ))
            .data!));

  Future<MessageResponse> verifyEmail({required String token}) => guard(
      () async => MessageResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/verify-email',
          data: {'token': token},
        ))
            .data!));

  Future<AuthResponse> verifyEmailCode({
    required String email,
    required String code,
  }) => guard(() async => AuthResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/verify-email-code',
          data: {'email': email, 'code': code},
        ))
            .data!));

  Future<MessageResponse> forgotPassword({required String email}) => guard(
      () async => MessageResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/forgot-password',
          data: {'email': email},
        ))
            .data!));

  Future<ResetCodeResponse> verifyResetCode({
    required String email,
    required String code,
  }) => guard(() async => ResetCodeResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/verify-reset-code',
          data: {'email': email, 'code': code},
        ))
            .data!));

  Future<MessageResponse> resetPassword({
    required String token,
    required String newPassword,
  }) => guard(() async => MessageResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/reset-password',
          data: {
            'token': token,
            'newPassword': newPassword,
          },
        ))
            .data!));

  Future<TokenResponse> refreshToken({
    required String refreshToken,
  }) => guard(() async => TokenResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
        ))
            .data!));

  Future<MessageResponse> logout({
    required String refreshToken,
  }) => guard(() async => MessageResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        ))
            .data!));

  Future<AuthResponse> loginWithGoogle({
    required String idToken,
  }) => guard(() async => AuthResponse.fromJson(
            (await _dio.post<Map<String, dynamic>>(
          '/auth/google/token',
          data: {'idToken': idToken},
        ))
            .data!));
}
