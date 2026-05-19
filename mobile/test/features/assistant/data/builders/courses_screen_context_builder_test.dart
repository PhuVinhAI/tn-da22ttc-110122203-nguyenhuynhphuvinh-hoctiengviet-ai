import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';

class _StubCoursesNotifier extends CoursesNotifier {
  _StubCoursesNotifier(this._courses);

  final List<Course> _courses;

  @override
  Future<List<Course>> build() async => _courses;
}

Course _sampleCourse({
  required String id,
  required String title,
  int moduleCount = 1,
  int lessonsPerModule = 2,
}) {
  return Course(
    id: id,
    title: title,
    description: 'Description for $title',
    level: 'A1',
    orderIndex: 0,
    isPublished: true,
    vietnameseLevelName: 'Sơ cấp',
    estimatedHours: 10,
    modules: List.generate(
      moduleCount,
      (moduleIndex) => CourseModule(
        id: 'mod-$id-$moduleIndex',
        title: 'Module $moduleIndex',
        description: 'Module description',
        orderIndex: moduleIndex,
        courseId: id,
        topic: 'Topic $moduleIndex',
        estimatedHours: 2,
        lessons: List.generate(
          lessonsPerModule,
          (lessonIndex) => Lesson(
            id: 'lesson-$id-$moduleIndex-$lessonIndex',
            title: 'Lesson $lessonIndex',
            description: 'Lesson description',
            lessonType: 'vocabulary',
            orderIndex: lessonIndex,
            moduleId: 'mod-$id-$moduleIndex',
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('coursesScreenContextBuilder', () {
    test('produces coursesList context with compact course summaries', () async {
      final courses = [
        _sampleCourse(id: 'c1', title: 'Vietnamese A1', moduleCount: 4),
        _sampleCourse(id: 'c2', title: 'Vietnamese A2', moduleCount: 2),
      ];

      final container = ProviderContainer(
        overrides: [
          coursesProvider.overrideWith(() => _StubCoursesNotifier(courses)),
        ],
      );
      addTearDown(container.dispose);

      await container.read(coursesProvider.future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(routePattern: '/courses', location: '/courses'),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.route, '/courses');
      expect(ctx.displayName, 'Courses');
      expect(ctx.data['screenType'], 'coursesList');
      expect(ctx.data['status'], 'data');
      expect(ctx.data['courseCount'], 2);

      final summaries = ctx.data['courses'] as List;
      expect(summaries, hasLength(2));
      expect(summaries.first, containsPair('id', 'c1'));
      expect(summaries.first, containsPair('title', 'Vietnamese A1'));
      expect(summaries.first, containsPair('level', 'A1'));
      expect(summaries.first, containsPair('moduleCount', 4));
      expect(summaries.first, containsPair('lessonCount', 8));
      expect(summaries.first, containsPair('vietnameseLevelName', 'Sơ cấp'));
    });

    test('returns loading snapshot with empty courses', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(routePattern: '/courses', location: '/courses'),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'coursesList');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data['courseCount'], 0);
      expect(ctx.data['courses'], isEmpty);
    });
  });
}
