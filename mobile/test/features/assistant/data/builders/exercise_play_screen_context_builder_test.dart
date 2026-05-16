import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/current_exercise_attempt_provider.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';

void main() {
  group('exercisePlayScreenContextBuilder', () {
    test(
      'on /lessons/:id/exercises/play/:setId pulls setId + lessonId from '
      'the route and current question + userAnswer from the in-flight '
      'attempt provider',
      () {
        const attempt = CurrentExerciseAttempt(
          setId: 'set-1',
          lessonId: 'lesson-1',
          exerciseId: 'ex-3',
          exerciseType: 'fill_blank',
          question: 'Điền vào chỗ trống: Xin ___ !',
          userAnswer: ['chào'],
          exerciseIndex: 2,
          totalExercises: 5,
        );

        final container = ProviderContainer(
          overrides: [
            currentExerciseAttemptProvider
                .overrideWith(() => _StubAttemptNotifier(attempt)),
          ],
        );
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:setId',
                location: '/lessons/lesson-1/exercises/play/set-1',
                pathParameters: {'id': 'lesson-1', 'setId': 'set-1'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(
          ctx.route,
          '/lessons/lesson-1/exercises/play/set-1',
        );
        expect(ctx.displayName, isNotEmpty);
        expect(ctx.barPlaceholder, isNotEmpty);
        expect(ctx.data.keys, containsAll(<String>[
          'setId',
          'lessonId',
          'exerciseId',
          'question',
          'userAnswer',
          'exerciseIndex',
          'totalExercises',
        ]));
        expect(ctx.data['setId'], 'set-1');
        expect(ctx.data['lessonId'], 'lesson-1');
        expect(ctx.data['exerciseId'], 'ex-3');
        expect(ctx.data['question'], contains('Xin'));
        expect(ctx.data['userAnswer'], ['chào']);
        expect(ctx.data['exerciseIndex'], 2);
        expect(ctx.data['totalExercises'], 5);
      },
    );

    test(
      'on /modules/:id/exercises/play/:setId pulls setId + moduleId from '
      'the route',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/modules/:id/exercises/play/:setId',
                location: '/modules/mod-1/exercises/play/set-2',
                pathParameters: {'id': 'mod-1', 'setId': 'set-2'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/modules/mod-1/exercises/play/set-2');
        expect(ctx.data.keys, containsAll(<String>[
          'setId',
          'moduleId',
        ]));
        expect(ctx.data['setId'], 'set-2');
        expect(ctx.data['moduleId'], 'mod-1');
      },
    );

    test(
      'on /courses/:id/exercises/play/:setId pulls setId + courseId from '
      'the route',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/courses/:id/exercises/play/:setId',
                location: '/courses/c-1/exercises/play/set-3',
                pathParameters: {'id': 'c-1', 'setId': 'set-3'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/courses/c-1/exercises/play/set-3');
        expect(ctx.data.keys, containsAll(<String>[
          'setId',
          'courseId',
        ]));
        expect(ctx.data['setId'], 'set-3');
        expect(ctx.data['courseId'], 'c-1');
      },
    );

    test(
      'returns an exercise-shaped ScreenContext with empty userAnswer / '
      'question when no attempt has been pushed yet',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:setId',
                location: '/lessons/lesson-9/exercises/play/set-9',
                pathParameters: {'id': 'lesson-9', 'setId': 'set-9'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['setId'], 'set-9');
        expect(ctx.data['lessonId'], 'lesson-9');
        expect(ctx.data['question'], isNull);
        expect(ctx.data['userAnswer'], isNull);
      },
    );
  });
}

class _StubAttemptNotifier extends CurrentExerciseAttemptNotifier {
  _StubAttemptNotifier(this._attempt);

  final CurrentExerciseAttempt _attempt;

  @override
  CurrentExerciseAttempt? build() => _attempt;
}
