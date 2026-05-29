import 'package:flutter/material.dart';

enum GoalType {
  exercises('EXERCISES'),
  simulations('SIMULATIONS'),
  lessons('LESSONS');

  const GoalType(this.value);
  final String value;

  static GoalType fromString(String value) {
    return GoalType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => GoalType.exercises,
    );
  }

  String get unit => switch (this) {
        GoalType.exercises => 'exercises',
        GoalType.simulations => 'simulations',
        GoalType.lessons => 'lessons',
      };

  int get defaultTarget => switch (this) {
        GoalType.exercises => 10,
        GoalType.simulations => 3,
        GoalType.lessons => 2,
      };

  (int, int) get range => switch (this) {
        GoalType.exercises => (1, 50),
        GoalType.simulations => (1, 10),
        GoalType.lessons => (1, 10),
      };

  int get step => switch (this) {
        GoalType.exercises => 1,
        GoalType.simulations => 1,
        GoalType.lessons => 1,
      };

  IconData get icon => switch (this) {
        GoalType.exercises => Icons.fitness_center,
        GoalType.simulations => Icons.forum,
        GoalType.lessons => Icons.menu_book,
      };
}

class DailyGoal {
  const DailyGoal({
    required this.id,
    required this.goalType,
    required this.targetValue,
  });

  factory DailyGoal.fromJson(Map<String, dynamic> json) {
    return DailyGoal(
      id: json['id'] as String,
      goalType: GoalType.fromString(json['goalType'] as String),
      targetValue: (json['targetValue'] as num).toInt(),
    );
  }

  final String id;
  final GoalType goalType;
  final int targetValue;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'goalType': goalType.value,
      'targetValue': targetValue,
    };
  }

  DailyGoal copyWith({int? targetValue}) {
    return DailyGoal(
      id: id,
      goalType: goalType,
      targetValue: targetValue ?? this.targetValue,
    );
  }
}
