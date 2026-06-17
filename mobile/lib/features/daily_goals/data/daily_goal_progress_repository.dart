import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/daily_goal_progress_models.dart';

class DailyGoalProgressRepository {
  DailyGoalProgressRepository(this._dio);
  final Dio _dio;

  Future<DailyGoalProgress> getTodayProgress() => guard(() async =>
      DailyGoalProgress.fromJson(
          (await _dio.get<Map<String, dynamic>>('/daily-goals/progress/today')).data!));
}
