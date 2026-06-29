import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';

class _StubCourseDetail extends CourseDetail {
  _StubCourseDetail(this._course);

  final Course _course;

  @override
  Future<Course> build(String id) async => _course;
}

void main() {
  group('courseDetailScreenContextBuilder', () {
    test('produces courseDetail context with module and lesson summaries', () async {
      const courseId = 'course-a1';
      const course = Course(
        id: courseId,
        title: 'Vietnamese A1',
        description: 'Beginner Vietnamese',
        level: 'A1',
        orderIndex: 0,
        isPublished: true,
        modules: [
          CourseModule(
            id: 'mod-1',
            title: 'Greetings',
            description: 'Say hello',
            orderIndex: 0,
            courseId: courseId,
            estimatedHours: 3,
            lessons: [
              Lesson(
                id: 'lesson-1',
                title: 'Hello',
                description: 'Basic greeting',
                orderIndex: 0,
                moduleId: 'mod-1',
              ),
            ],
          ),
        ],
      );

      final container = ProviderContainer(
        overrides: [
          courseDetailProvider(courseId).overrideWith(
            () => _StubCourseDetail(course),
          ),
        ],
      );
      addTearDown(container.dispose);

      await container.read(courseDetailProvider(courseId).future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/courses/:id',
              location: '/courses/$courseId',
              pathParameters: {'id': courseId},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.route, '/courses/$courseId');
      expect(ctx.displayName, contains('Vietnamese A1'));
      expect(ctx.data['screenType'], 'courseDetail');
      expect(ctx.data['courseId'], courseId);
      expect(ctx.data['status'], 'data');

      final courseSummary = ctx.data['course'] as Map<String, dynamic>;
      expect(courseSummary['title'], 'Vietnamese A1');
      expect(courseSummary['moduleCount'], 1);

      final modules = ctx.data['modules'] as List;
      expect(modules, hasLength(1));
      expect(modules.first, containsPair('title', 'Greetings'));
      expect(modules.first, containsPair('topic', 'Daily life'));
      expect((modules.first as Map)['lessons'], hasLength(1));
    });

    test('returns loading snapshot while course detail is pending', () {
      const courseId = 'course-pending';
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/courses/:id',
              location: '/courses/$courseId',
              pathParameters: {'id': courseId},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'courseDetail');
      expect(ctx.data['courseId'], courseId);
      expect(ctx.data['status'], 'loading');
      expect(ctx.data.containsKey('course'), isFalse);
      expect(ctx.data.containsKey('modules'), isFalse);
    });
  });
}
