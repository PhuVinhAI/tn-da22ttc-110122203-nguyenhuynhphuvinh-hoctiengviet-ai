import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Snapshot of the learner's in-flight exercise attempt — i.e. the
/// transient state that lives inside `ExercisePlayScreen` (current
/// question, currently-typed/selected `userAnswer`, position within the
/// set). The screen pushes updates here from its `setState` callbacks; the
/// `exercisePlayScreenContextBuilder` reads them so the AI can give
/// contextual hints without round-tripping through the backend.
@immutable
class CurrentExerciseAttempt {
  const CurrentExerciseAttempt({
    required this.setId,
    this.lessonId,
    this.moduleId,
    this.courseId,
    this.exerciseId,
    this.exerciseType,
    this.question,
    this.userAnswer,
    this.exerciseIndex,
    this.totalExercises,
  });

  final String setId;
  final String? lessonId;
  final String? moduleId;
  final String? courseId;
  final String? exerciseId;
  final String? exerciseType;
  final String? question;

  /// May be a String, num, bool, List, or Map — whatever the renderer
  /// stores. Must remain JSON-serialisable: tools forward this verbatim
  /// to the LLM-side prompt.
  final Object? userAnswer;

  final int? exerciseIndex;
  final int? totalExercises;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'setId': setId,
        'lessonId': ?lessonId,
        'moduleId': ?moduleId,
        'courseId': ?courseId,
        'exerciseId': ?exerciseId,
        'exerciseType': ?exerciseType,
        'question': ?question,
        'userAnswer': ?userAnswer,
        'exerciseIndex': ?exerciseIndex,
        'totalExercises': ?totalExercises,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CurrentExerciseAttempt &&
          setId == other.setId &&
          lessonId == other.lessonId &&
          moduleId == other.moduleId &&
          courseId == other.courseId &&
          exerciseId == other.exerciseId &&
          exerciseType == other.exerciseType &&
          question == other.question &&
          _userAnswerEquals(userAnswer, other.userAnswer) &&
          exerciseIndex == other.exerciseIndex &&
          totalExercises == other.totalExercises;

  @override
  int get hashCode => Object.hash(
        setId,
        lessonId,
        moduleId,
        courseId,
        exerciseId,
        exerciseType,
        question,
        userAnswer is List
            ? Object.hashAll(userAnswer as List)
            : userAnswer is Map
                ? Object.hashAllUnordered((userAnswer as Map).entries)
                : userAnswer,
        exerciseIndex,
        totalExercises,
      );
}

bool _userAnswerEquals(Object? a, Object? b) {
  if (identical(a, b)) return true;
  if (a is List && b is List) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!_userAnswerEquals(a[i], b[i])) return false;
    }
    return true;
  }
  if (a is Map && b is Map) {
    if (a.length != b.length) return false;
    for (final k in a.keys) {
      if (!b.containsKey(k)) return false;
      if (!_userAnswerEquals(a[k], b[k])) return false;
    }
    return true;
  }
  return a == b;
}

class CurrentExerciseAttemptNotifier
    extends Notifier<CurrentExerciseAttempt?> {
  @override
  CurrentExerciseAttempt? build() => null;

  void update(CurrentExerciseAttempt? attempt) {
    state = attempt;
  }

  void clear() {
    state = null;
  }
}

final currentExerciseAttemptProvider = NotifierProvider<
    CurrentExerciseAttemptNotifier, CurrentExerciseAttempt?>(
  CurrentExerciseAttemptNotifier.new,
);
