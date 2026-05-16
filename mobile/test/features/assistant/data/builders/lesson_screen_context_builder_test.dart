import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/lessons/domain/lesson_models.dart';

class _StubLessonDetailNotifier extends LessonDetailNotifier {
  _StubLessonDetailNotifier(super.lessonId, this._detail);

  final LessonDetail _detail;

  @override
  Future<LessonDetail> build() async => _detail;
}

void main() {
  group('lessonScreenContextBuilder', () {
    test(
      'produces a lesson ScreenContext with title + content summary + '
      'vocab / grammar IDs pulled from the lesson detail provider',
      () async {
        const lessonId = 'lesson-greetings';
        const detail = LessonDetail(
          id: lessonId,
          title: 'Greetings',
          description: 'Learn how to greet politely.',
          lessonType: 'vocabulary',
          orderIndex: 0,
          moduleId: 'mod-1',
          contents: [
            LessonContent(
              id: 'c1',
              contentType: 'phrase',
              vietnameseText: 'Xin chào!',
              orderIndex: 0,
              translation: 'Hello!',
            ),
            LessonContent(
              id: 'c2',
              contentType: 'phrase',
              vietnameseText: 'Tạm biệt!',
              orderIndex: 1,
              translation: 'Goodbye!',
            ),
          ],
          vocabularies: [
            LessonVocabulary(id: 'v1', word: 'xin chào', translation: 'hello'),
            LessonVocabulary(id: 'v2', word: 'tạm biệt', translation: 'bye'),
          ],
          grammarRules: [
            GrammarRule(
              id: 'g1',
              title: 'Greetings',
              explanation: 'Use xin chào in any context.',
            ),
          ],
        );

        final container = ProviderContainer(
          overrides: [
            lessonDetailProvider(lessonId).overrideWith(
              () => _StubLessonDetailNotifier(lessonId, detail),
            ),
          ],
        );
        addTearDown(container.dispose);

        await container.read(lessonDetailProvider(lessonId).future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id',
                location: '/lessons/$lessonId',
                pathParameters: {'id': lessonId},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/lessons/$lessonId');
        expect(ctx.displayName, contains('Greetings'));
        expect(ctx.barPlaceholder, isNotEmpty);
        expect(ctx.data.keys, containsAll(<String>[
          'lessonId',
          'title',
          'description',
          'vocabularyIds',
          'grammarRuleIds',
          'contentSummary',
        ]));
        expect(ctx.data['lessonId'], lessonId);
        expect(ctx.data['title'], 'Greetings');
        expect(ctx.data['vocabularyIds'], ['v1', 'v2']);
        expect(ctx.data['grammarRuleIds'], ['g1']);
        expect(ctx.data['contentSummary'], isA<String>());
        expect(ctx.data['contentSummary'], contains('Xin chào'));
      },
    );

    test(
      'returns a lesson-shaped ScreenContext with empty data while the '
      'lesson detail is still loading',
      () {
        const lessonId = 'lesson-pending';
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/lessons/:id',
                location: '/lessons/$lessonId',
                pathParameters: {'id': lessonId},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/lessons/$lessonId');
        expect(ctx.data['lessonId'], lessonId);
        expect(ctx.data['vocabularyIds'], isEmpty);
        expect(ctx.data['grammarRuleIds'], isEmpty);
      },
    );
  });
}
