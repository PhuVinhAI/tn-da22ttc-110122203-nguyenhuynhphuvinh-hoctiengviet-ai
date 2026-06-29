import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/lessons/domain/exercise_models.dart';
import 'package:linvnix/features/lessons/domain/lesson_models.dart';

class _StubExercises extends ExercisesNotifier {
  _StubExercises(super.lessonId, this._summary);

  final LessonExerciseSummary _summary;

  @override
  Future<LessonExerciseSummary> build() async => _summary;
}

class _StubLessonDetail extends LessonDetailNotifier {
  _StubLessonDetail(super.lessonId, this._detail);

  final LessonDetail _detail;

  @override
  Future<LessonDetail> build() async => _detail;
}

void main() {
  group('exerciseHubScreenContextBuilder', () {
    test('produces exerciseHub context with exercise summaries', () async {
      const lessonId = 'lesson-1';
      const summary = LessonExerciseSummary(
        exercises: [
          ExerciseProgress(
            exerciseId: 'exercise-default',
            title: 'Lesson practice',
            totalQuestions: 10,
            attempted: 5,
            percentComplete: 50,
          ),
          ExerciseProgress(
            exerciseId: 'exercise-custom',
            title: 'Custom drill',
            isCustom: true,
            isAIGenerated: true,
            totalQuestions: 8,
          ),
        ],
      );
      const detail = LessonDetail(
        id: lessonId,
        title: 'Greetings',
        description: 'Say hello',
        orderIndex: 0,
        moduleId: 'mod-1',
      );

      final container = ProviderContainer(
        overrides: [
          exercisesProvider(lessonId)
              .overrideWith(() => _StubExercises(lessonId, summary)),
          lessonDetailProvider(lessonId)
              .overrideWith(() => _StubLessonDetail(lessonId, detail)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(exercisesProvider(lessonId).future);
      await container.read(lessonDetailProvider(lessonId).future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/lessons/:id/exercises',
              location: '/lessons/$lessonId/exercises',
              pathParameters: {'id': lessonId},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'exerciseHub');
      expect(ctx.data['status'], 'data');
      expect(ctx.data['lessonId'], lessonId);
      expect(ctx.data['lessonTitle'], 'Greetings');
      expect(ctx.data['defaultExerciseCount'], 1);
      expect(ctx.data['customExerciseCount'], 1);
      expect(ctx.displayName, contains('Greetings'));

      final defaultExercises = ctx.data['defaultExercises'] as List;
      expect(defaultExercises.first, containsPair('progressState', 'inProgress'));

      final customExercises = ctx.data['customExercises'] as List;
      expect(customExercises.first, containsPair('isCustom', true));
    });
  });
}
