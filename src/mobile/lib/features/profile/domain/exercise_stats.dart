class ExerciseStats {
  const ExerciseStats({
    required this.totalQuestions,
    required this.completedExercises,
    required this.correctAnswers,
    required this.accuracy,
    required this.totalTimeSpent,
  });

  factory ExerciseStats.fromJson(Map<String, dynamic> json) {
    return ExerciseStats(
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      completedExercises: (json['completedExercises'] as num?)?.toInt() ?? 0,
      correctAnswers: (json['correctAnswers'] as num?)?.toInt() ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      totalTimeSpent: (json['totalTimeSpent'] as num?)?.toInt() ?? 0,
    );
  }

  final int totalQuestions;
  final int completedExercises;
  final int correctAnswers;
  final double accuracy;
  final int totalTimeSpent;

  Map<String, dynamic> toJson() {
    return {
      'totalQuestions': totalQuestions,
      'completedExercises': completedExercises,
      'correctAnswers': correctAnswers,
      'accuracy': accuracy,
      'totalTimeSpent': totalTimeSpent,
    };
  }
}
