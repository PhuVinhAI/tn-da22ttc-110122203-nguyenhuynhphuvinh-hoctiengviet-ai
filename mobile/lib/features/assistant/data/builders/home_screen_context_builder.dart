import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../daily_goals/data/daily_goal_progress_providers.dart';
import '../../../daily_goals/data/daily_goals_providers.dart';
import '../../../daily_goals/domain/daily_goal_models.dart';
import '../../../daily_goals/domain/daily_goal_progress_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for the home route (`/`). Pulls today's daily-
/// goals snapshot + streak from the existing daily-goals providers so the
/// AI can answer questions like "How am I doing?" without a tool call.
///
/// While the underlying async providers are loading, the builder returns
/// safe defaults (`0`, empty list) instead of waiting — the assistant bar
/// must remain interactive even on a cold start.
ScreenContext homeScreenContextBuilder(Ref ref, RouteMatch match) {
  final goalsAsync = ref.watch(dailyGoalsProvider);
  final progressAsync = ref.watch(dailyGoalProgressProvider);
  final status = _homeStatus(goalsAsync, progressAsync);

  final progress = progressAsync.whenOrNull(data: (p) => p);
  final dailyGoals =
      goalsAsync.whenOrNull(data: (g) => g) ?? const <DailyGoal>[];

  final data = <String, dynamic>{
    'screenType': 'home',
    'status': status,
    'streak': progress?.currentStreak ?? 0,
    'allGoalsMet': progress?.allGoalsMet ?? false,
    'goals': _homeGoalsPayload(progress, dailyGoals),
  };

  if (progress?.date case final date?) {
    data['date'] = date;
  }

  if (status == 'error') {
    data['error'] = shortAsyncError(
      progressAsync.hasError
          ? progressAsync.error
          : goalsAsync.error,
    );
  }

  return ScreenContext(
    route: match.location,
    displayName: 'Trang chủ',
    barPlaceholder: 'Hôm nay học gì nhỉ?',
    data: data,
  );
}

String _homeStatus(
  AsyncValue<List<DailyGoal>> goalsAsync,
  AsyncValue<DailyGoalProgress> progressAsync,
) {
  if (goalsAsync.hasError || progressAsync.hasError) return 'error';
  if (goalsAsync.isLoading || progressAsync.isLoading) return 'loading';
  return 'data';
}

List<Map<String, dynamic>> _homeGoalsPayload(
  DailyGoalProgress? progress,
  List<DailyGoal> dailyGoals,
) {
  if (progress != null && progress.goals.isNotEmpty) {
    return progress.goals.map((g) => g.toJson()).toList(growable: false);
  }

  return dailyGoals
      .map(
        (g) => <String, dynamic>{
          'goalType': g.goalType.value,
          'targetValue': g.targetValue,
          'currentValue': _findCurrentValue(progress, g.goalType),
          'met': _findMet(progress, g.goalType),
        },
      )
      .toList(growable: false);
}

int _findCurrentValue(DailyGoalProgress? progress, GoalType type) {
  if (progress == null) return 0;
  for (final g in progress.goals) {
    if (g.goalType == type) return g.currentValue;
  }
  return 0;
}

bool _findMet(DailyGoalProgress? progress, GoalType type) {
  if (progress == null) return false;
  for (final g in progress.goals) {
    if (g.goalType == type) return g.met;
  }
  return false;
}
