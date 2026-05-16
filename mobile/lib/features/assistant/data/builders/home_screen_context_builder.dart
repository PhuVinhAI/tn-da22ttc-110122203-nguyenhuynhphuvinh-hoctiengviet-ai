import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../daily_goals/data/daily_goal_progress_providers.dart';
import '../../../daily_goals/data/daily_goals_providers.dart';
import '../../../daily_goals/domain/daily_goal_models.dart';
import '../../../daily_goals/domain/daily_goal_progress_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';

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

  final goals =
      goalsAsync.whenOrNull(data: (g) => g) ?? const <DailyGoal>[];
  final progress = progressAsync.whenOrNull(data: (p) => p);

  return ScreenContext(
    route: match.location,
    displayName: 'Trang chủ',
    barPlaceholder: 'Hôm nay học gì nhỉ?',
    data: <String, dynamic>{
      'streak': progress?.currentStreak ?? 0,
      'studyMinutes': progress?.studyMinutes ?? 0,
      'exercisesCompleted': progress?.exercisesCompleted ?? 0,
      'lessonsCompleted': progress?.lessonsCompleted ?? 0,
      'allGoalsMet': progress?.allGoalsMet ?? false,
      'goals': goals
          .map((g) => <String, dynamic>{
                'goalType': g.goalType.value,
                'targetValue': g.targetValue,
                'currentValue': _findCurrentValue(progress, g.goalType),
                'met': _findMet(progress, g.goalType),
              })
          .toList(),
    },
  );
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
