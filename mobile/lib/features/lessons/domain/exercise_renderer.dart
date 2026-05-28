import 'package:flutter/material.dart';
import 'exercise_models.dart';

abstract class ExerciseRenderer {
  const ExerciseRenderer();

  ExerciseType get type;

  bool get showsQuestion => true;

  bool validateAnswer(Exercise exercise, dynamic answer);

  Map<String, dynamic> buildAnswerPayload(dynamic answer);

  Widget buildQuestion(Exercise exercise, BuildContext context);

  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  );
}
