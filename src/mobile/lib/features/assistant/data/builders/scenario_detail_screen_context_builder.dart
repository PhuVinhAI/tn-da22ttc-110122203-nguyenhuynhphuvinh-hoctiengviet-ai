import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../../simulation/domain/scenario_detail.dart';
import '../../../simulation/domain/simulation_result_summary.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';
import 'simulation_context_summaries.dart';

/// `ScreenContext` builder for `/practice/scenarios/:id`. Pulls scenario
/// detail (characters, rubric) + the learner's recent attempts via
/// `scenarioDetailProvider` and `simulationResultsProvider`, so the AI can
/// answer questions like "What does this scenario test?" or "How did I do
/// last time?" without an extra tool call.
///
/// The `fromConversation` query parameter hides the Start CTA on this
/// screen, so it's surfaced here as `showsStartCta` for the assistant to
/// reason about what the learner can tap.
ScreenContext scenarioDetailScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final scenarioId = match.pathParameters['id'] ?? '';
  final fromConversation =
      match.queryParameters['fromConversation'] == 'true';
  final detailAsync = scenarioId.isEmpty
      ? const AsyncValue<ScenarioDetail>.loading()
      : ref.watch(scenarioDetailProvider(scenarioId));
  final historyAsync = scenarioId.isEmpty
      ? const AsyncValue<List<SimulationResultSummary>>.loading()
      : ref.watch(simulationResultsProvider(scenarioId));

  final detailStatus = asyncLoadStatus(detailAsync);
  final historyStatus = asyncLoadStatus(historyAsync);

  final data = <String, dynamic>{
    'screenType': 'scenarioDetail',
    'scenarioId': scenarioId,
    'status': detailStatus,
    'historyStatus': historyStatus,
    'fromConversation': fromConversation,
    'showsStartCta': !fromConversation,
  };

  if (detailStatus == 'error') {
    data['error'] = shortAsyncError(detailAsync.error);
  } else if (detailStatus == 'data') {
    final detail = detailAsync.requireValue;
    data['scenario'] = scenarioDetailContextSummary(detail);
    data['characters'] = detail.characters
        .map(scenarioCharacterContextSummary)
        .toList(growable: false);
    data['scoringCriteria'] = detail.scoringCriteria
        .map(scoringCriterionContextSummary)
        .toList(growable: false);
  }

  if (historyStatus == 'data') {
    final results = historyAsync.requireValue;
    data['recentResultCount'] = results.length;
    // The screen renders only the three most recent attempts; mirror that
    // so the assistant doesn't claim "I see 5 attempts" when the user
    // sees 3.
    data['recentResults'] = results
        .take(3)
        .map(simulationResultSummaryContextSummary)
        .toList(growable: false);
  } else {
    data['recentResultCount'] = 0;
    data['recentResults'] = const <Map<String, dynamic>>[];
    if (historyStatus == 'error') {
      data['historyError'] = shortAsyncError(historyAsync.error);
    }
  }

  final scenarioTitle =
      detailAsync.whenOrNull(data: (detail) => detail.title);

  return ScreenContext(
    route: match.location,
    displayName: scenarioTitle != null
        ? s.assistantScenarioTitleParam(scenarioTitle)
        : s.assistantScenarioTitle,
    barPlaceholder: s.assistantScenarioPlaceholder,
    data: data,
  );
}
