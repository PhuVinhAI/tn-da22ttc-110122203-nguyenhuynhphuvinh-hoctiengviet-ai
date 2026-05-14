enum FocusArea {
  vocabulary('vocabulary'),
  grammar('grammar'),
  both('both');

  const FocusArea(this.value);
  final String value;

  static FocusArea fromString(String value) {
    return FocusArea.values.firstWhere(
      (f) => f.value == value,
      orElse: () => FocusArea.both,
    );
  }

  String get displayName {
    return switch (this) {
      FocusArea.vocabulary => 'Vocabulary',
      FocusArea.grammar => 'Grammar',
      FocusArea.both => 'Both',
    };
  }
}

class CustomSetConfig {
  const CustomSetConfig({
    required this.questionCount,
    required this.exerciseTypes,
    required this.focusArea,
    this.userPrompt,
  });

  factory CustomSetConfig.fromJson(Map<String, dynamic> json) {
    return CustomSetConfig(
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 10,
      exerciseTypes: (json['exerciseTypes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      focusArea: FocusArea.fromString(json['focusArea'] as String? ?? 'both'),
      userPrompt: json['userPrompt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'questionCount': questionCount,
        'exerciseTypes': exerciseTypes,
        'focusArea': focusArea.value,
        if (userPrompt != null) 'userPrompt': userPrompt,
      };

  final int questionCount;
  final List<String> exerciseTypes;
  final FocusArea focusArea;
  final String? userPrompt;
}

class ExerciseSetModel {
  const ExerciseSetModel({
    required this.id,
    this.lessonId,
    required this.title,
    this.moduleId,
    this.courseId,
    this.description,
    this.userPrompt,
    this.isCustom = false,
    this.isAIGenerated = false,
    this.orderIndex = 0,
    this.customConfig,
  });

  factory ExerciseSetModel.fromJson(Map<String, dynamic> json) {
    return ExerciseSetModel(
      id: json['id'] as String,
      lessonId: json['lessonId'] as String?,
      title: json['title'] as String,
      moduleId: json['moduleId'] as String?,
      courseId: json['courseId'] as String?,
      description: json['description'] as String?,
      userPrompt: json['userPrompt'] as String?,
      isCustom: json['isCustom'] as bool? ?? false,
      isAIGenerated: json['isAIGenerated'] as bool? ?? false,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      customConfig: json['customConfig'] != null
          ? CustomSetConfig.fromJson(
              json['customConfig'] as Map<String, dynamic>)
          : null,
    );
  }

  final String id;
  final String? lessonId;
  final String title;
  final String? moduleId;
  final String? courseId;
  final String? description;
  final String? userPrompt;
  final bool isCustom;
  final bool isAIGenerated;
  final int orderIndex;
  final CustomSetConfig? customConfig;
}

class SetProgress {
  const SetProgress({
    required this.setId,
    required this.title,
    this.description,
    this.userPrompt,
    this.isCustom = false,
    this.isAIGenerated = false,
    this.totalExercises = 0,
    this.attempted = 0,
    this.correct = 0,
    this.percentComplete = 0,
    this.percentCorrect = 0,
  });

  factory SetProgress.fromJson(Map<String, dynamic> json) {
    return SetProgress(
      setId: json['setId'] as String? ?? '',
      title: json['title'] as String,
      description: json['description'] as String?,
      userPrompt: json['userPrompt'] as String?,
      isCustom: json['isCustom'] as bool? ?? false,
      isAIGenerated: json['isAIGenerated'] as bool? ?? false,
      totalExercises: (json['totalExercises'] as num?)?.toInt() ?? 0,
      attempted: (json['attempted'] as num?)?.toInt() ?? 0,
      correct: (json['correct'] as num?)?.toInt() ?? 0,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0,
      percentCorrect: (json['percentCorrect'] as num?)?.toDouble() ?? 0,
    );
  }

  final String setId;
  final String title;
  final String? description;
  final String? userPrompt;
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

class LessonExerciseSummary {
  const LessonExerciseSummary({
    required this.sets,
  });

  factory LessonExerciseSummary.fromJson(Map<String, dynamic> json) {
    return LessonExerciseSummary(
      sets: (json['sets'] as List<dynamic>?)
              ?.map((e) => SetProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final List<SetProgress> sets;

  List<SetProgress> get defaultSets =>
      sets.where((s) => !s.isCustom).toList();

  List<SetProgress> get customSets =>
      sets.where((s) => s.isCustom).toList();
}

class ModuleExerciseSummary {
  const ModuleExerciseSummary({
    required this.eligible,
    required this.completedLessonsCount,
    required this.totalLessonsCount,
    required this.moduleSets,
  });

  factory ModuleExerciseSummary.fromJson(Map<String, dynamic> json) {
    return ModuleExerciseSummary(
      eligible: json['eligible'] as bool? ?? false,
      completedLessonsCount:
          (json['completedLessonsCount'] as num?)?.toInt() ?? 0,
      totalLessonsCount: (json['totalLessonsCount'] as num?)?.toInt() ?? 0,
      moduleSets: (json['moduleSets'] as List<dynamic>?)
              ?.map((e) => SetProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final bool eligible;
  final int completedLessonsCount;
  final int totalLessonsCount;
  final List<SetProgress> moduleSets;
}

class CourseExerciseSummary {
  const CourseExerciseSummary({
    required this.eligible,
    required this.completedModulesCount,
    required this.totalModulesCount,
    required this.courseSets,
  });

  factory CourseExerciseSummary.fromJson(Map<String, dynamic> json) {
    return CourseExerciseSummary(
      eligible: json['eligible'] as bool? ?? false,
      completedModulesCount:
          (json['completedModulesCount'] as num?)?.toInt() ?? 0,
      totalModulesCount: (json['totalModulesCount'] as num?)?.toInt() ?? 0,
      courseSets: (json['courseSets'] as List<dynamic>?)
              ?.map((e) => SetProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final bool eligible;
  final int completedModulesCount;
  final int totalModulesCount;
  final List<SetProgress> courseSets;
}

class SetProgressDetail {
  const SetProgressDetail({
    this.totalExercises = 0,
    this.attempted = 0,
    this.correct = 0,
    this.percentCorrect = 0,
    this.percentComplete = 0,
  });

  factory SetProgressDetail.fromJson(Map<String, dynamic> json) {
    return SetProgressDetail(
      totalExercises: (json['totalExercises'] as num?)?.toInt() ?? 0,
      attempted: (json['attempted'] as num?)?.toInt() ?? 0,
      correct: (json['correct'] as num?)?.toInt() ?? 0,
      percentCorrect: (json['percentCorrect'] as num?)?.toDouble() ?? 0,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0,
    );
  }

  final int totalExercises;
  final int attempted;
  final int correct;
  final double percentCorrect;
  final double percentComplete;
}
