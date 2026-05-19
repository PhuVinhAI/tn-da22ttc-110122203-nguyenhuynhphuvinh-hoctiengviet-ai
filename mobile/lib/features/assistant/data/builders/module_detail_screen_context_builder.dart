import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/modules/:id`. Pulls module detail and lesson
/// summaries from `moduleDetailProvider` so the AI can answer questions about
/// the current module without a tool call.
ScreenContext moduleDetailScreenContextBuilder(Ref ref, RouteMatch match) {
  final moduleId = match.pathParameters['id'] ?? '';
  final moduleAsync = moduleId.isEmpty
      ? const AsyncValue<CourseModule>.loading()
      : ref.watch(moduleDetailProvider(moduleId));
  final status = asyncLoadStatus(moduleAsync);

  final data = <String, dynamic>{
    'screenType': 'moduleDetail',
    'moduleId': moduleId,
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(moduleAsync.error);
  } else if (status == 'data') {
    final module = moduleAsync.requireValue;
    data['module'] = moduleContextSummary(module);
    data['lessons'] = module.lessons
        .map(lessonContextSummary)
        .toList(growable: false);
    if (module.course != null) {
      data['course'] = courseContextSummary(module.course!);
    }
  }

  final moduleTitle = moduleAsync.whenOrNull(data: (module) => module.title);

  return ScreenContext(
    route: match.location,
    displayName: moduleTitle != null ? 'Module · $moduleTitle' : 'Module',
    barPlaceholder: 'Hỏi về module này?',
    data: data,
  );
}
