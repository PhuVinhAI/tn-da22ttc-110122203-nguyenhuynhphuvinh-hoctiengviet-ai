import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/lesson_models.dart';
import '../domain/exercise_models.dart';
import '../domain/exercise_set_models.dart';

class LessonRepository {
  LessonRepository(this._dio);
  final Dio _dio;

  /// Backend gọi AI sinh bài có thể rất lâu — tắt connect/receive/send timeout mặc định của Dio.
  static final Options _aiGenerationRequestOptions = Options(
    connectTimeout: Duration.zero,
    receiveTimeout: Duration.zero,
    sendTimeout: Duration.zero,
  );

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

  Future<List<Exercise>> getExercisesBySet(String setId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/exercises/set/$setId');
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

  Future<void> markContentReviewed(String lessonId) async {
    try {
      await _dio.post<Map<String, dynamic>>('/progress/lesson/$lessonId/content-viewed');
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

  Future<LessonExerciseSummary> getExerciseSetsByLesson(String lessonId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercise-sets/lesson/$lessonId');
      return LessonExerciseSummary.fromJson(response.data!);
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

  Future<SetProgressDetail> getSetProgress(String setId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercise-sets/$setId/progress');
      return SetProgressDetail.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<dynamic>> generateExercises(
    String setId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (userPrompt != null) data['userPrompt'] = userPrompt;
      final response = await _dio.post<dynamic>(
        '/exercise-sets/$setId/generate',
        data: data.isNotEmpty ? data : null,
        options: _aiGenerationRequestOptions,
        cancelToken: cancelToken,
      );
      return _unwrapExerciseList(response.data);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseSetModel> createCustomSet(
    String lessonId,
    CustomSetConfig config, {
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercise-sets/custom',
        data: {
          'lessonId': lessonId,
          'config': config.toJson(),
          if (config.userPrompt != null) 'userPrompt': config.userPrompt,
        },
        cancelToken: cancelToken,
      );
      final data = response.data!;
      final setMap = data['set'] as Map<String, dynamic>;
      return ExerciseSetModel.fromJson(setMap);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<String> regenerateExercises(
    String setId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (userPrompt != null) data['userPrompt'] = userPrompt;
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercise-sets/$setId/regenerate',
        data: data.isNotEmpty ? data : null,
        options: _aiGenerationRequestOptions,
        cancelToken: cancelToken,
      );
      return response.data!['newSetId'] as String;
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  /// API sinh bài có thể trả mảng exercise trực tiếp hoặc `{ exercises: [...] }`.
  List<dynamic> _unwrapExerciseList(Object? data) {
    if (data is List<dynamic>) return data;
    if (data is Map<String, dynamic>) {
      final list = data['exercises'];
      if (list is List<dynamic>) return list;
    }
    return [];
  }

  Future<void> deleteCustomExerciseSet(String setId) async {
    try {
      await _dio.delete<Map<String, dynamic>>(
        '/exercise-sets/$setId/custom',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> resetExerciseSetProgress(String setId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/exercise-sets/$setId/reset',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }
}
