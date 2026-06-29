import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../../../core/sync/sync.dart';
import '../domain/daily_goal_models.dart';
import 'daily_goals_repository.dart';

final dailyGoalsRepositoryProvider = Provider<DailyGoalsRepository>((ref) {
  return DailyGoalsRepository(ref.watch(dioProvider));
});

final dailyGoalsProvider =
    AsyncNotifierProvider<DailyGoalsNotifier, List<DailyGoal>>(
  DailyGoalsNotifier.new,
);

class DailyGoalsNotifier extends CachedRepository<List<DailyGoal>>
    with DataChangeBusSubscriber<List<DailyGoal>> {
  @override
  Duration get ttl => const Duration(minutes: 2);

  @override
  Future<List<DailyGoal>> build() async {
    watchTags({'daily-goal', 'auth'});
    return super.build();
  }

  @override
  Future<List<DailyGoal>> fetchFromApi() async {
    final repo = ref.read(dailyGoalsRepositoryProvider);
    var goals = await repo.getGoals();

    if (goals.isEmpty) {
      try {
        final prefs = await ref.read(preferencesProvider.future);
        if (prefs.isOnboardingCompleted && !prefs.isDailyGoalsMigrated) {
          await prefs.setDailyGoalsMigrated();
          final created = <DailyGoal>[];
          try {
            created.add(await repo.createGoal(
              GoalType.questions,
              GoalType.questions.defaultTarget,
            ));
          } catch (_) {}
          try {
            created.add(await repo.createGoal(
              GoalType.simulations,
              GoalType.simulations.defaultTarget,
            ));
          } catch (_) {}
          goals = created;
        }
      } catch (_) {}
    }

    return goals;
  }

  Future<void> createGoal(GoalType goalType, int targetValue) async {
    final current = state.value ?? <DailyGoal>[];
    final repo = ref.read(dailyGoalsRepositoryProvider);

    await mutate(
      optimisticData: [...current],
      apiCall: () async {
        final created = await repo.createGoal(goalType, targetValue);
        return [...current, created];
      },
      emitTags: {'daily-goal'},
    );
  }

  Future<void> updateGoal(String id, int targetValue) async {
    final current = state.value ?? <DailyGoal>[];
    final repo = ref.read(dailyGoalsRepositoryProvider);

    await mutate(
      optimisticData: current
          .map((g) => g.id == id ? g.copyWith(targetValue: targetValue) : g)
          .toList(),
      apiCall: () async {
        final updatedGoal = await repo.updateGoal(id, targetValue);
        return current.map((g) => g.id == id ? updatedGoal : g).toList();
      },
      emitTags: {'daily-goal'},
    );
  }

  Future<void> deleteGoal(String id) async {
    final current = state.value ?? <DailyGoal>[];
    final repo = ref.read(dailyGoalsRepositoryProvider);

    await mutate(
      optimisticData: current.where((g) => g.id != id).toList(),
      apiCall: () async {
        await repo.deleteGoal(id);
        return current.where((g) => g.id != id).toList();
      },
      emitTags: {'daily-goal'},
    );
  }
}
