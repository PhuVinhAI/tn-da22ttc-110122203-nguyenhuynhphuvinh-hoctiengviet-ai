import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/daily_goals/data/daily_goal_progress_providers.dart';
import 'package:linvnix/features/daily_goals/data/daily_goals_providers.dart';
import 'package:linvnix/features/daily_goals/domain/daily_goal_models.dart';
import 'package:linvnix/features/daily_goals/domain/daily_goal_progress_models.dart';

class _StubDailyGoalsNotifier extends DailyGoalsNotifier {
  _StubDailyGoalsNotifier(this._goals);

  final List<DailyGoal> _goals;

  @override
  Future<List<DailyGoal>> build() async => _goals;
}

class _StubDailyGoalProgressNotifier extends DailyGoalProgressNotifier {
  _StubDailyGoalProgressNotifier(this._progress);

  final DailyGoalProgress _progress;

  @override
  Future<DailyGoalProgress> build() async => _progress;
}

void main() {
  group('homeScreenContextBuilder', () {
    test(
      'produces a home ScreenContext with daily-goals snapshot + streak '
      'pulled from the daily-goals providers',
      () async {
        final goals = [
          const DailyGoal(
            id: 'g1',
            goalType: GoalType.exercises,
            targetValue: 10,
          ),
          const DailyGoal(
            id: 'g2',
            goalType: GoalType.studyMinutes,
            targetValue: 15,
          ),
        ];
        const progress = DailyGoalProgress(
          date: '2026-05-16',
          exercisesCompleted: 7,
          studyMinutes: 12,
          lessonsCompleted: 1,
          allGoalsMet: false,
          goals: [],
          currentStreak: 5,
          longestStreak: 8,
        );

        final container = ProviderContainer(
          overrides: [
            dailyGoalsProvider.overrideWith(() => _StubDailyGoalsNotifier(goals)),
            dailyGoalProgressProvider.overrideWith(
              () => _StubDailyGoalProgressNotifier(progress),
            ),
          ],
        );
        addTearDown(container.dispose);

        // Wait for the async providers to materialise their values.
        await container.read(dailyGoalsProvider.future);
        await container.read(dailyGoalProgressProvider.future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(routePattern: '/', location: '/'),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/');
        expect(ctx.displayName, isNotEmpty);
        expect(ctx.barPlaceholder, isNotEmpty);
        expect(ctx.data.keys, containsAll(<String>[
          'goals',
          'streak',
          'studyMinutes',
          'exercisesCompleted',
          'allGoalsMet',
        ]));
        expect(ctx.data['streak'], 5);
        expect(ctx.data['studyMinutes'], 12);
        expect(ctx.data['exercisesCompleted'], 7);
        expect(ctx.data['allGoalsMet'], false);
        expect(ctx.data['goals'], hasLength(2));
        expect(
          (ctx.data['goals'] as List).first,
          containsPair('goalType', 'EXERCISES'),
        );
        expect(
          (ctx.data['goals'] as List).first,
          containsPair('targetValue', 10),
        );
      },
    );

    test(
      'gracefully renders an empty data snapshot while providers are loading',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(routePattern: '/', location: '/'),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/');
        // Defensive: while AsyncValue is loading, the data map must still
        // expose its expected keys (callers should not crash on null).
        expect(ctx.data['streak'], 0);
        expect(ctx.data['goals'], isEmpty);
      },
    );
  });
}
