import 'dart:convert';

import 'question_session_codec.dart';

class QuestionSession {
  const QuestionSession({
    required this.exerciseId,
    required this.lessonId,
    required this.currentIndex,
    required this.answers,
    required this.results,
    required this.questions,
    this.createdAt,
    this.updatedAt,
  });

  factory QuestionSession.fromMap(Map<dynamic, dynamic> map) {
    final answersRaw = map['answers'] as Map<dynamic, dynamic>?;
    final resultsRaw = map['results'] as Map<dynamic, dynamic>?;

    int parseKey(dynamic k) {
      if (k is int) return k;
      if (k is num) return k.toInt();
      if (k is String) return int.tryParse(k) ?? 0;
      return 0;
    }

    final questionsRaw = map['questions'] ?? map['exercises'];
    final questions = (questionsRaw as List<dynamic>?)
            ?.map((e) => Map<String, dynamic>.from(e as Map<dynamic, dynamic>))
            .toList() ??
        const <Map<String, dynamic>>[];

    return QuestionSession(
      exerciseId: map['exerciseId'] as String,
      lessonId: map['lessonId'] as String,
      currentIndex: (map['currentIndex'] as num?)?.toInt() ?? 0,
      answers: QuestionSessionCodec.decodeAnswers(answersRaw, questions),
      results: resultsRaw?.map((k, v) => MapEntry<int, Map<String, dynamic>>(
            parseKey(k),
            Map<String, dynamic>.from(v as Map<dynamic, dynamic>),
          )) ??
          const {},
      questions: questions,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
      updatedAt: map['updatedAt'] != null
          ? DateTime.tryParse(map['updatedAt'] as String)
          : null,
    );
  }

  final String exerciseId;
  final String lessonId;
  final int currentIndex;
  final Map<int, dynamic> answers;
  final Map<int, Map<String, dynamic>> results;
  final List<Map<String, dynamic>> questions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Map<String, dynamic> toMap() {
    final encodedAnswers = QuestionSessionCodec.encodeAnswers(answers, questions);
    final root = <String, dynamic>{
      'exerciseId': exerciseId,
      'lessonId': lessonId,
      'currentIndex': currentIndex,
      'answers': encodedAnswers,
      'results': results.map((k, v) => MapEntry<String, dynamic>(k.toString(), v)),
      'questions': questions,
      'createdAt': (createdAt ?? DateTime.now()).toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
    return Map<String, dynamic>.from(
      jsonDecode(jsonEncode(root)) as Map,
    );
  }

  QuestionSession copyWith({
    String? exerciseId,
    String? lessonId,
    int? currentIndex,
    Map<int, dynamic>? answers,
    Map<int, Map<String, dynamic>>? results,
    List<Map<String, dynamic>>? questions,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return QuestionSession(
      exerciseId: exerciseId ?? this.exerciseId,
      lessonId: lessonId ?? this.lessonId,
      currentIndex: currentIndex ?? this.currentIndex,
      answers: answers ?? this.answers,
      results: results ?? this.results,
      questions: questions ?? this.questions,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
