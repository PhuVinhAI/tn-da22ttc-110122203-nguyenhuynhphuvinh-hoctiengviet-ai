import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/lessons/domain/exercise_models.dart';
import 'package:linvnix/features/lessons/domain/question_models.dart';

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

class _TestExercisesNotifier extends ExercisesNotifier {
  int fetchCallCount = 0;

  _TestExercisesNotifier(super.lessonId);

  @override
  Future<LessonExerciseSummary> build() async {
    watchTags({'question', 'lesson-$lessonId'});
    fetchCallCount++;
    return const LessonExerciseSummary(
      exercises: [],
    );
  }
}

final _testExercisesProvider =
    AsyncNotifierProvider.family<_TestExercisesNotifier, LessonExerciseSummary, String>(
  (arg) => _TestExercisesNotifier(arg),
);

class _TestLessonExercisesNotifier extends LessonExercisesNotifier {
  int fetchCallCount = 0;

  _TestLessonExercisesNotifier(super.args);

  @override
  Future<List<Question>> build() async {
    watchTags({'question', 'lesson-${args.lessonId}'});
    fetchCallCount++;
    return const [];
  }
}

final _testLessonExercisesProvider =
    AsyncNotifierProvider.family<_TestLessonExercisesNotifier,
        List<Question>, LessonExercisesArgs>(
  (arg) => _TestLessonExercisesNotifier(arg),
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

  group('ExercisesNotifier', () {
    test('subscribes to DataChangeBus tag exercise and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExercisesProvider('lesson-1').notifier,
      );

      await container.read(_testExercisesProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'question'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExercisesProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('subscribes to DataChangeBus tag lesson-id and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExercisesProvider('lesson-1').notifier,
      );

      await container.read(_testExercisesProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container
          .read(dataChangeBusProvider.notifier)
          .emit({'lesson-lesson-1'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExercisesProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testExercisesProvider('lesson-1').notifier,
      );

      await container.read(_testExercisesProvider('lesson-1').future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'lesson-other'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testExercisesProvider('lesson-1').future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });

  group('LessonExercisesNotifier', () {
    test('subscribes to DataChangeBus tag exercise and auto-refetches',
        () async {
      final container = ProviderContainer();
      final args = LessonExercisesArgs(
        lessonId: 'lesson-1',
        exerciseId: 'set-1',
      );
      final notifier = container.read(
        _testLessonExercisesProvider(args).notifier,
      );

      await container.read(_testLessonExercisesProvider(args).future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'question'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonExercisesProvider(args).future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('subscribes to DataChangeBus tag lesson-id and auto-refetches',
        () async {
      final container = ProviderContainer();
      final args = LessonExercisesArgs(
        lessonId: 'lesson-1',
        exerciseId: 'set-1',
      );
      final notifier = container.read(
        _testLessonExercisesProvider(args).notifier,
      );

      await container.read(_testLessonExercisesProvider(args).future);
      expect(notifier.fetchCallCount, 1);

      container
          .read(dataChangeBusProvider.notifier)
          .emit({'lesson-lesson-1'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonExercisesProvider(args).future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final args = LessonExercisesArgs(
        lessonId: 'lesson-1',
        exerciseId: 'set-1',
      );
      final notifier = container.read(
        _testLessonExercisesProvider(args).notifier,
      );

      await container.read(_testLessonExercisesProvider(args).future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'lesson-other'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testLessonExercisesProvider(args).future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });
}
