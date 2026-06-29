import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_models.dart';
import '../../../lessons/domain/lesson_models.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../exercise_hub_view_state_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/lessons/:id/exercises`. Pulls lesson title
/// and exercise progress from existing providers, plus the transient
/// busy / error / generating state pushed by the hub screen, so the AI can
/// answer practice-hub questions without a tool call.
ScreenContext exerciseHubScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final lessonId = match.pathParameters['id'] ?? '';
  final exercisesAsync = lessonId.isEmpty
      ? const AsyncValue<LessonExerciseSummary>.loading()
      : ref.watch(exercisesProvider(lessonId));
  final lessonAsync = lessonId.isEmpty
      ? const AsyncValue<LessonDetail>.loading()
      : ref.watch(lessonDetailProvider(lessonId));
  final hubView = ref.watch(exerciseHubViewStateProvider);
  final status = asyncLoadStatus(exercisesAsync);

  final data = <String, dynamic>{
    'screenType': 'exerciseHub',
    'lessonId': lessonId,
    'status': status,
    'lessonTitle': lessonAsync.whenOrNull(data: (lesson) => lesson.title) ?? '',
    'isGeneratingCustomExercise': hubView.isCreatingCustom,
    if (hubView.busyExerciseId != null) 'busyExerciseId': hubView.busyExerciseId,
    if (hubView.busyAction != null) 'busyAction': hubView.busyAction,
    if (hubView.actionError != null && hubView.actionError!.isNotEmpty)
      'actionError': hubView.actionError,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(exercisesAsync.error);
    data['defaultExerciseCount'] = 0;
    data['customExerciseCount'] = 0;
    data['defaultExercises'] = const <Map<String, dynamic>>[];
    data['customExercises'] = const <Map<String, dynamic>>[];
    data['isEmpty'] = true;
  } else if (status == 'loading') {
    data['defaultExerciseCount'] = 0;
    data['customExerciseCount'] = 0;
    data['defaultExercises'] = const <Map<String, dynamic>>[];
    data['customExercises'] = const <Map<String, dynamic>>[];
    data['isEmpty'] = false;
  } else {
    final summary = exercisesAsync.requireValue;
    final defaultExercises = summary.defaultExercises;
    final customExercises = summary.customExercises;
    data['defaultExerciseCount'] = defaultExercises.length;
    data['customExerciseCount'] = customExercises.length;
    data['defaultExercises'] = defaultExercises
        .map(exerciseProgressContextSummary)
        .toList(growable: false);
    data['customExercises'] =
        customExercises.map(exerciseProgressContextSummary).toList(growable: false);
    data['isEmpty'] = defaultExercises.isEmpty && customExercises.isEmpty;
  }

  final lessonTitle = lessonAsync.whenOrNull(data: (lesson) => lesson.title);

  return ScreenContext(
    route: match.location,
    displayName: lessonTitle != null
        ? s.assistantPracticeTitleParam(lessonTitle)
        : s.assistantPracticeTitle,
    barPlaceholder: s.assistantPracticePlaceholder,
    data: data,
  );
}
