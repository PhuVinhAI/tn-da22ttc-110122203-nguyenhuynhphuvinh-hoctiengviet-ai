import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_models.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/modules/:id`. Pulls module detail, lesson
/// summaries with per-lesson progress, and the module-wide custom-practice
/// summary so the AI can answer questions about the current module without
/// a tool call.
ScreenContext moduleDetailScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final moduleId = match.pathParameters['id'] ?? '';
  final moduleAsync = moduleId.isEmpty
      ? const AsyncValue<CourseModule>.loading()
      : ref.watch(moduleDetailProvider(moduleId));
  final progressAsync = ref.watch(userProgressProvider);
  final exerciseSummaryAsync = moduleId.isEmpty
      ? const AsyncValue<ModuleExerciseSummary>.loading()
      : ref.watch(moduleExercisesProvider(moduleId));
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
    final progressByLessonId = <String, UserProgress>{
      for (final p in progressAsync.value ?? const <UserProgress>[])
        p.lessonId: p,
    };
    data['module'] = moduleContextSummary(
      module,
      lessonProgressByLessonId: progressByLessonId,
    );
    data['lessons'] = module.lessons
        .map((l) => lessonContextSummary(l, progress: progressByLessonId[l.id]))
        .toList(growable: false);
    if (module.course != null) {
      data['course'] = courseContextSummary(module.course!);
    }
  }

  final exerciseStatus = asyncLoadStatus(exerciseSummaryAsync);
  data['practiceStatus'] = exerciseStatus;
  if (exerciseStatus == 'data') {
    data['practice'] =
        moduleExerciseSummaryContext(exerciseSummaryAsync.requireValue);
  }

  final moduleTitle = moduleAsync.whenOrNull(data: (module) => module.title);

  return ScreenContext(
    route: match.location,
    displayName: moduleTitle != null
        ? s.assistantModuleTitleParam(moduleTitle)
        : s.assistantModuleTitle,
    barPlaceholder: s.assistantModulePlaceholder,
    data: data,
  );
}
