import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/lesson_models.dart';
import '../../review/domain/review_models.dart';

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

  Future<UserVocabulary> learnVocabulary(String vocabularyId) async {
    try {
      final response = await _dio
          .post<Map<String, dynamic>>('/vocabularies/$vocabularyId/learn');
      return UserVocabulary.fromJson(response.data!);
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
}
