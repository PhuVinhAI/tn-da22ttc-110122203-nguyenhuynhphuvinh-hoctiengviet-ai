enum ExerciseTier {
  basic('BASIC'),
  easy('EASY'),
  medium('MEDIUM'),
  hard('HARD'),
  expert('EXPERT');

  const ExerciseTier(this.value);
  final String value;

  static ExerciseTier fromString(String value) {
    return ExerciseTier.values.firstWhere(
      (t) => t.value == value,
      orElse: () => ExerciseTier.basic,
    );
  }

  String get displayName {
    return switch (this) {
      ExerciseTier.basic => 'Basic',
      ExerciseTier.easy => 'Easy',
      ExerciseTier.medium => 'Medium',
      ExerciseTier.hard => 'Hard',
      ExerciseTier.expert => 'Expert',
    };
  }
}

class ExerciseSetModel {
  const ExerciseSetModel({
    required this.id,
    required this.lessonId,
    required this.tier,
    required this.title,
    this.isCustom = false,
    this.isAIGenerated = false,
    this.orderIndex = 0,
  });

  factory ExerciseSetModel.fromJson(Map<String, dynamic> json) {
    return ExerciseSetModel(
      id: json['id'] as String,
      lessonId: json['lessonId'] as String,
      tier: ExerciseTier.fromString(json['tier'] as String),
      title: json['title'] as String,
      isCustom: json['isCustom'] as bool? ?? false,
      isAIGenerated: json['isAIGenerated'] as bool? ?? false,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final String lessonId;
  final ExerciseTier tier;
  final String title;
  final bool isCustom;
  final bool isAIGenerated;
  final int orderIndex;
}

class TierProgress {
  const TierProgress({
    required this.tier,
    required this.title,
    this.isCustom = false,
    this.isAIGenerated = false,
    this.totalExercises = 0,
    this.attempted = 0,
    this.correct = 0,
    this.percentComplete = 0,
    this.percentCorrect = 0,
  });

  factory TierProgress.fromJson(Map<String, dynamic> json) {
    return TierProgress(
      tier: ExerciseTier.fromString(json['tier'] as String),
      title: json['title'] as String,
      isCustom: json['isCustom'] as bool? ?? false,
      isAIGenerated: json['isAIGenerated'] as bool? ?? false,
      totalExercises: (json['totalExercises'] as num?)?.toInt() ?? 0,
      attempted: (json['attempted'] as num?)?.toInt() ?? 0,
      correct: (json['correct'] as num?)?.toInt() ?? 0,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0,
      percentCorrect: (json['percentCorrect'] as num?)?.toDouble() ?? 0,
    );
  }

  final ExerciseTier tier;
  final String title;
  final bool isCustom;
  final bool isAIGenerated;
  final int totalExercises;
  final int attempted;
  final int correct;
  final double percentComplete;
  final double percentCorrect;

  bool get isCompleted => percentComplete == 100 && percentCorrect >= 80;
  bool get isInProgress => attempted > 0 && !isCompleted;
  bool get isNotStarted => attempted == 0;
}

class LessonTierSummary {
  const LessonTierSummary({
    required this.sets,
    required this.unlockedTiers,
  });

  factory LessonTierSummary.fromJson(Map<String, dynamic> json) {
    return LessonTierSummary(
      sets: (json['sets'] as List<dynamic>?)
              ?.map((e) => TierProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      unlockedTiers: (json['unlockedTiers'] as List<dynamic>?)
              ?.map((e) => ExerciseTier.fromString(e as String))
              .toList() ??
          const [ExerciseTier.basic],
    );
  }

  final List<TierProgress> sets;
  final List<ExerciseTier> unlockedTiers;

  bool isTierUnlocked(ExerciseTier tier) {
    return unlockedTiers.contains(tier);
  }

  TierProgress? progressForTier(ExerciseTier tier) {
    final idx = sets.indexWhere((s) => s.tier == tier);
    return idx >= 0 ? sets[idx] : null;
  }
}
