import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../../../core/network/repository_guard.dart';
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

  Future<LessonDetail> getLessonDetail(String lessonId) => guard(() async =>
      LessonDetail.fromJson(
          (await _dio.get<Map<String, dynamic>>('/lessons/$lessonId')).data!));

  Future<List<Question>> getQuestionsByLesson(String lessonId) => guard(
      () async => ((await _dio.get<List<dynamic>>('/questions/lesson/$lessonId'))
              .data as List<dynamic>)
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<List<Question>> getQuestionsByExercise(String exerciseId) => guard(
      () async =>
          ((await _dio.get<List<dynamic>>('/questions/exercise/$exerciseId'))
                  .data as List<dynamic>)
              .map((e) => Question.fromJson(e as Map<String, dynamic>))
              .toList());

  Future<ExerciseSubmissionResult> submitQuestionAnswer(
    String questionId,
    Map<String, dynamic> answer, {
    int? timeSpent,
  }) => guard(() async {
    final data = <String, dynamic>{'userAnswer': answer};
    if (timeSpent != null) data['timeSpent'] = timeSpent;
    return ExerciseSubmissionResult.fromJson(
        (await _dio.post<Map<String, dynamic>>('/questions/$questionId/submit', data: data))
            .data!);
  });

  Future<List<LessonVocabulary>> getVocabulariesByLesson(String lessonId) =>
      guard(() async =>
          ((await _dio.get<List<dynamic>>('/vocabularies/lesson/$lessonId'))
                  .data as List<dynamic>)
              .map((e) => LessonVocabulary.fromJson(e as Map<String, dynamic>))
              .toList());

  Future<void> startLesson(String lessonId) =>
      guard(() => _dio.post<Map<String, dynamic>>('/progress/lesson/$lessonId/start'));

  Future<void> markContentReviewed(String lessonId) => guard(
      () => _dio.post<Map<String, dynamic>>('/progress/lesson/$lessonId/content-viewed'));

  Future<void> completeLesson(String lessonId, {int score = 0}) => guard(
      () => _dio.post<Map<String, dynamic>>('/progress/lesson/$lessonId/complete',
          data: {'score': score}));

  Future<void> updateLessonTimeSpent(String lessonId, int additionalTime) async {
    if (additionalTime <= 0) return;
    await guard(() => _dio.patch<Map<String, dynamic>>(
      '/progress/lesson/$lessonId/time',
      data: {'additionalTime': additionalTime},
    ));
  }

  /// 404 → null (no progress yet); other errors mapped to AppException.
  Future<Map<String, dynamic>?> getLessonProgress(String lessonId) => guardRaw(
        () async =>
            (await _dio.get<Map<String, dynamic>>('/progress/lesson/$lessonId')).data!,
        onDioError: (e) {
          if (e.response?.statusCode == 404) return null;
          throw mapDioException(e);
        },
      );

  Future<LessonExerciseSummary> getExercisesByLesson(String lessonId) => guard(
      () async => LessonExerciseSummary.fromJson(
          (await _dio.get<Map<String, dynamic>>('/exercises/lesson/$lessonId')).data!));

  Future<ExerciseModel> getExercise(String exerciseId) => guard(() async =>
      ExerciseModel.fromJson(
          (await _dio.get<Map<String, dynamic>>('/exercises/$exerciseId')).data!));

  Future<ExerciseProgressDetail> getExerciseProgress(String exerciseId) => guard(
      () async => ExerciseProgressDetail.fromJson(
          (await _dio.get<Map<String, dynamic>>('/exercises/$exerciseId/progress')).data!));

  Future<List<dynamic>> generateExercises(
    String exerciseId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) => guard(() async {
    final data = <String, dynamic>{};
    if (userPrompt != null) data['userPrompt'] = userPrompt;
    final response = await _dio.post<dynamic>(
      '/exercises/$exerciseId/generate',
      data: data.isNotEmpty ? data : null,
      options: _aiGenerationRequestOptions,
      cancelToken: cancelToken,
    );
    return _unwrapExerciseList(response.data);
  });

  Future<ExerciseModel> createCustomExercise(
    String lessonId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) => guard(() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/exercises/custom',
      data: {
        'lessonId': lessonId,
        'config': config.toJson(),
        if (config.userPrompt != null) 'userPrompt': config.userPrompt,
      },
      cancelToken: cancelToken,
    );
    final exerciseMap = response.data!['exercise'] as Map<String, dynamic>;
    return ExerciseModel.fromJson(exerciseMap);
  });

  Future<ModuleExerciseSummary> fetchModuleExercises(String moduleId) => guard(
      () async => ModuleExerciseSummary.fromJson(
          (await _dio.get<Map<String, dynamic>>('/exercises/module/$moduleId')).data!));

  Future<CourseExerciseSummary> fetchCourseExercises(String courseId) => guard(
      () async => CourseExerciseSummary.fromJson(
          (await _dio.get<Map<String, dynamic>>('/exercises/course/$courseId')).data!));

  Future<ExerciseModel> createCustomExerciseForModule(
    String moduleId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) => guard(() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/exercises/custom',
      data: {
        'moduleId': moduleId,
        'config': config.toJson(),
        if (config.userPrompt != null) 'userPrompt': config.userPrompt,
      },
      cancelToken: cancelToken,
    );
    final exerciseMap = response.data!['exercise'] as Map<String, dynamic>;
    return ExerciseModel.fromJson(exerciseMap);
  });

  Future<ExerciseModel> createCustomExerciseForCourse(
    String courseId,
    CustomExerciseConfig config, {
    CancelToken? cancelToken,
  }) => guard(() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/exercises/custom',
      data: {
        'courseId': courseId,
        'config': config.toJson(),
        if (config.userPrompt != null) 'userPrompt': config.userPrompt,
      },
      cancelToken: cancelToken,
    );
    final exerciseMap = response.data!['exercise'] as Map<String, dynamic>;
    return ExerciseModel.fromJson(exerciseMap);
  });

  Future<String> regenerateExercises(
    String exerciseId, {
    String? userPrompt,
    CancelToken? cancelToken,
  }) => guard(() async {
    final data = <String, dynamic>{};
    if (userPrompt != null) data['userPrompt'] = userPrompt;
    final response = await _dio.post<Map<String, dynamic>>(
      '/exercises/$exerciseId/regenerate',
      data: data.isNotEmpty ? data : null,
      options: _aiGenerationRequestOptions,
      cancelToken: cancelToken,
    );
    return response.data!['newExerciseId'] as String;
  });

  /// API sinh bài có thể trả mảng exercise trực tiếp hoặc `{ questions: [...] }`.
  List<dynamic> _unwrapExerciseList(Object? data) {
    if (data is List<dynamic>) return data;
    if (data is Map<String, dynamic>) {
      final list = data['questions'] ?? data['exercises'];
      if (list is List<dynamic>) return list;
    }
    return [];
  }

  Future<void> deleteCustomExercise(String exerciseId) =>
      guard(() => _dio.delete<Map<String, dynamic>>('/exercises/$exerciseId/custom'));

  Future<void> resetExerciseProgress(String exerciseId) =>
      guard(() => _dio.post<Map<String, dynamic>>('/exercises/$exerciseId/reset'));

  Future<void> completeAllModuleProgress(String moduleId) => guard(
      () => _dio.post<Map<String, dynamic>>('/progress/module/$moduleId/complete-all'));

  Future<void> resetModuleProgress(String moduleId) =>
      guard(() => _dio.post<Map<String, dynamic>>('/progress/module/$moduleId/reset'));

  Future<void> completeAllCourseProgress(String courseId) => guard(
      () => _dio.post<Map<String, dynamic>>('/progress/course/$courseId/complete-all'));

  Future<void> resetCourseProgress(String courseId) =>
      guard(() => _dio.post<Map<String, dynamic>>('/progress/course/$courseId/reset'));
}
