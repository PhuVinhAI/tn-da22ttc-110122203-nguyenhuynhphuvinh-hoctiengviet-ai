import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/lesson_models.dart';
import '../domain/exercise_models.dart';
import '../domain/exercise_set_models.dart';

class LessonRepository {
  LessonRepository(this._dio);
  final Dio _dio;

  Future<LessonDetail> getLessonDetail(String lessonId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/lessons/$lessonId');
      return LessonDetail.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<Exercise>> getExercisesByLesson(String lessonId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/exercises/lesson/$lessonId');
      return (response.data as List<dynamic>)
          .map((e) => Exercise.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseSubmissionResult> submitExerciseAnswer(
    String exerciseId,
    Map<String, dynamic> answer, {
    int? timeSpent,
  }) async {
    try {
      final data = <String, dynamic>{'userAnswer': answer};
      if (timeSpent != null) data['timeSpent'] = timeSpent;
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercises/$exerciseId/submit',
        data: data,
      );
      return ExerciseSubmissionResult.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<LessonVocabulary>> getVocabulariesByLesson(
      String lessonId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/vocabularies/lesson/$lessonId');
      return (response.data as List<dynamic>)
          .map((e) => LessonVocabulary.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> startLesson(String lessonId) async {
    try {
      await _dio.post<Map<String, dynamic>>('/progress/lesson/$lessonId/start');
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> completeLesson(String lessonId, {int score = 0}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/progress/lesson/$lessonId/complete',
        data: {'score': score},
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<Map<String, dynamic>?> getLessonProgress(String lessonId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/progress/lesson/$lessonId');
      return response.data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw mapDioException(e);
    }
  }

  Future<LessonTierSummary> getExerciseSetsByLesson(String lessonId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercise-sets/lesson/$lessonId');
      return LessonTierSummary.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseSetModel> getExerciseSet(String setId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercise-sets/$setId');
      return ExerciseSetModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }
}
