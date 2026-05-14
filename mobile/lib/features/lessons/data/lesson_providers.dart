import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../data/lesson_repository.dart';
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
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'lesson-$lessonId'});
  }

  Future<void> markContentReviewed() async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.markContentReviewed(lessonId);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'lesson-$lessonId'});
  }

  Future<void> completeLesson({int score = 0}) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.completeLesson(lessonId, score: score);
    ref.read(dataChangeBusProvider.notifier).emit({'progress', 'lesson-$lessonId'});
  }
}

final lessonProgressProvider = AsyncNotifierProvider.family<
    LessonProgressNotifier, Map<String, dynamic>?, String>(
  (arg) => LessonProgressNotifier(arg),
);

final lessonExercisesProvider =
    FutureProvider.family<List<Exercise>, String>((ref, lessonId) async {
  final repo = ref.watch(lessonRepositoryProvider);
  return repo.getExercisesByLesson(lessonId);
});

class ExerciseSetsNotifier extends CachedRepository<LessonTierSummary>
    with DataChangeBusSubscriber<LessonTierSummary> {
  ExerciseSetsNotifier(this.lessonId);

  final String lessonId;

  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<LessonTierSummary> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getExerciseSetsByLesson(lessonId);
  }

  @override
  Future<LessonTierSummary> build() async {
    watchTags({'exercise-set', 'lesson-$lessonId'});
    return super.build();
  }

  Future<void> generateTier(String tier) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.generateExercisesForTier(lessonId, tier);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set', 'lesson-$lessonId'});
  }

  Future<void> regenerateSet(String setId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.regenerateExercises(setId);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set', 'lesson-$lessonId'});
  }

  Future<void> deleteSet(String setId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.deleteCustomExerciseSet(setId);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set', 'lesson-$lessonId'});
  }

  Future<void> createCustomSet(CustomSetConfig config) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.createCustomSet(lessonId, config);
    ref.read(dataChangeBusProvider.notifier).emit({'exercise-set', 'lesson-$lessonId'});
  }
}

final exerciseSetsProvider =
    AsyncNotifierProvider.family<ExerciseSetsNotifier, LessonTierSummary, String>(
  (arg) => ExerciseSetsNotifier(arg),
);

class ModuleTierSummariesNotifier
    extends CachedRepository<Map<String, TierSummary>>
    with DataChangeBusSubscriber<Map<String, TierSummary>> {
  ModuleTierSummariesNotifier(this.moduleId);

  final String moduleId;

  @override
  Duration get ttl => Duration.zero;

  @override
  Future<Map<String, TierSummary>> fetchFromApi() async {
    final repo = ref.read(lessonRepositoryProvider);
    return repo.getModuleTierSummaries(moduleId);
  }

  @override
  Future<Map<String, TierSummary>> build() async {
    watchTags({'exercise-set'});
    return super.build();
  }
}

final moduleTierSummariesProvider = AsyncNotifierProvider.family<
    ModuleTierSummariesNotifier, Map<String, TierSummary>, String>(
  (arg) => ModuleTierSummariesNotifier(arg),
);
