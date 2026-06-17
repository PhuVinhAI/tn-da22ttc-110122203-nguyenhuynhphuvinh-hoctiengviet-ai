import 'package:dio/dio.dart';
import '../../../core/network/repository_guard.dart';
import '../domain/active_session.dart';
import '../domain/create_session_response.dart';
import '../domain/scenario_category.dart';
import '../domain/scenario_detail.dart';
import '../domain/scenario_summary.dart';
import '../domain/send_message_response.dart';
import '../domain/simulation_message.dart';
import '../domain/simulation_result_detail.dart';
import '../domain/simulation_result_summary.dart';
import '../domain/simulation_session.dart';
import '../domain/simulation_stats.dart';

class SimulationRepository {
  SimulationRepository(this._dio);
  final Dio _dio;

  /// Backend gọi AI trong practice có thể rất lâu — tắt timeout mặc định của Dio.
  static final Options _aiRequestOptions = Options(
    connectTimeout: Duration.zero,
    receiveTimeout: Duration.zero,
    sendTimeout: Duration.zero,
  );

  Future<List<ScenarioCategory>> listCategories() => guard(() async =>
      ((await _dio.get<List<dynamic>>('/simulations/categories')).data as List<dynamic>)
          .map((e) => ScenarioCategory.fromJson(e as Map<String, dynamic>))
          .toList());

  Future<List<ScenarioSummary>> listScenarios({
    String? categoryId,
    String? level,
    String? difficulty,
  }) => guard(() async {
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
  });

  Future<ScenarioDetail> getScenario(String id) => guard(() async =>
      ScenarioDetail.fromJson((await _dio.get<Map<String, dynamic>>('/simulations/scenarios/$id')).data
          as Map<String, dynamic>));

  Future<CreateSessionResponse> createSession(
    String scenarioId,
    String chosenCharacterId,
  ) => guard(() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/simulations/sessions',
      data: {
        'scenarioId': scenarioId,
        'chosenCharacterId': chosenCharacterId,
      },
      options: _aiRequestOptions,
    );
    return CreateSessionResponse.fromJson(response.data as Map<String, dynamic>);
  });

  Future<SendMessageResponse> sendMessage(
    String sessionId,
    String content, {
    CancelToken? cancelToken,
  }) => guard(() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/simulations/sessions/$sessionId/messages',
      data: {'content': content},
      options: _aiRequestOptions,
      cancelToken: cancelToken,
    );
    return SendMessageResponse.fromJson(response.data as Map<String, dynamic>);
  });

  Future<void> cancelSession(String sessionId) =>
      guard(() => _dio.delete<void>('/simulations/sessions/$sessionId'));

  Future<void> revertPendingLearnerMessage(String sessionId) => guard(
      () => _dio.delete<void>(
          '/simulations/sessions/$sessionId/messages/pending-learner'));

  Future<ActiveSession?> getActiveSession() => guard(() async {
    final response = await _dio.get<Map<String, dynamic>?>(
      '/simulations/sessions/active',
    );
    if (response.data == null) return null;
    return ActiveSession.fromJson(response.data as Map<String, dynamic>);
  });

  Future<SimulationResultDetail> getResult(String id) => guard(() async =>
      SimulationResultDetail.fromJson(
          (await _dio.get<Map<String, dynamic>>('/simulations/results/$id')).data
              as Map<String, dynamic>));

  Future<List<SimulationResultSummary>> listResults({
    String? scenarioId,
  }) => guard(() async {
    final queryParameters = <String, String>{};
    if (scenarioId != null) queryParameters['scenarioId'] = scenarioId;
    final response = await _dio.get<List<dynamic>>(
      '/simulations/results',
      queryParameters: queryParameters.isNotEmpty ? queryParameters : null,
    );
    return (response.data as List<dynamic>)
        .map((e) => SimulationResultSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  });

  Future<SimulationStats> getStats() => guard(() async =>
      SimulationStats.fromJson(
          (await _dio.get<Map<String, dynamic>>('/simulations/stats')).data
              as Map<String, dynamic>));

  Future<SessionWithMessages> getSession(String sessionId) => guard(() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/simulations/sessions/$sessionId',
    );
    final data = response.data as Map<String, dynamic>;
    final session = SimulationSession.fromJson(
      data['session'] as Map<String, dynamic>? ?? data,
    );
    List<SimulationMessage> messages;
    if (data['messages'] != null) {
      messages = (data['messages'] as List<dynamic>)
          .map((e) => SimulationMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      messages = [];
    }
    return SessionWithMessages(session: session, messages: messages);
  });
}

class SessionWithMessages {
  const SessionWithMessages({
    required this.session,
    required this.messages,
  });

  final SimulationSession session;
  final List<SimulationMessage> messages;
}
