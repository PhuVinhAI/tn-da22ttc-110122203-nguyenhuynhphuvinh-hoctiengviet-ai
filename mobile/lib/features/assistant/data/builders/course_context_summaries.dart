import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../courses/domain/course_models.dart';

/// Compact, JSON-serializable course summary for assistant screen context.
Map<String, dynamic> courseContextSummary(Course course) {
  return {
    'id': course.id,
    'title': course.title,
    'description': course.description,
    'level': course.level,
    'vietnameseLevelName': course.vietnameseLevelName,
    'estimatedHours': course.estimatedHours,
    'moduleCount': course.modules.length,
    'lessonCount': _courseLessonCount(course),
    'orderIndex': course.orderIndex,
    'isPublished': course.isPublished,
  };
}

/// Compact module summary; optionally includes nested lesson summaries.
Map<String, dynamic> moduleContextSummary(
  CourseModule module, {
  bool includeLessons = false,
}) {
  final summary = <String, dynamic>{
    'id': module.id,
    'title': module.title,
    'description': module.description,
    'topic': module.topic,
    'estimatedHours': module.estimatedHours,
    'lessonCount': module.lessons.length,
  };
  if (includeLessons && module.lessons.isNotEmpty) {
    summary['lessons'] =
        module.lessons.map(lessonContextSummary).toList(growable: false);
  }
  return summary;
}

/// Compact lesson summary for assistant screen context.
Map<String, dynamic> lessonContextSummary(Lesson lesson) {
  return {
    'id': lesson.id,
    'title': lesson.title,
    'description': lesson.description,
    'lessonType': lesson.lessonType,
    'orderIndex': lesson.orderIndex,
    'estimatedDuration': lesson.estimatedDuration,
    'isAssessment': lesson.isAssessment,
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
