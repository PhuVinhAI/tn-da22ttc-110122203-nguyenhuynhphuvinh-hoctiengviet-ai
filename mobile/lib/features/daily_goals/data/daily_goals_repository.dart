import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/daily_goal_models.dart';

class DailyGoalsRepository {
  DailyGoalsRepository(this._dio);
  final Dio _dio;

  Future<List<DailyGoal>> getGoals() => guard(() async =>
      ((await _dio.get<List<dynamic>>('/daily-goals')).data as List<dynamic>)
          .map((e) => DailyGoal.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<DailyGoal> createGoal(GoalType goalType, int targetValue) => guard(
      () async => DailyGoal.fromJson((await _dio.post<Map<String, dynamic>>(
        '/daily-goals',
        data: {
          'goalType': goalType.value,
          'targetValue': targetValue,
        },
      ))
          .data!));

  Future<DailyGoal> updateGoal(String id, int targetValue) => guard(
      () async => DailyGoal.fromJson((await _dio.patch<Map<String, dynamic>>(
        '/daily-goals/$id',
        data: {'targetValue': targetValue},
      ))
          .data!));

  Future<void> deleteGoal(String id) =>
      guard(() => _dio.delete('/daily-goals/$id'));
}
