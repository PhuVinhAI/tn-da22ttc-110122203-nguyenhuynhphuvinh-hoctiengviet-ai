import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/current_question_attempt_provider.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';

void main() {
  group('exercisePlayScreenContextBuilder', () {
    test(
      'on /lessons/:id/exercises/play/:exerciseId pulls exerciseId + lessonId from '
      'the route and current question + userAnswer from the in-flight '
      'attempt provider',
      () {
        const attempt = CurrentQuestionAttempt(
          exerciseId: 'set-1',
          lessonId: 'lesson-1',
          questionId: 'ex-3',
          questionType: 'fill_blank',
          question: 'Điền vào chỗ trống: Xin ___ !',
          userAnswer: ['chào'],
          exerciseIndex: 2,
          totalQuestions: 5,
        );

        final container = ProviderContainer(
          overrides: [
            currentQuestionAttemptProvider
                .overrideWith(() => _StubAttemptNotifier(attempt)),
          ],
        );
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:exerciseId',
                location: '/lessons/lesson-1/exercises/play/set-1',
                pathParameters: {'id': 'lesson-1', 'exerciseId': 'set-1'},
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
          'screenType',
          'exerciseId',
          'lessonId',
          'questionId',
          'question',
          'userAnswer',
          'exerciseIndex',
          'totalQuestions',
        ]));
        expect(ctx.data['screenType'], 'exercisePlay');
        expect(ctx.data['exerciseId'], 'set-1');
        expect(ctx.data['lessonId'], 'lesson-1');
        expect(ctx.data['questionId'], 'ex-3');
        expect(ctx.data['question'], contains('Xin'));
        expect(ctx.data['userAnswer'], ['chào']);
        expect(ctx.data['exerciseIndex'], 2);
        expect(ctx.data['totalQuestions'], 5);
      },
    );

    test(
      'on /modules/:id/exercises/play/:exerciseId pulls exerciseId + moduleId from '
      'the route',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/modules/:id/exercises/play/:exerciseId',
                location: '/modules/mod-1/exercises/play/set-2',
                pathParameters: {'id': 'mod-1', 'exerciseId': 'set-2'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/modules/mod-1/exercises/play/set-2');
        expect(ctx.data.keys, containsAll(<String>[
          'exerciseId',
          'moduleId',
        ]));
        expect(ctx.data['exerciseId'], 'set-2');
        expect(ctx.data['moduleId'], 'mod-1');
      },
    );

    test(
      'on /courses/:id/exercises/play/:exerciseId pulls exerciseId + courseId from '
      'the route',
      () {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/courses/:id/exercises/play/:exerciseId',
                location: '/courses/c-1/exercises/play/set-3',
                pathParameters: {'id': 'c-1', 'exerciseId': 'set-3'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/courses/c-1/exercises/play/set-3');
        expect(ctx.data.keys, containsAll(<String>[
          'exerciseId',
          'courseId',
        ]));
        expect(ctx.data['exerciseId'], 'set-3');
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
                routePattern: '/lessons/:id/exercises/play/:exerciseId',
                location: '/lessons/lesson-9/exercises/play/set-9',
                pathParameters: {'id': 'lesson-9', 'exerciseId': 'set-9'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['exerciseId'], 'set-9');
        expect(ctx.data['lessonId'], 'lesson-9');
        expect(ctx.data['question'], isNull);
        expect(ctx.data['userAnswer'], isNull);
      },
    );

    test(
      'forwards listening-exercise options (audioUrl, transcriptType) so the '
      'AI can ground hints in the audio prompt',
      () {
        const attempt = CurrentQuestionAttempt(
          exerciseId: 'set-listen',
          lessonId: 'lesson-1',
          questionId: 'ex-listen-1',
          questionType: 'listening',
          question: 'Nghe và viết lại câu sau',
          userAnswer: 'xin chào',
          exerciseIndex: 0,
          totalQuestions: 3,
          options: {
            'audioUrl': '/media/listen-1.mp3',
            'transcriptType': 'exact',
            'keywords': ['chào'],
          },
        );

        final container = ProviderContainer(
          overrides: [
            currentQuestionAttemptProvider
                .overrideWith(() => _StubAttemptNotifier(attempt)),
          ],
        );
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:exerciseId',
                location: '/lessons/lesson-1/exercises/play/set-listen',
                pathParameters: {'id': 'lesson-1', 'exerciseId': 'set-listen'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['questionType'], 'listening');
        final options = ctx.data['options'] as Map<String, dynamic>;
        expect(options['audioUrl'], '/media/listen-1.mp3');
        expect(options['transcriptType'], 'exact');
        expect(options['keywords'], ['chào']);
        expect(ctx.data['submitted'], false);
      },
    );

    test(
      'forwards speaking-exercise options (promptText, promptAudioUrl) and '
      'records that the learner has not submitted yet',
      () {
        const attempt = CurrentQuestionAttempt(
          exerciseId: 'set-speak',
          lessonId: 'lesson-1',
          questionId: 'ex-speak-1',
          questionType: 'speaking',
          question: 'Đọc to câu sau',
          userAnswer: '',
          exerciseIndex: 1,
          totalQuestions: 4,
          options: {
            'promptText': 'Xin chào, tôi tên là Nam',
            'promptAudioUrl': '/media/speak-1.mp3',
            'transcriptType': 'exact',
          },
        );

        final container = ProviderContainer(
          overrides: [
            currentQuestionAttemptProvider
                .overrideWith(() => _StubAttemptNotifier(attempt)),
          ],
        );
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:exerciseId',
                location: '/lessons/lesson-1/exercises/play/set-speak',
                pathParameters: {'id': 'lesson-1', 'exerciseId': 'set-speak'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['questionType'], 'speaking');
        final options = ctx.data['options'] as Map<String, dynamic>;
        expect(options['promptText'], contains('Xin chào'));
        expect(options['promptAudioUrl'], '/media/speak-1.mp3');
        expect(ctx.data['submitted'], false);
        expect(ctx.data['isCorrect'], isNull);
      },
    );

    test(
      'after submit, exposes correctAnswer + explanation + grading so the AI '
      'can explain mistakes',
      () {
        const attempt = CurrentQuestionAttempt(
          exerciseId: 'set-listen',
          lessonId: 'lesson-1',
          questionId: 'ex-listen-1',
          questionType: 'listening',
          question: 'Nghe và viết lại câu sau',
          userAnswer: 'xin chao',
          exerciseIndex: 0,
          totalQuestions: 3,
          options: {
            'audioUrl': '/media/listen-1.mp3',
            'transcriptType': 'exact',
          },
          submitted: true,
          isCorrect: false,
          score: 0,
          correctAnswer: {'transcript': 'xin chào'},
          explanation: 'Đừng quên dấu huyền trên "chào"',
        );

        final container = ProviderContainer(
          overrides: [
            currentQuestionAttemptProvider
                .overrideWith(() => _StubAttemptNotifier(attempt)),
          ],
        );
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id/exercises/play/:exerciseId',
                location: '/lessons/lesson-1/exercises/play/set-listen',
                pathParameters: {'id': 'lesson-1', 'exerciseId': 'set-listen'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['submitted'], true);
        expect(ctx.data['isCorrect'], false);
        expect(ctx.data['score'], 0);
        final correct = ctx.data['correctAnswer'] as Map<String, dynamic>;
        expect(correct['transcript'], 'xin chào');
        expect(ctx.data['explanation'], contains('dấu huyền'));
      },
    );
  });
}

class _StubAttemptNotifier extends CurrentQuestionAttemptNotifier {
  _StubAttemptNotifier(this._attempt);

  final CurrentQuestionAttempt _attempt;

  @override
  CurrentQuestionAttempt? build() => _attempt;
}
