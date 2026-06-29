import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../../simulation/domain/simulation_result_detail.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';
import 'simulation_context_summaries.dart';

/// `ScreenContext` builder for `/practice/results/:id`. Pulls the full result
/// (total score, per-criterion breakdown, AI summary, end reason) so the
/// assistant can answer "Why did I lose points on grammar?" without an
/// extra `get_simulation_result` tool call.
///
/// Fields the screen does NOT render (sessionId, chosenCharacterId,
/// totalMessages) are deliberately omitted — surfacing them would make
/// the assistant claim UI affordances the learner cannot see.
ScreenContext simulationResultScreenContextBuilder(
  Ref ref,
  RouteMatch match,
) {
  final s = ref.watch(assistantLocalizationsProvider);
  final resultId = match.pathParameters['id'] ?? '';
  final resultAsync = resultId.isEmpty
      ? const AsyncValue<SimulationResultDetail>.loading()
      : ref.watch(simulationResultDetailProvider(resultId));
  final status = asyncLoadStatus(resultAsync);

  final data = <String, dynamic>{
    'screenType': 'simulationResult',
    'resultId': resultId,
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(resultAsync.error);
  } else if (status == 'data') {
    final result = resultAsync.requireValue;
    data['totalScore'] = result.totalScore;
    data['endReason'] = result.endReason;
    data['isCompleted'] = result.isCompleted;
    data['isTooManyErrors'] = result.isTooManyErrors;
    data['isInappropriate'] = result.isInappropriate;
    data['canReplay'] = result.canReplay;
    if (result.scenarioTitle != null) {
      data['scenarioTitle'] = result.scenarioTitle;
    }
    if (result.characterName != null) {
      data['characterName'] = result.characterName;
    }
    if (result.aiSummary != null && result.aiSummary!.isNotEmpty) {
      data['aiSummary'] = result.aiSummary;
    }
    if (result.createdAt != null) {
      data['createdAt'] = result.createdAt;
    }
    if (result.criteriaScores.isNotEmpty) {
      data['criteriaScores'] = result.criteriaScores
          .map(criteriaScoreContextSummary)
          .toList(growable: false);
    }
  }

  final scenarioTitle =
      resultAsync.whenOrNull(data: (r) => r.scenarioTitle);

  return ScreenContext(
    route: match.location,
    displayName: scenarioTitle != null
        ? s.assistantResultTitleParam(scenarioTitle)
        : s.assistantResultTitle,
    barPlaceholder: s.assistantResultPlaceholder,
    data: data,
  );
}
