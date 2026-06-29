import 'package:flutter/material.dart';
import 'question_models.dart';

abstract class QuestionRenderer {
  const QuestionRenderer();

  QuestionType get type;

  bool get showsQuestion => true;

  bool validateAnswer(Question question, dynamic answer);

  Map<String, dynamic> buildAnswerPayload(dynamic answer);

  Widget buildQuestion(Question question, BuildContext context);

  Widget buildInput(
    Question question,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  );
}
