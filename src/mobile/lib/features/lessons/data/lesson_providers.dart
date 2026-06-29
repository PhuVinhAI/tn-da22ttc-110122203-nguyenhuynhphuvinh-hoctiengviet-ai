import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../data/lesson_repository.dart';
import '../data/question_session_service.dart';
import '../domain/exercise_models.dart';
import '../domain/lesson_models.dart';
import '../domain/question_models.dart';

final lessonRepositoryProvider = Provider<LessonRepository>((ref) {
  return LessonRepository(ref.watch(dioProvider));
});

class LessonDetailNotifier extends AsyncNotifier<LessonDetail>
    with CachedNotifierMixin<LessonDetail>, DataChangeBusSubscriber<LessonDetail> {
  LessonDetailNotifier(this.lessonId);

  final String lessonId;

  Future<LessonDetail> _doFetch() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getLessonDetail(lessonId);
  }

  @override
  Future<LessonDetail> build() async {
    watchTags({'lesson-$lessonId'});
    return fetchCached(_doFetch, const Duration(minutes: 10));
  }
}

final lessonDetailProvider =
    AsyncNotifierProvider.family<LessonDetailNotifier, LessonDetail, String>(
  (arg) => LessonDetailNotifier(arg),
);

class LessonVocabularyNotifier extends AsyncNotifier<List<LessonVocabulary>>
    with CachedNotifierMixin<List<LessonVocabulary>>,
        DataChangeBusSubscriber<List<LessonVocabulary>> {
  LessonVocabularyNotifier(this.lessonId);

  final String lessonId;

  Future<List<LessonVocabulary>> _doFetch() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getVocabulariesByLesson(lessonId);
  }

  @override
  Future<List<LessonVocabulary>> build() async {
    watchTags({'lesson-$lessonId'});
    return fetchCached(_doFetch, const Duration(minutes: 5));
  }
}

final lessonVocabulariesProvider = AsyncNotifierProvider.family<
    LessonVocabularyNotifier, List<LessonVocabulary>, String>(
  (arg) => LessonVocabularyNotifier(arg),
);

class LessonProgressNotifier extends AsyncNotifier<Map<String, dynamic>?>
    with CachedNotifierMixin<Map<String, dynamic>?>,
        DataChangeBusSubscriber<Map<String, dynamic>?> {
  LessonProgressNotifier(this.lessonId);

  final String lessonId;

  Future<Map<String, dynamic>?> _doFetch() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getLessonProgress(lessonId);
  }

  @override
  Future<Map<String, dynamic>?> build() async {
    watchTags({'progress', 'lesson-$lessonId'});
    return fetchCached(_doFetch, const Duration(minutes: 1));
  }

  Future<void> startLesson() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.startLesson(lessonId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress'});
  }

  Future<void> markContentReviewed() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.markContentReviewed(lessonId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress'});
  }

  Future<void> completeLesson({int score = 0}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.completeLesson(lessonId, score: score);
    ref.read(dataChangeBusProvider.notifier).emit({'progress'});
  }

  Future<void> addTimeSpent(int additionalTime) async {
    if (additionalTime <= 0) return;
    final repo = ref.read(lessonRepositoryProvider);
    try {
      await repo.updateLessonTimeSpent(lessonId, additionalTime);
    } catch (_) {
      await repo.startLesson(lessonId);
      await repo.updateLessonTimeSpent(lessonId, additionalTime);
    }
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'question'});
  }
}

final lessonProgressProvider = AsyncNotifierProvider.family<
    LessonProgressNotifier, Map<String, dynamic>?, String>(
  (arg) => LessonProgressNotifier(arg),
);

class LessonExercisesArgs {
  const LessonExercisesArgs({
    required this.lessonId,
    this.exerciseId,
  });

  final String lessonId;
  final String? exerciseId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LessonExercisesArgs &&
          runtimeType == other.runtimeType &&
          lessonId == other.lessonId &&
          exerciseId == other.exerciseId;

  @override
  int get hashCode => Object.hash(lessonId, exerciseId);
}

class LessonExercisesNotifier extends CachedRepository<List<Question>>
    with DataChangeBusSubscriber<List<Question>> {
  LessonExercisesNotifier(this.args);

  final LessonExercisesArgs args;
  String? resolvedExerciseId;

  @override
  Duration get ttl => Duration.zero;

  @override
  Future<List<Question>> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    final exerciseId = args.exerciseId;
    if (exerciseId != null) {
      resolvedExerciseId = exerciseId;
      return repo.getQuestionsByExercise(exerciseId);
    }
    throw Exception('exerciseId is required to load exercises');
  }

  @override
  Future<List<Question>> build() async {
    watchTags({'question', 'lesson-${args.lessonId}'});
    return super.build();
  }
}

