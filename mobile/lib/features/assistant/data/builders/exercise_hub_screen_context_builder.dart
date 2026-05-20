import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_set_models.dart';
import '../../../lessons/domain/lesson_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';
import 'exercise_context_summaries.dart';

/// `ScreenContext` builder for `/lessons/:id/exercises`. Pulls lesson title
/// and exercise-set progress from existing providers so the AI can answer
/// practice-hub questions without a tool call.
ScreenContext exerciseHubScreenContextBuilder(Ref ref, RouteMatch match) {
  final lessonId = match.pathParameters['id'] ?? '';
  final setsAsync = lessonId.isEmpty
      ? const AsyncValue<LessonExerciseSummary>.loading()
      : ref.watch(exerciseSetsProvider(lessonId));
  final lessonAsync = lessonId.isEmpty
      ? const AsyncValue<LessonDetail>.loading()
      : ref.watch(lessonDetailProvider(lessonId));
  final status = asyncLoadStatus(setsAsync);

  final data = <String, dynamic>{
    'screenType': 'exerciseHub',
    'lessonId': lessonId,
    'status': status,
    'lessonTitle': lessonAsync.whenOrNull(data: (lesson) => lesson.title) ?? '',
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(setsAsync.error);
    data['defaultSetCount'] = 0;
    data['customSetCount'] = 0;
    data['defaultSets'] = const <Map<String, dynamic>>[];
    data['customSets'] = const <Map<String, dynamic>>[];
  } else if (status == 'loading') {
    data['defaultSetCount'] = 0;
    data['customSetCount'] = 0;
    data['defaultSets'] = const <Map<String, dynamic>>[];
    data['customSets'] = const <Map<String, dynamic>>[];
  } else {
    final summary = setsAsync.requireValue;
    final defaultSets = summary.defaultSets;
    final customSets = summary.customSets;
    data['defaultSetCount'] = defaultSets.length;
    data['customSetCount'] = customSets.length;
    data['defaultSets'] = defaultSets
        .map(setProgressContextSummary)
        .toList(growable: false);
    data['customSets'] =
        customSets.map(setProgressContextSummary).toList(growable: false);
  }

  final lessonTitle = lessonAsync.whenOrNull(data: (lesson) => lesson.title);

  return ScreenContext(
    route: match.location,
    displayName: lessonTitle != null
        ? 'Practice · $lessonTitle'
        : 'Practice',
    barPlaceholder: 'Ask about practice?',
    data: data,
  );
}
