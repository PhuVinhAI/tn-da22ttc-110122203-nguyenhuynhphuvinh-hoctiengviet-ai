import 'package:flutter/foundation.dart';

enum QuestionType {
  multipleChoice('multiple_choice'),
  fillBlank('fill_blank'),
  matching('matching'),
  ordering('ordering'),
  translation('translation'),
  listening('listening'),
  speaking('speaking');

  const QuestionType(this.value);
  final String value;

  static QuestionType fromString(String value) {
    return QuestionType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => QuestionType.multipleChoice,
    );
  }

  int get timerSeconds {
    switch (this) {
      case QuestionType.multipleChoice:
        return 60;
      case QuestionType.fillBlank:
        return 60;
      case QuestionType.matching:
        return 90;
      case QuestionType.ordering:
        return 120;
      case QuestionType.translation:
        return 180;
      case QuestionType.listening:
        return 180;
      case QuestionType.speaking:
        return 180;
    }
  }
}

class Question {
  const Question({
    required this.id,
    required this.questionType,
    required this.options,
    required this.correctAnswer,
    this.question,
    this.questionAudioUrl,
    this.explanation,
    this.orderIndex = 0,
    this.acceptsWithoutDiacritics = false,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    final typeStr = json['questionType'] as String;
    final type = QuestionType.fromString(typeStr);
    return Question(
      id: json['id'] as String,
      questionType: type,
      question: json['question'] as String?,
      questionAudioUrl: json['questionAudioUrl'] as String?,
      options: QuestionOptions.fromJson(
        type,
        json['options'] as Map<String, dynamic>?,
      ),
      correctAnswer: QuestionAnswer.fromJson(
        type,
        json['correctAnswer'] as Map<String, dynamic>?,
      ),
      explanation: json['explanation'] as String?,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      acceptsWithoutDiacritics: json['acceptsWithoutDiacritics'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'questionType': questionType.value,
      'question': question,
      'questionAudioUrl': questionAudioUrl,
      'options': options.toJson(),
      'correctAnswer': correctAnswer.toJson(),
      'explanation': explanation,
      'orderIndex': orderIndex,
      'acceptsWithoutDiacritics': acceptsWithoutDiacritics,
    };
  }

  final String id;
  final QuestionType questionType;
  final String? question;
  final String? questionAudioUrl;
  final QuestionOptions options;
  final QuestionAnswer correctAnswer;
  final String? explanation;
  final int orderIndex;
  final bool acceptsWithoutDiacritics;
}

@immutable
sealed class QuestionOptions {
  const QuestionOptions();

  factory QuestionOptions.fromJson(
    QuestionType type,
    Map<String, dynamic>? json,
  ) {
    if (json == null) {
      return switch (type) {
        QuestionType.multipleChoice => const MultipleChoiceOptions(choices: []),
        QuestionType.fillBlank => const FillBlankOptions(
          sentence: '',
          blanks: 1,
        ),
        QuestionType.matching => const MatchingOptions(pairs: []),
        QuestionType.ordering => const OrderingOptions(items: []),
        QuestionType.translation => const TranslationOptions(
          sourceText: '',
          sourceLanguage: '',
          targetLanguage: '',
        ),
        QuestionType.listening => const ListeningOptions(
          audioUrl: '',
          transcriptType: 'exact',
        ),
        QuestionType.speaking => const SpeakingOptions(
          promptAudioUrl: '',
          transcriptType: 'exact',
        ),
      };
    }
    return switch (type) {
      QuestionType.multipleChoice => MultipleChoiceOptions.fromJson(json),
      QuestionType.fillBlank => FillBlankOptions.fromJson(json),
      QuestionType.matching => MatchingOptions.fromJson(json),
      QuestionType.ordering => OrderingOptions.fromJson(json),
      QuestionType.translation => TranslationOptions.fromJson(json),
      QuestionType.listening => ListeningOptions.fromJson(json),
      QuestionType.speaking => SpeakingOptions.fromJson(json),
    };
  }

  Map<String, dynamic> toJson();
}

class MultipleChoiceOptions extends QuestionOptions {
  const MultipleChoiceOptions({required this.choices});
  factory MultipleChoiceOptions.fromJson(Map<String, dynamic> json) {
    return MultipleChoiceOptions(
      choices:
          (json['choices'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
  final List<String> choices;

  @override
  Map<String, dynamic> toJson() => {'choices': choices};
}

class FillBlankOptions extends QuestionOptions {
  const FillBlankOptions({
    required this.sentence,
    required this.blanks,
    this.acceptedAnswers,
    this.wordBank = const <String>[],
  });
  factory FillBlankOptions.fromJson(Map<String, dynamic> json) {
    return FillBlankOptions(
      sentence: json['sentence'] as String? ?? '',
      blanks: (json['blanks'] as num?)?.toInt() ?? 1,
      acceptedAnswers: (json['acceptedAnswers'] as List<dynamic>?)
          ?.map(
            (group) =>
                (group as List<dynamic>).map((e) => e as String).toList(),
          )
          .toList(),
      wordBank:
          (json['wordBank'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const <String>[],
    );
  }
  final String sentence;
  final int blanks;
  final List<List<String>>? acceptedAnswers;
  final List<String> wordBank;

  @override
  Map<String, dynamic> toJson() => {
    'sentence': sentence,
    'blanks': blanks,
    'acceptedAnswers': acceptedAnswers,
    'wordBank': wordBank,
  };
}

class MatchingOptions extends QuestionOptions {
  const MatchingOptions({required this.pairs});
  factory MatchingOptions.fromJson(Map<String, dynamic> json) {
    return MatchingOptions(
      pairs:
          (json['pairs'] as List<dynamic>?)
              ?.map((e) => MatchPair.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
  final List<MatchPair> pairs;

  @override
  Map<String, dynamic> toJson() => {
    'pairs': pairs.map((p) => {'left': p.left, 'right': p.right}).toList(),
  };
}

class OrderingOptions extends QuestionOptions {
  const OrderingOptions({required this.items});
  factory OrderingOptions.fromJson(Map<String, dynamic> json) {
    return OrderingOptions(
      items:
          (json['items'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          [],
    );
  }
  final List<String> items;

  @override
  Map<String, dynamic> toJson() => {'items': items};
}

class TranslationOptions extends QuestionOptions {
  const TranslationOptions({
    required this.sourceText,
    required this.sourceLanguage,
    required this.targetLanguage,
    this.acceptedTranslations,
  });
  factory TranslationOptions.fromJson(Map<String, dynamic> json) {
    return TranslationOptions(
      sourceText: json['sourceText'] as String? ?? '',
      sourceLanguage: json['sourceLanguage'] as String? ?? '',
      targetLanguage: json['targetLanguage'] as String? ?? '',
      acceptedTranslations: (json['acceptedTranslations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );
  }
  final String sourceText;
  final String sourceLanguage;
  final String targetLanguage;
  final List<String>? acceptedTranslations;

  @override
  Map<String, dynamic> toJson() => {
    'sourceText': sourceText,
    'sourceLanguage': sourceLanguage,
    'targetLanguage': targetLanguage,
    'acceptedTranslations': acceptedTranslations,
  };
}

class ListeningOptions extends QuestionOptions {
  const ListeningOptions({
    required this.audioUrl,
    required this.transcriptType,
    this.keywords,
  });
  factory ListeningOptions.fromJson(Map<String, dynamic> json) {
    return ListeningOptions(
      audioUrl: json['audioUrl'] as String? ?? '',
      transcriptType: json['transcriptType'] as String? ?? 'exact',
      keywords: (json['keywords'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );
  }
  final String audioUrl;
  final String transcriptType;
  final List<String>? keywords;

  @override
  Map<String, dynamic> toJson() => {
    'audioUrl': audioUrl,
    'transcriptType': transcriptType,
    'keywords': keywords,
  };
}

class SpeakingOptions extends QuestionOptions {
  const SpeakingOptions({
    this.promptText,
    required this.promptAudioUrl,
    required this.transcriptType,
    this.keywords,
  });
  factory SpeakingOptions.fromJson(Map<String, dynamic> json) {
    return SpeakingOptions(
      promptText: json['promptText'] as String?,
      promptAudioUrl: json['promptAudioUrl'] as String? ?? '',
      transcriptType: json['transcriptType'] as String? ?? 'exact',
      keywords: (json['keywords'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );
  }
  final String? promptText;
  final String promptAudioUrl;
  final String transcriptType;
  final List<String>? keywords;

  @override
  Map<String, dynamic> toJson() => {
    'promptText': promptText,
    'promptAudioUrl': promptAudioUrl,
    'transcriptType': transcriptType,
    'keywords': keywords,
  };
}

class MatchPair {
  const MatchPair({required this.left, required this.right});
  factory MatchPair.fromJson(Map<String, dynamic> json) {
    return MatchPair(
      left: json['left'] as String,
      right: json['right'] as String,
    );
  }
  final String left;
  final String right;

  Map<String, dynamic> toJson() => {'left': left, 'right': right};
}

@immutable
sealed class QuestionAnswer {
  const QuestionAnswer();

  factory QuestionAnswer.fromJson(
    QuestionType type,
    Map<String, dynamic>? json,
  ) {
    if (json == null) {
      return switch (type) {
        QuestionType.multipleChoice => const MultipleChoiceAnswer(
          selectedChoice: '',
        ),
        QuestionType.fillBlank => const FillBlankAnswer(answers: []),
        QuestionType.matching => const MatchingAnswer(matches: []),
        QuestionType.ordering => const OrderingAnswer(orderedItems: []),
        QuestionType.translation => const TranslationAnswer(translation: ''),
        QuestionType.listening => const ListeningAnswer(transcript: ''),
        QuestionType.speaking => const SpeakingAnswer(transcript: ''),
      };
    }
    return switch (type) {
      QuestionType.multipleChoice => MultipleChoiceAnswer.fromJson(json),
      QuestionType.fillBlank => FillBlankAnswer.fromJson(json),
      QuestionType.matching => MatchingAnswer.fromJson(json),
      QuestionType.ordering => OrderingAnswer.fromJson(json),
      QuestionType.translation => TranslationAnswer.fromJson(json),
      QuestionType.listening => ListeningAnswer.fromJson(json),
      QuestionType.speaking => SpeakingAnswer.fromJson(json),
    };
  }

  Map<String, dynamic> toJson();
}

class MultipleChoiceAnswer extends QuestionAnswer {
  const MultipleChoiceAnswer({required this.selectedChoice});
  factory MultipleChoiceAnswer.fromJson(Map<String, dynamic> json) {
    return MultipleChoiceAnswer(
      selectedChoice: json['selectedChoice'] as String? ?? '',
    );
  }
  final String selectedChoice;

  @override
  Map<String, dynamic> toJson() => {'selectedChoice': selectedChoice};
}

class FillBlankAnswer extends QuestionAnswer {
  const FillBlankAnswer({required this.answers});
  factory FillBlankAnswer.fromJson(Map<String, dynamic> json) {
    return FillBlankAnswer(
      answers:
          (json['answers'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
  final List<String> answers;

  @override
  Map<String, dynamic> toJson() => {'answers': answers};
}

class MatchingAnswer extends QuestionAnswer {
  const MatchingAnswer({required this.matches});
  factory MatchingAnswer.fromJson(Map<String, dynamic> json) {
    return MatchingAnswer(
      matches:
          (json['matches'] as List<dynamic>?)
              ?.map((e) => MatchPair.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
  final List<MatchPair> matches;

  @override
  Map<String, dynamic> toJson() => {
    'matches': matches.map((m) => {'left': m.left, 'right': m.right}).toList(),
  };
}

class OrderingAnswer extends QuestionAnswer {
  const OrderingAnswer({required this.orderedItems});
  factory OrderingAnswer.fromJson(Map<String, dynamic> json) {
    return OrderingAnswer(
      orderedItems:
          (json['orderedItems'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
  final List<String> orderedItems;

  @override
  Map<String, dynamic> toJson() => {'orderedItems': orderedItems};
}

class TranslationAnswer extends QuestionAnswer {
  const TranslationAnswer({required this.translation});
  factory TranslationAnswer.fromJson(Map<String, dynamic> json) {
    return TranslationAnswer(translation: json['translation'] as String? ?? '');
  }
  final String translation;

  @override
  Map<String, dynamic> toJson() => {'translation': translation};
}

class ListeningAnswer extends QuestionAnswer {
  const ListeningAnswer({required this.transcript});
  factory ListeningAnswer.fromJson(Map<String, dynamic> json) {
    return ListeningAnswer(transcript: json['transcript'] as String? ?? '');
  }
  final String transcript;

  @override
  Map<String, dynamic> toJson() => {'transcript': transcript};
}

class SpeakingAnswer extends QuestionAnswer {
  const SpeakingAnswer({required this.transcript});
  factory SpeakingAnswer.fromJson(Map<String, dynamic> json) {
    return SpeakingAnswer(transcript: json['transcript'] as String? ?? '');
  }
  final String transcript;

  @override
  Map<String, dynamic> toJson() => {'transcript': transcript};
}

class ExerciseSubmissionResult {
  const ExerciseSubmissionResult({
    required this.id,
    required this.isCorrect,
    required this.score,
    this.userAnswer,
    this.timeTaken,
    this.attemptedAt,
  });

  factory ExerciseSubmissionResult.fromJson(Map<String, dynamic> json) {
    return ExerciseSubmissionResult(
      id: json['id'] as String,
      isCorrect: json['isCorrect'] as bool? ?? false,
      score: (json['score'] as num?)?.toInt() ?? 0,
      userAnswer: json['userAnswer'],
      timeTaken: (json['timeTaken'] as num?)?.toInt(),
      attemptedAt: json['attemptedAt'] != null
          ? DateTime.tryParse(json['attemptedAt'] as String)
          : null,
    );
  }

  final String id;
  final bool isCorrect;
  final int score;
  final dynamic userAnswer;
  final int? timeTaken;
  final DateTime? attemptedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'isCorrect': isCorrect,
      'score': score,
      'userAnswer': userAnswer,
      'timeTaken': timeTaken,
      'attemptedAt': attemptedAt?.toIso8601String(),
    };
  }
}
