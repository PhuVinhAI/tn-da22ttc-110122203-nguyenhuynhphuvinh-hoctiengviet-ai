import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/course_models.dart';

class CoursesRepository {
  CoursesRepository(this._dio);
  final Dio _dio;

  Future<List<Course>> getPublishedCourses() => guard(() async {
    final response = await _dio.get<List<dynamic>>('/courses');
    return (response.data as List<dynamic>)
        .map((e) => Course.fromJson(e as Map<String, dynamic>))
        .toList();
  });

  Future<Course> getCourseById(String id) => guard(() async =>
      Course.fromJson((await _dio.get<Map<String, dynamic>>('/courses/$id')).data!));

  Future<CourseModule> getModuleById(String id) => guard(() async =>
      CourseModule.fromJson(
          (await _dio.get<Map<String, dynamic>>('/modules/$id')).data!));

  Future<List<UserProgress>> getUserProgress() => guard(() async =>
      ((await _dio.get<List<dynamic>>('/progress')).data as List<dynamic>)
          .map((e) => UserProgress.fromJson(e as Map<String, dynamic>))
          .toList());
}
