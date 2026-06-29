import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_models.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/courses/:id`. Pulls course detail, module
/// summaries, per-lesson progress and the course-wide custom-practice
/// summary so the AI can ground answers in the learner's current course
/// without a tool call.
ScreenContext courseDetailScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final courseId = match.pathParameters['id'] ?? '';
  final courseAsync = courseId.isEmpty
      ? const AsyncValue<Course>.loading()
      : ref.watch(courseDetailProvider(courseId));
  final progressAsync = ref.watch(userProgressProvider);
  final exerciseSummaryAsync = courseId.isEmpty
      ? const AsyncValue<CourseExerciseSummary>.loading()
      : ref.watch(courseExercisesProvider(courseId));
  final status = asyncLoadStatus(courseAsync);

  final data = <String, dynamic>{
    'screenType': 'courseDetail',
    'courseId': courseId,
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(courseAsync.error);
  } else if (status == 'data') {
    final course = courseAsync.requireValue;
    final progressByLessonId = <String, UserProgress>{
      for (final p in progressAsync.value ?? const <UserProgress>[])
        p.lessonId: p,
    };
    data['course'] = courseContextSummary(course);
    data['modules'] = course.modules
        .map(
          (module) => moduleContextSummary(
            module,
            includeLessons: true,
            lessonProgressByLessonId: progressByLessonId,
          ),
        )
        .toList(growable: false);
  }

  final exerciseStatus = asyncLoadStatus(exerciseSummaryAsync);
  data['practiceStatus'] = exerciseStatus;
  if (exerciseStatus == 'data') {
    data['practice'] =
        courseExerciseSummaryContext(exerciseSummaryAsync.requireValue);
  }

  final courseTitle = courseAsync.whenOrNull(data: (course) => course.title);

  return ScreenContext(
    route: match.location,
    displayName: courseTitle != null
        ? s.assistantCourseTitleParam(courseTitle)
        : s.assistantCourseTitle,
    barPlaceholder: s.assistantCoursePlaceholder,
    data: data,
  );
}
