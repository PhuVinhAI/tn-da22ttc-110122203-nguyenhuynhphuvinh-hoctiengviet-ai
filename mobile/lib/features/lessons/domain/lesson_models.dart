class LessonDetail {
  const LessonDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.lessonType,
    required this.orderIndex,
    required this.moduleId,
    this.estimatedDuration,
    this.isAssessment = false,
    this.contents = const [],
    this.vocabularies = const [],
    this.grammarRules = const [],
    this.exercises = const [],
  });

  factory LessonDetail.fromJson(Map<String, dynamic> json) {
    return LessonDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      lessonType: json['lessonType'] as String,
      orderIndex: (json['orderIndex'] as num).toInt(),
      moduleId: json['moduleId'] as String,
      estimatedDuration: (json['estimatedDuration'] as num?)?.toInt(),
      isAssessment: json['isAssessment'] as bool? ?? false,
      contents: (json['contents'] as List<dynamic>?)
              ?.map((e) => LessonContent.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      vocabularies: (json['vocabularies'] as List<dynamic>?)
              ?.map((e) => LessonVocabulary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      grammarRules: (json['grammarRules'] as List<dynamic>?)
              ?.map((e) => GrammarRule.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      exercises: (json['exercises'] as List<dynamic>?)
              ?.map((e) => ExerciseStub.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final String id;
  final String title;
  final String description;
  final String lessonType;
  final int orderIndex;
  final String moduleId;
  final int? estimatedDuration;
  final bool isAssessment;
  final List<LessonContent> contents;
  final List<LessonVocabulary> vocabularies;
  final List<GrammarRule> grammarRules;
  final List<ExerciseStub> exercises;
}

class LessonContent {
  const LessonContent({
    required this.id,
    required this.contentType,
    required this.vietnameseText,
    required this.orderIndex,
    this.translation,
    this.phonetic,
    this.audioUrl,
    this.imageUrl,
    this.videoUrl,
    this.notes,
  });

  factory LessonContent.fromJson(Map<String, dynamic> json) {
    return LessonContent(
      id: json['id'] as String,
      contentType: json['contentType'] as String,
      vietnameseText: json['vietnameseText'] as String,
      orderIndex: (json['orderIndex'] as num).toInt(),
      translation: json['translation'] as String?,
      phonetic: json['phonetic'] as String?,
      audioUrl: json['audioUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      notes: json['notes'] as String?,
    );
  }

  final String id;
  final String contentType;
  final String vietnameseText;
  final int orderIndex;
  final String? translation;
  final String? phonetic;
  final String? audioUrl;
  final String? imageUrl;
  final String? videoUrl;
  final String? notes;
}

class LessonVocabulary {
  const LessonVocabulary({
    required this.id,
    required this.word,
    required this.translation,
    this.phonetic,
    this.partOfSpeech,
    this.exampleSentence,
    this.exampleTranslation,
    this.audioUrl,
    this.imageUrl,
    this.classifier,
    this.dialectVariants,
    this.audioUrls,
    this.difficultyLevel,
  });

  factory LessonVocabulary.fromJson(Map<String, dynamic> json) {
    return LessonVocabulary(
      id: json['id'] as String,
      word: json['word'] as String,
      translation: json['translation'] as String,
      phonetic: json['phonetic'] as String?,
      partOfSpeech: json['partOfSpeech'] as String?,
      exampleSentence: json['exampleSentence'] as String?,
      exampleTranslation: json['exampleTranslation'] as String?,
      audioUrl: json['audioUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      classifier: json['classifier'] as String?,
      dialectVariants: (json['dialectVariants'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as String)),
      audioUrls: (json['audioUrls'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as String)),
      difficultyLevel: json['difficultyLevel'] as int?,
    );
  }

  final String id;
  final String word;
  final String translation;
  final String? phonetic;
  final String? partOfSpeech;
  final String? exampleSentence;
  final String? exampleTranslation;
  final String? audioUrl;
  final String? imageUrl;
  final String? classifier;
  final Map<String, String>? dialectVariants;
  final Map<String, String>? audioUrls;
  final int? difficultyLevel;
}

class GrammarRule {
  const GrammarRule({
    required this.id,
    required this.title,
    required this.explanation,
    this.structure,
    this.examples = const [],
    this.notes,
    this.difficultyLevel,
  });

  factory GrammarRule.fromJson(Map<String, dynamic> json) {
    return GrammarRule(
      id: json['id'] as String,
      title: json['title'] as String,
      explanation: json['explanation'] as String,
      structure: json['structure'] as String?,
      examples: (json['examples'] as List<dynamic>?)
              ?.map((e) => GrammarExample.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      notes: json['notes'] as String?,
      difficultyLevel: json['difficultyLevel'] as int?,
    );
  }

  final String id;
  final String title;
  final String explanation;
  final String? structure;
  final List<GrammarExample> examples;
  final String? notes;
  final int? difficultyLevel;
}

class GrammarExample {
  const GrammarExample({
    required this.vi,
    required this.en,
    this.note,
  });

  factory GrammarExample.fromJson(Map<String, dynamic> json) {
    return GrammarExample(
      vi: json['vi'] as String,
      en: json['en'] as String,
      note: json['note'] as String?,
    );
  }

  final String vi;
  final String en;
  final String? note;
}

class ExerciseStub {
  const ExerciseStub({
    required this.id,
    required this.exerciseType,
    this.question,
  });

  factory ExerciseStub.fromJson(Map<String, dynamic> json) {
    return ExerciseStub(
      id: json['id'] as String,
      exerciseType: json['exerciseType'] as String,
      question: json['question'] as String?,
    );
  }

  final String id;
  final String exerciseType;
  final String? question;
}
