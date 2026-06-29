import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';

class _StubModuleDetail extends ModuleDetail {
  _StubModuleDetail(this._module);

  final CourseModule _module;

  @override
  Future<CourseModule> build(String id) async => _module;
}

void main() {
  group('moduleDetailScreenContextBuilder', () {
    test('produces moduleDetail context with lesson summaries', () async {
      const moduleId = 'mod-greetings';
      const module = CourseModule(
        id: moduleId,
        title: 'Greetings',
        description: 'Say hello politely',
        orderIndex: 0,
        courseId: 'course-a1',
        estimatedHours: 2,
        course: Course(
          id: 'course-a1',
          title: 'Vietnamese A1',
          description: 'Beginner Vietnamese',
          level: 'A1',
          orderIndex: 0,
          isPublished: true,
        ),
        lessons: [
          Lesson(
            id: 'lesson-1',
            title: 'Hello',
            description: 'Basic greeting',
            orderIndex: 0,
            moduleId: moduleId,
          ),
          Lesson(
            id: 'lesson-2',
            title: 'Goodbye',
            description: 'Leave politely',
            orderIndex: 1,
            moduleId: moduleId,
          ),
        ],
      );

      final container = ProviderContainer(
        overrides: [
          moduleDetailProvider(moduleId).overrideWith(
            () => _StubModuleDetail(module),
          ),
        ],
      );
      addTearDown(container.dispose);

      await container.read(moduleDetailProvider(moduleId).future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/modules/:id',
              location: '/modules/$moduleId',
              pathParameters: {'id': moduleId},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.route, '/modules/$moduleId');
      expect(ctx.displayName, contains('Greetings'));
      expect(ctx.data['screenType'], 'moduleDetail');
      expect(ctx.data['moduleId'], moduleId);
      expect(ctx.data['status'], 'data');

      final moduleSummary = ctx.data['module'] as Map<String, dynamic>;
      expect(moduleSummary['title'], 'Greetings');
      expect(moduleSummary['lessonCount'], 2);

      final lessons = ctx.data['lessons'] as List;
      expect(lessons, hasLength(2));
      expect(lessons.first, containsPair('title', 'Hello'));

      final courseSummary = ctx.data['course'] as Map<String, dynamic>;
      expect(courseSummary['title'], 'Vietnamese A1');
    });

    test('returns loading snapshot while module detail is pending', () {
      const moduleId = 'mod-pending';
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/modules/:id',
              location: '/modules/$moduleId',
              pathParameters: {'id': moduleId},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'moduleDetail');
      expect(ctx.data['moduleId'], moduleId);
      expect(ctx.data['status'], 'loading');
      expect(ctx.data.containsKey('module'), isFalse);
      expect(ctx.data.containsKey('lessons'), isFalse);
    });
  });
}
