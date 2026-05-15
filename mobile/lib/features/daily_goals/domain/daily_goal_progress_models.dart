import 'daily_goal_models.dart';

class GoalProgress {
  const GoalProgress({
    required this.goalType,
    required this.targetValue,
    required this.currentValue,
    required this.met,
  });

  factory GoalProgress.fromJson(Map<String, dynamic> json) {
    return GoalProgress(
      goalType: GoalType.fromString(json['goalType'] as String),
      targetValue: (json['targetValue'] as num).toInt(),
      currentValue: (json['currentValue'] as num).toInt(),
      met: json['met'] as bool,
    );
  }

  final GoalType goalType;
  final int targetValue;
  final int currentValue;
  final bool met;

  double get progress =>
      targetValue > 0 ? (currentValue / targetValue).clamp(0.0, 1.0) : 0.0;

  String get label => '$currentValue/$targetValue ${goalType.unit}';

  Map<String, dynamic> toJson() {
    return {
      'goalType': goalType.value,
      'targetValue': targetValue,
      'currentValue': currentValue,
      'met': met,
    };
  }
}

class DailyGoalProgress {
  const DailyGoalProgress({
    required this.date,
    required this.exercisesCompleted,
    required this.studyMinutes,
    required this.lessonsCompleted,
    required this.allGoalsMet,
    required this.goals,
    required this.currentStreak,
    required this.longestStreak,
  });

  factory DailyGoalProgress.fromJson(Map<String, dynamic> json) {
    return DailyGoalProgress(
      date: json['date'] as String,
      exercisesCompleted: (json['exercisesCompleted'] as num).toInt(),
      studyMinutes: (json['studyMinutes'] as num).toInt(),
      lessonsCompleted: (json['lessonsCompleted'] as num).toInt(),
      allGoalsMet: json['allGoalsMet'] as bool,
      goals: (json['goals'] as List<dynamic>)
          .map((e) => GoalProgress.fromJson(e as Map<String, dynamic>))
          .toList(),
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
    );
  }

  final String date;
  final int exercisesCompleted;
  final int studyMinutes;
  final int lessonsCompleted;
  final bool allGoalsMet;
  final List<GoalProgress> goals;
  final int currentStreak;
  final int longestStreak;

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'exercisesCompleted': exercisesCompleted,
      'studyMinutes': studyMinutes,
      'lessonsCompleted': lessonsCompleted,
      'allGoalsMet': allGoalsMet,
      'goals': goals.map((g) => g.toJson()).toList(),
      'currentStreak': currentStreak,
      'longestStreak': longestStreak,
    };
  }
}
