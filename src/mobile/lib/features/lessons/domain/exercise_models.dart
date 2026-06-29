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
}

class CustomExerciseConfig {
  const CustomExerciseConfig({
    required this.questionCount,
    required this.questionTypes,
    required this.focusArea,
    this.userPrompt,
  });

  factory CustomExerciseConfig.fromJson(Map<String, dynamic> json) {
    return CustomExerciseConfig(
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 10,
      questionTypes: (json['questionTypes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      focusArea: FocusArea.fromString(json['focusArea'] as String? ?? 'both'),
      userPrompt: json['userPrompt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'questionCount': questionCount,
        'questionTypes': questionTypes,
        'focusArea': focusArea.value,
        if (userPrompt != null) 'userPrompt': userPrompt,
      };

  final int questionCount;
  final List<String> questionTypes;
  final FocusArea focusArea;
  final String? userPrompt;
}

class ExerciseModel {
  const ExerciseModel({
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

  factory ExerciseModel.fromJson(Map<String, dynamic> json) {
    return ExerciseModel(
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
          ? CustomExerciseConfig.fromJson(
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
  final CustomExerciseConfig? customConfig;
}

class ExerciseProgress {
  const ExerciseProgress({
    required this.exerciseId,
    required this.title,
    this.description,
    this.userPrompt,
    this.isCustom = false,
    this.isAIGenerated = false,
    this.totalQuestions = 0,
    this.attempted = 0,
    this.correct = 0,
    this.percentComplete = 0,
    this.percentCorrect = 0,
  });

  factory ExerciseProgress.fromJson(Map<String, dynamic> json) {
    return ExerciseProgress(
      exerciseId: json['exerciseId'] as String? ?? '',
      title: json['title'] as String,
      description: json['description'] as String?,
      userPrompt: json['userPrompt'] as String?,
      isCustom: json['isCustom'] as bool? ?? false,
      isAIGenerated: json['isAIGenerated'] as bool? ?? false,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      attempted: (json['attempted'] as num?)?.toInt() ?? 0,
      correct: (json['correct'] as num?)?.toInt() ?? 0,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0,
      percentCorrect: (json['percentCorrect'] as num?)?.toDouble() ?? 0,
    );
  }

  final String exerciseId;
  final String title;
  final String? description;
  final String? userPrompt;
  final bool isCustom;
  final bool isAIGenerated;
  final int totalQuestions;
  final int attempted;
  final int correct;
  final double percentComplete;
  final double percentCorrect;

  bool get isCompleted => percentComplete == 100;
  bool get isInProgress => attempted > 0 && !isCompleted;
  bool get isNotStarted => attempted == 0;
}

class LessonExerciseSummary {
  const LessonExerciseSummary({
    required this.exercises,
  });

  factory LessonExerciseSummary.fromJson(Map<String, dynamic> json) {
    final raw = json['exercises'];
    return LessonExerciseSummary(
      exercises: (raw as List<dynamic>?)
              ?.map((e) => ExerciseProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final List<ExerciseProgress> exercises;

  List<ExerciseProgress> get defaultExercises =>
      exercises.where((s) => !s.isCustom).toList();

  List<ExerciseProgress> get customExercises =>
      exercises.where((s) => s.isCustom).toList();
}

class ModuleExerciseSummary {
  const ModuleExerciseSummary({
    required this.eligible,
    required this.completedLessonsCount,
    required this.totalLessonsCount,
    required this.moduleExercises,
  });

  factory ModuleExerciseSummary.fromJson(Map<String, dynamic> json) {
    return ModuleExerciseSummary(
      eligible: json['eligible'] as bool? ?? false,
      completedLessonsCount:
          (json['completedLessonsCount'] as num?)?.toInt() ?? 0,
      totalLessonsCount: (json['totalLessonsCount'] as num?)?.toInt() ?? 0,
      moduleExercises: (json['moduleExercises'] as List<dynamic>?)
              ?.map((e) => ExerciseProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final bool eligible;
  final int completedLessonsCount;
  final int totalLessonsCount;
  final List<ExerciseProgress> moduleExercises;
}

class CourseExerciseSummary {
  const CourseExerciseSummary({
    required this.eligible,
    required this.completedModulesCount,
    required this.totalModulesCount,
    required this.courseExercises,
  });

  factory CourseExerciseSummary.fromJson(Map<String, dynamic> json) {
    return CourseExerciseSummary(
      eligible: json['eligible'] as bool? ?? false,
      completedModulesCount:
          (json['completedModulesCount'] as num?)?.toInt() ?? 0,
      totalModulesCount: (json['totalModulesCount'] as num?)?.toInt() ?? 0,
      courseExercises: (json['courseExercises'] as List<dynamic>?)
              ?.map((e) => ExerciseProgress.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  final bool eligible;
  final int completedModulesCount;
  final int totalModulesCount;
  final List<ExerciseProgress> courseExercises;
}

class ExerciseProgressDetail {
  const ExerciseProgressDetail({
    this.totalQuestions = 0,
    this.attempted = 0,
    this.correct = 0,
    this.percentCorrect = 0,
    this.percentComplete = 0,
  });

  factory ExerciseProgressDetail.fromJson(Map<String, dynamic> json) {
    return ExerciseProgressDetail(
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      attempted: (json['attempted'] as num?)?.toInt() ?? 0,
      correct: (json['correct'] as num?)?.toInt() ?? 0,
      percentCorrect: (json['percentCorrect'] as num?)?.toDouble() ?? 0,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0,
    );
  }

  final int totalQuestions;
  final int attempted;
  final int correct;
  final double percentCorrect;
  final double percentComplete;
}
