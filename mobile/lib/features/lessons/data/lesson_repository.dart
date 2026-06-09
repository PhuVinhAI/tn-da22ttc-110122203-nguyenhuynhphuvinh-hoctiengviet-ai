import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/exercise_models.dart';
import '../domain/lesson_models.dart';
import '../domain/question_models.dart';

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

  Future<List<Question>> getQuestionsByLesson(String lessonId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/questions/lesson/$lessonId');
      return (response.data as List<dynamic>)
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<Question>> getQuestionsByExercise(String exerciseId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/questions/exercise/$exerciseId');
      return (response.data as List<dynamic>)
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseSubmissionResult> submitQuestionAnswer(
    String questionId,
    Map<String, dynamic> answer, {
    int? timeSpent,
  }) async {
    try {
      final data = <String, dynamic>{'userAnswer': answer};
      if (timeSpent != null) data['timeSpent'] = timeSpent;
      final response = await _dio.post<Map<String, dynamic>>(
        '/questions/$questionId/submit',
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

  Future<void> updateLessonTimeSpent(
    String lessonId,
    int additionalTime,
  ) async {
    if (additionalTime <= 0) return;
    try {
      await _dio.patch<Map<String, dynamic>>(
        '/progress/lesson/$lessonId/time',
        data: {'additionalTime': additionalTime},
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

  Future<LessonExerciseSummary> getExercisesByLesson(String lessonId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercises/lesson/$lessonId');
      return LessonExerciseSummary.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseModel> getExercise(String exerciseId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercises/$exerciseId');
      return ExerciseModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseProgressDetail> getExerciseProgress(String exerciseId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/exercises/$exerciseId/progress');
      return ExerciseProgressDetail.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<dynamic>> generateExercises(
    String exerciseId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (userPrompt != null) data['userPrompt'] = userPrompt;
      final response = await _dio.post<dynamic>(
        '/exercises/$exerciseId/generate',
        data: data.isNotEmpty ? data : null,
        options: _aiGenerationRequestOptions,
        cancelToken: cancelToken,
      );
      return _unwrapExerciseList(response.data);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseModel> createCustomExercise(
    String lessonId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercises/custom',
        data: {
          'lessonId': lessonId,
          'config': config.toJson(),
          if (config.userPrompt != null) 'userPrompt': config.userPrompt,
        },
        cancelToken: cancelToken,
      );
      final data = response.data!;
      final exerciseMap = data['exercise'] as Map<String, dynamic>;
      return ExerciseModel.fromJson(exerciseMap);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ModuleExerciseSummary> fetchModuleExercises(
      String moduleId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
          '/exercises/module/$moduleId');
      return ModuleExerciseSummary.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<CourseExerciseSummary> fetchCourseExercises(
      String courseId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
          '/exercises/course/$courseId');
      return CourseExerciseSummary.fromJson(response.data!);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseModel> createCustomExerciseForModule(
    String moduleId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercises/custom',
        data: {
          'moduleId': moduleId,
          'config': config.toJson(),
          if (config.userPrompt != null) 'userPrompt': config.userPrompt,
        },
        cancelToken: cancelToken,
      );
      final data = response.data!;
      final exerciseMap = data['exercise'] as Map<String, dynamic>;
      return ExerciseModel.fromJson(exerciseMap);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ExerciseModel> createCustomExerciseForCourse(
    String courseId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercises/custom',
        data: {
          'courseId': courseId,
          'config': config.toJson(),
          if (config.userPrompt != null) 'userPrompt': config.userPrompt,
        },
        cancelToken: cancelToken,
      );
      final data = response.data!;
      final exerciseMap = data['exercise'] as Map<String, dynamic>;
      return ExerciseModel.fromJson(exerciseMap);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<String> regenerateExercises(
    String exerciseId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (userPrompt != null) data['userPrompt'] = userPrompt;
      final response = await _dio.post<Map<String, dynamic>>(
        '/exercises/$exerciseId/regenerate',
        data: data.isNotEmpty ? data : null,
        options: _aiGenerationRequestOptions,
        cancelToken: cancelToken,
      );
      return response.data!['newExerciseId'] as String;
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  /// API sinh bài có thể trả mảng exercise trực tiếp hoặc `{ questions: [...] }`.
  List<dynamic> _unwrapExerciseList(Object? data) {
    if (data is List<dynamic>) return data;
    if (data is Map<String, dynamic>) {
      final list = data['questions'] ?? data['exercises'];
      if (list is List<dynamic>) return list;
    }
    return [];
  }

  Future<void> deleteCustomExercise(String exerciseId) async {
    try {
      await _dio.delete<Map<String, dynamic>>(
        '/exercises/$exerciseId/custom',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> resetExerciseProgress(String exerciseId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/exercises/$exerciseId/reset',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> completeAllModuleProgress(String moduleId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/progress/module/$moduleId/complete-all',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> resetModuleProgress(String moduleId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/progress/module/$moduleId/reset',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> completeAllCourseProgress(String courseId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/progress/course/$courseId/complete-all',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<void> resetCourseProgress(String courseId) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/progress/course/$courseId/reset',
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }
}
