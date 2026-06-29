import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../courses/domain/course_models.dart';
import '../../../lessons/domain/exercise_models.dart';

/// Compact, JSON-serializable course summary for assistant screen context.
Map<String, dynamic> courseContextSummary(Course course) {
  return {
    'id': course.id,
    'title': course.title,
    'description': course.description,
    'level': course.level,
    if (course.estimatedHours != null) 'estimatedHours': course.estimatedHours,
    'moduleCount': course.modules.length,
    'lessonCount': _courseLessonCount(course),
  };
}

/// Compact module summary; optionally includes nested lesson summaries.
/// Pass [lessonProgressByLessonId] to embed each lesson's UserProgress
/// status (and aggregate completed-count on the module).
Map<String, dynamic> moduleContextSummary(
  CourseModule module, {
  bool includeLessons = false,
  Map<String, UserProgress>? lessonProgressByLessonId,
}) {
  final summary = <String, dynamic>{
    'id': module.id,
    'title': module.title,
    'description': module.description,
    if (module.estimatedHours != null) 'estimatedHours': module.estimatedHours,
    'lessonCount': module.lessons.length,
  };

  if (lessonProgressByLessonId != null && module.lessons.isNotEmpty) {
    int completed = 0;
    int inProgress = 0;
    for (final lesson in module.lessons) {
      final status = lessonProgressByLessonId[lesson.id]?.status;
      if (status == 'completed') completed++;
      if (status == 'in_progress') inProgress++;
    }
    summary['completedLessonCount'] = completed;
    summary['inProgressLessonCount'] = inProgress;
    summary['isCompleted'] = completed == module.lessons.length;
    summary['hasProgress'] = completed > 0 || inProgress > 0;
  }

  if (includeLessons && module.lessons.isNotEmpty) {
    summary['lessons'] = module.lessons
        .map(
          (l) => lessonContextSummary(
            l,
            progress: lessonProgressByLessonId?[l.id],
          ),
        )
        .toList(growable: false);
  }
  return summary;
}

/// Compact lesson summary for assistant screen context.
Map<String, dynamic> lessonContextSummary(
  Lesson lesson, {
  UserProgress? progress,
}) {
  return {
    'id': lesson.id,
    'title': lesson.title,
    'description': lesson.description,
    'orderIndex': lesson.orderIndex,
    if (lesson.estimatedDuration != null)
      'estimatedDuration': lesson.estimatedDuration,
    if (progress != null) ...{
      'status': progress.status,
      if (progress.score != null) 'score': progress.score,
      if (progress.completedAt != null)
        'completedAt': progress.completedAt!.toIso8601String(),
    },
  };
}

/// Compact exercise-progress summary lifted from the existing exercise hub
/// builder so course/module detail builders can share it.
Map<String, dynamic> exerciseProgressContextSummary(ExerciseProgress exercise) {
  return {
    'exerciseId': exercise.exerciseId,
    'title': exercise.title,
    if (exercise.description != null && exercise.description!.isNotEmpty)
      'description': exercise.description,
    'isCustom': exercise.isCustom,
    'isAIGenerated': exercise.isAIGenerated,
    'totalQuestions': exercise.totalQuestions,
    'attempted': exercise.attempted,
    'percentComplete': exercise.percentComplete,
    'percentCorrect': exercise.percentCorrect,
    'progressState': exercise.isCompleted
        ? 'completed'
        : exercise.isInProgress
            ? 'inProgress'
            : 'notStarted',
  };
}

/// Compact representation of `CourseExerciseSummary` — used by the
/// course-detail builder to surface "X / Y modules completed", eligibility,
/// and the per-course custom-practice exercise list.
Map<String, dynamic> courseExerciseSummaryContext(
  CourseExerciseSummary summary,
) {
  return {
    'eligible': summary.eligible,
    'completedModulesCount': summary.completedModulesCount,
    'totalModulesCount': summary.totalModulesCount,
    'exercises': summary.courseExercises
        .map(exerciseProgressContextSummary)
        .toList(growable: false),
  };
}

/// Compact representation of `ModuleExerciseSummary` — same as above but
/// scoped to a module.
Map<String, dynamic> moduleExerciseSummaryContext(
  ModuleExerciseSummary summary,
) {
  return {
    'eligible': summary.eligible,
    'completedLessonsCount': summary.completedLessonsCount,
    'totalLessonsCount': summary.totalLessonsCount,
    'exercises': summary.moduleExercises
        .map(exerciseProgressContextSummary)
        .toList(growable: false),
  };
}

int _courseLessonCount(Course course) {
  return course.modules.fold<int>(
    0,
    (sum, module) => sum + module.lessons.length,
  );
}

String asyncLoadStatus<T>(AsyncValue<T> value) {
  return value.when(
    loading: () => 'loading',
    error: (error, stackTrace) => 'error',
    data: (value) => 'data',
  );
}

String shortAsyncError(Object? error) {
  if (error == null) return 'Unknown error';
  final message = error.toString();
  if (message.length <= 200) return message;
  return '${message.substring(0, 197)}...';
}
