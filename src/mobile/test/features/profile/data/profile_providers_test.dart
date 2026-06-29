import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';
import 'package:linvnix/features/profile/data/profile_providers.dart';
import 'package:linvnix/features/profile/domain/exercise_stats.dart';

class _TestExerciseStatsNotifier extends ExerciseStatsNotifier {
  int fetchCallCount = 0;

  @override
  Future<ExerciseStats> build() async {
    watchTags({'question'});
    fetchCallCount++;
    return const ExerciseStats(
      totalQuestions: 0,
      completedExercises: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalTimeSpent: 0,
    );
  }
}

final _testExerciseStatsProvider =
    AsyncNotifierProvider<_TestExerciseStatsNotifier, ExerciseStats>(
  _TestExerciseStatsNotifier.new,
);

void main() {
  group('ExerciseStatsNotifier', () {
    test('subscribes to DataChangeBus tag exercise and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExerciseStatsProvider.notifier,
      );

      await container.read(_testExerciseStatsProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'question'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExerciseStatsProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExerciseStatsProvider.notifier,
      );

      await container.read(_testExerciseStatsProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'progress'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExerciseStatsProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });
}
