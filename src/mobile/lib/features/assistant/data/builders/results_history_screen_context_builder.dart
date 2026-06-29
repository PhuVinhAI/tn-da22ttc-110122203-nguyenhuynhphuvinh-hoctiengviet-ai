import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';
import 'simulation_context_summaries.dart';

/// `ScreenContext` builder for `/practice/history`. Pulls the learner's
/// conversation history (optionally filtered by scenario via query param)
/// so the assistant can answer "Which scenario did I do worst on?" without
/// an extra tool call.
///
/// The screen renders the full result list (no client-side pagination),
/// so the builder forwards every result without truncation.
ScreenContext resultsHistoryScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final scenarioId = match.queryParameters['scenarioId'];
  final hasFilter = scenarioId != null && scenarioId.isNotEmpty;
  final resultsAsync = ref.watch(simulationResultsProvider(scenarioId));
  final status = asyncLoadStatus(resultsAsync);

  final data = <String, dynamic>{
    'screenType': 'resultsHistory',
    'status': status,
    'filteredByScenario': hasFilter,
    if (hasFilter) 'scenarioId': scenarioId,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(resultsAsync.error);
    data['resultCount'] = 0;
    data['results'] = const <Map<String, dynamic>>[];
  } else if (status == 'loading') {
    data['resultCount'] = 0;
    data['results'] = const <Map<String, dynamic>>[];
  } else {
    final results = resultsAsync.requireValue;
    data['resultCount'] = results.length;
    data['results'] = results
        .map(simulationResultSummaryContextSummary)
        .toList(growable: false);
  }

  return ScreenContext(
    route: match.location,
    displayName:
        hasFilter ? s.assistantHistoryFilteredTitle : s.assistantHistoryTitle,
    barPlaceholder: s.assistantHistoryPlaceholder,
    data: data,
  );
}
