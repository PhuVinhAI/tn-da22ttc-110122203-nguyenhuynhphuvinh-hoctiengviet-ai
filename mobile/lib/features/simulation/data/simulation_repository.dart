import 'package:dio/dio.dart';
import '../../../core/network/exception_mapper.dart';
import '../domain/create_session_response.dart';
import '../domain/scenario_category.dart';
import '../domain/scenario_detail.dart';
import '../domain/scenario_summary.dart';

class SimulationRepository {
  SimulationRepository(this._dio);
  final Dio _dio;

  Future<List<ScenarioCategory>> listCategories() async {
    try {
      final response = await _dio.get<List<dynamic>>('/simulations/categories');
      return (response.data as List<dynamic>)
          .map((e) => ScenarioCategory.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<List<ScenarioSummary>> listScenarios({
    String? categoryId,
    String? level,
    String? difficulty,
  }) async {
    try {
      final queryParameters = <String, String>{};
      if (categoryId != null) queryParameters['categoryId'] = categoryId;
      if (level != null) queryParameters['level'] = level;
      if (difficulty != null) queryParameters['difficulty'] = difficulty;

      final response = await _dio.get<List<dynamic>>(
        '/simulations/scenarios',
        queryParameters: queryParameters.isNotEmpty ? queryParameters : null,
      );
      return (response.data as List<dynamic>)
          .map((e) => ScenarioSummary.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<ScenarioDetail> getScenario(String id) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/simulations/scenarios/$id');
      return ScenarioDetail.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }

  Future<CreateSessionResponse> createSession(
    String scenarioId,
    String chosenCharacterId,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/simulations/sessions',
        data: {
          'scenarioId': scenarioId,
          'chosenCharacterId': chosenCharacterId,
        },
        options: Options(
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 15),
        ),
      );
      return CreateSessionResponse.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw mapDioException(e);
    }
  }
}
