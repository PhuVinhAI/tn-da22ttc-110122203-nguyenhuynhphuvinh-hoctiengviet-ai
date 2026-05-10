import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../data/lesson_repository.dart';
import '../domain/lesson_models.dart';

final lessonRepositoryProvider = Provider<LessonRepository>((ref) {
  return LessonRepository(ref.watch(dioProvider));
});

final lessonDetailProvider =
    FutureProvider.family<LessonDetail, String>((ref, lessonId) async {
  final repo = ref.watch(lessonRepositoryProvider);
  return repo.getLessonDetail(lessonId);
});

final lessonVocabulariesProvider =
    FutureProvider.family<List<LessonVocabulary>, String>((ref, lessonId) async {
  final repo = ref.watch(lessonRepositoryProvider);
  return repo.getVocabulariesByLesson(lessonId);
});

final lessonProgressProvider =
    FutureProvider.family<Map<String, dynamic>?, String>((ref, lessonId) async {
  final repo = ref.watch(lessonRepositoryProvider);
  return repo.getLessonProgress(lessonId);
});
