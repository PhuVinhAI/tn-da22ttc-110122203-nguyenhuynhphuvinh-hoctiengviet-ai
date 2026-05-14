import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/lessons/domain/exercise_set_models.dart';

class _TestLessonProgressNotifier extends LessonProgressNotifier {
  int fetchCallCount = 0;

  _TestLessonProgressNotifier(super.lessonId);

  @override
  Future<Map<String, dynamic>?> build() async {
    watchTags({'progress', 'lesson-$lessonId'});
    fetchCallCount++;
    return <String, dynamic>{
      'status': 'in_progress',
      'lessonId': lessonId,
      'call': fetchCallCount,
    };
  }
}

final _testLessonProgressProvider =
    AsyncNotifierProvider.family<_TestLessonProgressNotifier,
        Map<String, dynamic>?, String>(
  (arg) => _TestLessonProgressNotifier(arg),
);

class _TestExerciseSetsNotifier extends ExerciseSetsNotifier {
  int fetchCallCount = 0;

  _TestExerciseSetsNotifier(super.lessonId);

  @override
  Future<LessonTierSummary> build() async {
    watchTags({'exercise-set', 'lesson-$lessonId'});
    fetchCallCount++;
    return const LessonTierSummary(
      sets: [],
      unlockedTiers: [ExerciseTier.basic],
    );
  }
}

final _testExerciseSetsProvider =
    AsyncNotifierProvider.family<_TestExerciseSetsNotifier, LessonTierSummary, String>(
  (arg) => _TestExerciseSetsNotifier(arg),
);

void main() {
  group('LessonProgressNotifier', () {
    test('fresh provider always fetches from API', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      final value =
          await container.read(_testLessonProgressProvider('lesson-1').future);

      expect(value!['call'], 1);
      expect(notifier.fetchCallCount, 1);
    });

    test('data within TTL returns cached without API call', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      await container.read(_testLessonProgressProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      final secondRead = await container.read(
        _testLessonProgressProvider('lesson-1').future,
      );

      expect(secondRead!['call'], 1);
      expect(notifier.fetchCallCount, 1);
    });

    test('data past TTL refetches from API', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      await container.read(_testLessonProgressProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      notifier.forceExpire();
      container.invalidate(_testLessonProgressProvider('lesson-1'));

      final secondRead = await container.read(
        _testLessonProgressProvider('lesson-1').future,
      );

      expect(secondRead!['call'], 2);
      expect(notifier.fetchCallCount, 2);
    });

    test('subscribes to DataChangeBus tag progress and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      await container.read(_testLessonProgressProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'progress'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonProgressProvider('lesson-1').future,
      );
      expect(secondRead!['call'], 2);
      expect(notifier.fetchCallCount, 2);
    });

    test('subscribes to DataChangeBus tag lesson-id and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      await container.read(_testLessonProgressProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container
          .read(dataChangeBusProvider.notifier)
          .emit({'lesson-lesson-1'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonProgressProvider('lesson-1').future,
      );
      expect(secondRead!['call'], 2);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testLessonProgressProvider('lesson-1').notifier,
      );

      await container.read(_testLessonProgressProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'lesson-other'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonProgressProvider('lesson-1').future,
      );
      expect(secondRead!['call'], 1);
      expect(notifier.fetchCallCount, 1);
    });
  });

  group('ExerciseSetsNotifier', () {
    test('subscribes to DataChangeBus tag exercise-set and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExerciseSetsProvider('lesson-1').notifier,
      );

      await container.read(_testExerciseSetsProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'exercise-set'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExerciseSetsProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('subscribes to DataChangeBus tag lesson-id and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExerciseSetsProvider('lesson-1').notifier,
      );

      await container.read(_testExerciseSetsProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container
          .read(dataChangeBusProvider.notifier)
          .emit({'lesson-lesson-1'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExerciseSetsProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExerciseSetsProvider('lesson-1').notifier,
      );

      await container.read(_testExerciseSetsProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'lesson-other'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExerciseSetsProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });
}