final lessonExercisesProvider =
    AsyncNotifierProvider.family<LessonExercisesNotifier, List<Question>,
        LessonExercisesArgs>(
  (arg) => LessonExercisesNotifier(arg),
);

class ExercisesNotifier extends CachedRepository<LessonExerciseSummary>
    with DataChangeBusSubscriber<LessonExerciseSummary> {
  ExercisesNotifier(this.lessonId);

  final String lessonId;

  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<LessonExerciseSummary> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getExercisesByLesson(lessonId);
  }

  @override
  Future<LessonExerciseSummary> build() async {
    watchTags({'question', 'lesson-$lessonId'});
    return super.build();
  }

  Future<String> regenerateExercise(String exerciseId, {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final newExerciseId = await repo.regenerateExercises(exerciseId, userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
    return newExerciseId;
  }

  Future<void> deleteExercise(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.deleteCustomExercise(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<ExerciseModel> createCustomExercise(CustomExerciseConfig config, {CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final exercise = await repo.createCustomExercise(lessonId, config, cancelToken: cancelToken);
    return exercise;
  }

  Future<void> generateExercise(String exerciseId, {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.generateExercises(exerciseId, userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<void> resetExerciseProgress(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetExerciseProgress(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }
}

final exercisesProvider =
    AsyncNotifierProvider.family<ExercisesNotifier, LessonExerciseSummary, String>(
  (arg) => ExercisesNotifier(arg),
);

class ModuleExercisesNotifier extends CachedRepository<ModuleExerciseSummary>
    with DataChangeBusSubscriber<ModuleExerciseSummary> {
  ModuleExercisesNotifier(this.moduleId);

  final String moduleId;

  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<ModuleExerciseSummary> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.fetchModuleExercises(moduleId);
  }

  @override
  Future<ModuleExerciseSummary> build() async {
    watchTags({'question', 'module-$moduleId'});
    return super.build();
  }

  Future<ExerciseModel> createCustomExercise(CustomExerciseConfig config,
      {CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final exercise = await repo.createCustomExerciseForModule(moduleId, config,
        cancelToken: cancelToken);
    return exercise;
  }

  Future<void> generateExercise(String exerciseId,
      {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.generateExercises(exerciseId,
        userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<String> regenerateExercise(String exerciseId,
      {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final newExerciseId = await repo.regenerateExercises(exerciseId,
        userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
    return newExerciseId;
  }

  Future<void> deleteExercise(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.deleteCustomExercise(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<void> resetExerciseProgress(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetExerciseProgress(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<void> completeAllModuleProgress() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.completeAllModuleProgress(moduleId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'question'});
  }

  Future<void> resetModuleProgress() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetModuleProgress(moduleId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'question'});
  }
}

final moduleExercisesProvider = AsyncNotifierProvider.family<
    ModuleExercisesNotifier, ModuleExerciseSummary, String>(
  (arg) => ModuleExercisesNotifier(arg),
);

class CourseExercisesNotifier extends CachedRepository<CourseExerciseSummary>
    with DataChangeBusSubscriber<CourseExerciseSummary> {
  CourseExercisesNotifier(this.courseId);

  final String courseId;

  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<CourseExerciseSummary> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.fetchCourseExercises(courseId);
  }

  @override
  Future<CourseExerciseSummary> build() async {
    watchTags({'question', 'course-$courseId'});
    return super.build();
  }

  Future<ExerciseModel> createCustomExercise(CustomExerciseConfig config,
      {CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final exercise = await repo.createCustomExerciseForCourse(courseId, config,
        cancelToken: cancelToken);
    return exercise;
  }

  Future<void> generateExercise(String exerciseId,
      {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.generateExercises(exerciseId,
        userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<String> regenerateExercise(String exerciseId,
      {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final newExerciseId = await repo.regenerateExercises(exerciseId,
        userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
    return newExerciseId;
  }

  Future<void> deleteExercise(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.deleteCustomExercise(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<void> resetExerciseProgress(String exerciseId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetExerciseProgress(exerciseId);
    ref.read(dataChangeBusProvider.notifier).emit({'question'});
  }

  Future<void> completeAllCourseProgress() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.completeAllCourseProgress(courseId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'question'});
  }

  Future<void> resetCourseProgress() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetCourseProgress(courseId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'question'});
  }
}

final courseExercisesProvider = AsyncNotifierProvider.family<
    CourseExercisesNotifier, CourseExerciseSummary, String>(
  (arg) => CourseExercisesNotifier(arg),
);

final questionSessionServiceProvider = Provider<QuestionSessionService>((ref) {
  throw UnimplementedError(
    'questionSessionServiceProvider must be overridden in main.dart',
  );
});
