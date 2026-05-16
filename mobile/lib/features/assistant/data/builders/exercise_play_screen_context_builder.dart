import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/screen_context.dart';
import '../current_exercise_attempt_provider.dart';
import '../route_match.dart';

/// `ScreenContext` builder for the three nested exercise-play routes:
/// - `/courses/:id/exercises/play/:setId`
/// - `/modules/:id/exercises/play/:setId`
/// - `/lessons/:id/exercises/play/:setId`
///
/// Pulls the current exercise question + the learner's tentative
/// `userAnswer` from `currentExerciseAttemptProvider`, which the
/// `ExercisePlayScreen` keeps in sync from its own `setState` callbacks.
ScreenContext exercisePlayScreenContextBuilder(Ref ref, RouteMatch match) {
  final attempt = ref.watch(currentExerciseAttemptProvider);
  final setId = match.pathParameters['setId'] ?? '';
  final routePattern = match.routePattern;

  String? lessonId;
  String? moduleId;
  String? courseId;
  if (routePattern.startsWith('/lessons/')) {
    lessonId = match.pathParameters['id'];
  } else if (routePattern.startsWith('/modules/')) {
    moduleId = match.pathParameters['id'];
  } else if (routePattern.startsWith('/courses/')) {
    courseId = match.pathParameters['id'];
  }

  return ScreenContext(
    route: match.location,
    displayName: 'Bài tập',
    barPlaceholder: 'Cần gợi ý?',
    data: <String, dynamic>{
      'setId': setId,
      'lessonId': ?lessonId,
      'moduleId': ?moduleId,
      'courseId': ?courseId,
      'exerciseId': attempt?.exerciseId,
      'exerciseType': attempt?.exerciseType,
      'question': attempt?.question,
      'userAnswer': attempt?.userAnswer,
      'exerciseIndex': attempt?.exerciseIndex,
      'totalExercises': attempt?.totalExercises,
    },
  );
}
