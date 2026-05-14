import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../data/lesson_repository.dart';
import '../data/exercise_session_service.dart';
import '../domain/lesson_models.dart';
import '../domain/exercise_models.dart';
import '../domain/exercise_set_models.dart';

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
}

final lessonProgressProvider = AsyncNotifierProvider.family<
    LessonProgressNotifier, Map<String, dynamic>?, String>(
  (arg) => LessonProgressNotifier(arg),
);

class LessonExercisesArgs {
  const LessonExercisesArgs({
    required this.lessonId,
    this.setId,
  });

  final String lessonId;
  final String? setId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LessonExercisesArgs &&
          runtimeType == other.runtimeType &&
          lessonId == other.lessonId &&
          setId == other.setId;

  @override
  int get hashCode => Object.hash(lessonId, setId);
}

class LessonExercisesNotifier extends CachedRepository<List<Exercise>>
    with DataChangeBusSubscriber<List<Exercise>> {
  LessonExercisesNotifier(this.args);

  final LessonExercisesArgs args;
  String? resolvedSetId;

  @override
  Duration get ttl => Duration.zero;

  @override
  Future<List<Exercise>> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    final setId = args.setId;
    if (setId != null) {
      resolvedSetId = setId;
      return repo.getExercisesBySet(setId);
    }
    throw Exception('setId is required to load exercises');
  }

  @override
  Future<List<Exercise>> build() async {
    watchTags({'exercise', 'lesson-${args.lessonId}'});
    return super.build();
  }
}

final lessonExercisesProvider =
    AsyncNotifierProvider.family<LessonExercisesNotifier, List<Exercise>,
        LessonExercisesArgs>(
  (arg) => LessonExercisesNotifier(arg),
);

class ExerciseSetsNotifier extends CachedRepository<LessonExerciseSummary>
    with DataChangeBusSubscriber<LessonExerciseSummary> {
  ExerciseSetsNotifier(this.lessonId);

  final String lessonId;

  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<LessonExerciseSummary> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getExerciseSetsByLesson(lessonId);
  }

  @override
  Future<LessonExerciseSummary> build() async {
    watchTags({'exercise-set', 'lesson-$lessonId'});
    return super.build();
  }

  Future<String> regenerateSet(String setId, {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final newSetId = await repo.regenerateExercises(setId, userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set'});
    return newSetId;
  }

  Future<void> deleteSet(String setId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.deleteCustomExerciseSet(setId);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set'});
  }

  Future<ExerciseSetModel> createCustomSet(CustomSetConfig config, {CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    final set = await repo.createCustomSet(lessonId, config, cancelToken: cancelToken);
    return set;
  }

  Future<void> generateSet(String setId, {String? userPrompt, CancelToken? cancelToken}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.generateExercises(setId, userPrompt: userPrompt, cancelToken: cancelToken);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set'});
  }

  Future<void> resetSetProgress(String setId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.resetExerciseSetProgress(setId);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set'});
  }
}

final exerciseSetsProvider =
    AsyncNotifierProvider.family<ExerciseSetsNotifier, LessonExerciseSummary, String>(
  (arg) => ExerciseSetsNotifier(arg),
);

final exerciseSessionServiceProvider = Provider<ExerciseSessionService>((ref) {
  throw UnimplementedError(
    'exerciseSessionServiceProvider must be overridden in main.dart',
  );
});
