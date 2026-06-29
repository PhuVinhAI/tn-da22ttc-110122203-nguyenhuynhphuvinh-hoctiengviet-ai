import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../../../core/sync/sync.dart';
import '../domain/daily_goal_progress_models.dart';
import 'daily_goal_progress_repository.dart';

final dailyGoalProgressRepositoryProvider =
    Provider<DailyGoalProgressRepository>((ref) {
  return DailyGoalProgressRepository(ref.watch(dioProvider));
});

final dailyGoalProgressProvider =
    AsyncNotifierProvider<DailyGoalProgressNotifier, DailyGoalProgress>(
  DailyGoalProgressNotifier.new,
);

class DailyGoalProgressNotifier extends CachedRepository<DailyGoalProgress>
    with DataChangeBusSubscriber<DailyGoalProgress> {
  @override
  Duration get ttl => const Duration(minutes: 2);

  @override
  Future<DailyGoalProgress> build() async {
    watchTags({'daily-goal', 'question', 'progress', 'simulation', 'auth'});
    return fetchFromApi();
  }

  @override
  Future<DailyGoalProgress> fetchFromApi() async {
    final repo = ref.read(dailyGoalProgressRepositoryProvider);
    return repo.getTodayProgress();
  }
}
