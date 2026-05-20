import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/courses/:id`. Pulls course detail and module
/// summaries from `courseDetailProvider` so the AI can ground answers in the
/// learner's current course without a tool call.
ScreenContext courseDetailScreenContextBuilder(Ref ref, RouteMatch match) {
  final courseId = match.pathParameters['id'] ?? '';
  final courseAsync = courseId.isEmpty
      ? const AsyncValue<Course>.loading()
      : ref.watch(courseDetailProvider(courseId));
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
    data['course'] = courseContextSummary(course);
    data['modules'] = course.modules
        .map((module) => moduleContextSummary(module, includeLessons: true))
        .toList(growable: false);
  }

  final courseTitle = courseAsync.whenOrNull(data: (course) => course.title);

  return ScreenContext(
    route: match.location,
    displayName: courseTitle != null ? 'Course · $courseTitle' : 'Course',
    barPlaceholder: 'Ask about this course?',
    data: data,
  );
}
