import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/simulation_result_summary.dart';

class _StubResults extends SimulationResultsNotifier {
  _StubResults(this._results, super.scenarioId);

  final List<SimulationResultSummary> _results;

  @override
  Future<List<SimulationResultSummary>> build() async => _results;
}

SimulationResultSummary _result({
  required String id,
  required double score,
  String? scenarioTitle,
  String? scenarioId,
}) {
  return SimulationResultSummary(
    id: id,
    totalScore: score,
    endReason: 'COMPLETED',
    createdAt: '2026-05-01T10:00:00Z',
    scenarioTitle: scenarioTitle,
    scenarioId: scenarioId,
  );
}

void main() {
  group('resultsHistoryScreenContextBuilder', () {
    test(
      'unfiltered history exposes all results without aggregate score stats',
      () async {
        final results = [
          _result(id: 'r-1', score: 90, scenarioTitle: 'Coffee'),
          _result(id: 'r-2', score: 60, scenarioTitle: 'Market'),
          _result(id: 'r-3', score: 75, scenarioTitle: 'Taxi'),
        ];

        final container = ProviderContainer(
          overrides: [
            simulationResultsProvider(null).overrideWith(
              () => _StubResults(results, null),
            ),
          ],
        );
        addTearDown(container.dispose);

        await container.read(simulationResultsProvider(null).future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/practice/history',
                location: '/practice/history',
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/practice/history');
        expect(ctx.data['screenType'], 'resultsHistory');
        expect(ctx.data['status'], 'data');
        expect(ctx.data['filteredByScenario'], false);
        expect(ctx.data['resultCount'], 3);
        // Aggregate stats are no longer surfaced — the history screen has
        // no card that shows average/best/worst, so exposing them would
        // make the assistant claim a UI element that doesn't exist.
        expect(ctx.data.containsKey('averageScore'), isFalse);
        expect(ctx.data.containsKey('bestScore'), isFalse);
        expect(ctx.data.containsKey('worstScore'), isFalse);

        final items = ctx.data['results'] as List;
        expect(items, hasLength(3));
        expect(items.first, containsPair('id', 'r-1'));
      },
    );

    test(
      'scenario-filtered history surfaces the scenarioId and uses the '
      'matching family provider',
      () async {
        const scenarioId = 'sc-9';
        final results = [
          _result(
            id: 'r-1',
            score: 80,
            scenarioTitle: 'Coffee',
            scenarioId: scenarioId,
          ),
        ];

        final container = ProviderContainer(
          overrides: [
            simulationResultsProvider(scenarioId).overrideWith(
              () => _StubResults(results, scenarioId),
            ),
          ],
        );
        addTearDown(container.dispose);

        await container.read(simulationResultsProvider(scenarioId).future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/practice/history',
                location: '/practice/history',
                queryParameters: {'scenarioId': scenarioId},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.data['filteredByScenario'], true);
        expect(ctx.data['scenarioId'], scenarioId);
        expect(ctx.data['resultCount'], 1);
      },
    );

    test('returns loading snapshot with empty results when pending', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/practice/history',
              location: '/practice/history',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data['screenType'], 'resultsHistory');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data['resultCount'], 0);
      expect(ctx.data['results'], isEmpty);
    });
  });
}
