import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../../lessons/domain/question_models.dart';

class UserRepository {
  UserRepository(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> getMe() => guard(() async =>
      (await _dio.get<Map<String, dynamic>>('/users/me')).data!);

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> data) => guard(
      () async =>
          (await _dio.patch<Map<String, dynamic>>('/users/me', data: data)).data!);

  Future<Map<String, dynamic>> submitOnboarding(Map<String, dynamic> data) =>
      guard(() async =>
          (await _dio.post<Map<String, dynamic>>('/users/onboarding', data: data)).data!);

  Future<Map<String, dynamic>> getMyStats() => guard(() async =>
      (await _dio.get<Map<String, dynamic>>('/questions/my-stats')).data!);

  Future<List<ExerciseSubmissionResult>> getMyResults() => guard(() async =>
      ((await _dio.get<List<dynamic>>('/questions/my-results')).data as List<dynamic>)
          .map((e) => ExerciseSubmissionResult.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<void> clearUserData() =>
      guard(() => _dio.delete<void>('/users/me/data'));

  Future<void> deleteAccount() => guard(() => _dio.delete<void>('/users/me'));
}
