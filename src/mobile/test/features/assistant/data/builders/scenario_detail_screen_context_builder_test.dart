import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/scenario_character.dart';
import 'package:linvnix/features/simulation/domain/scenario_detail.dart';
import 'package:linvnix/features/simulation/domain/scenario_summary.dart';
import 'package:linvnix/features/simulation/domain/scoring_criterion.dart';
import 'package:linvnix/features/simulation/domain/simulation_result_summary.dart';

class _StubResults extends SimulationResultsNotifier {
  _StubResults(this._results, super.scenarioId);

  final List<SimulationResultSummary> _results;

  @override
  Future<List<SimulationResultSummary>> build() async => _results;
}

ScenarioDetail _sampleDetail() {
  return const ScenarioDetail(
    id: 'sc-1',
    title: 'Ordering coffee',
    description: 'Order a drink at a Vietnamese cafe',
    requiredLevel: 'A2',
    difficulty: 'EASY',
    estimatedMinutes: 6,
    characterCount: 2,
    scoringCriteria: [
      ScoringCriterion(
        name: 'Politeness',
        description: 'Use polite forms when ordering',
        weight: 40,
      ),
      ScoringCriterion(
        name: 'Vocabulary',
        description: 'Use cafe-related vocabulary correctly',
        weight: 60,
      ),
    ],
    characters: [
      ScenarioCharacter(
        id: 'char-1',
        name: 'Customer',
        role: 'You',
        personality: 'friendly',
        speechStyle: 'casual',
        isPlayable: true,
      ),
      ScenarioCharacter(
        id: 'char-2',
        name: 'Barista',
        role: 'NPC',
        personality: 'helpful',
        speechStyle: 'polite',
        isPlayable: false,
      ),
    ],
    categoryInfo: CategoryInfo(id: 'cat-1', name: 'Food & drink'),
  );
}

void main() {
  group('scenarioDetailScreenContextBuilder', () {
    test(
      'produces scenarioDetail context with characters, rubric, and recent '
      'results',
      () async {
        final detail = _sampleDetail();
        final results = [
          const SimulationResultSummary(
            id: 'r-1',
            totalScore: 85,
            endReason: 'COMPLETED',
            scenarioTitle: 'Ordering coffee',
            characterName: 'Customer',
            scenarioId: 'sc-1',
          ),
        ];

        final container = ProviderContainer(
          overrides: [
            scenarioDetailProvider('sc-1').overrideWith((ref) async => detail),
            simulationResultsProvider('sc-1').overrideWith(
              () => _StubResults(results, 'sc-1'),
            ),
          ],
        );
        addTearDown(container.dispose);

        await container.read(scenarioDetailProvider('sc-1').future);
        await container.read(simulationResultsProvider('sc-1').future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/practice/scenarios/:id',
                location: '/practice/scenarios/sc-1',
                pathParameters: {'id': 'sc-1'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/practice/scenarios/sc-1');
        expect(ctx.displayName, contains('Ordering coffee'));
        expect(ctx.data['screenType'], 'scenarioDetail');
        expect(ctx.data['scenarioId'], 'sc-1');
        expect(ctx.data['status'], 'data');

        final scenario = ctx.data['scenario'] as Map<String, dynamic>;
        expect(scenario['title'], 'Ordering coffee');
        expect(scenario['requiredLevel'], 'A2');
        expect(scenario['difficulty'], 'EASY');
        // `category` is no longer surfaced: the scenario detail screen
        // does not render it, so exposing it here would invent a UI
        // affordance the learner cannot see.
        expect(scenario.containsKey('category'), isFalse);

        expect(ctx.data['fromConversation'], false);
        expect(ctx.data['showsStartCta'], true);

        final characters = ctx.data['characters'] as List;
        expect(characters, hasLength(2));
        expect(characters.first, containsPair('name', 'Customer'));
        expect(characters.first, containsPair('isPlayable', true));

        final criteria = ctx.data['scoringCriteria'] as List;
        expect(criteria, hasLength(2));
        expect(criteria.first, containsPair('name', 'Politeness'));
        expect(criteria.first, containsPair('weight', 40));

        expect(ctx.data['recentResultCount'], 1);
        final recent = ctx.data['recentResults'] as List;
        expect(recent, hasLength(1));
        expect(recent.first, containsPair('totalScore', 85.0));
      },
    );

    test('returns loading snapshot while scenario detail is pending', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/practice/scenarios/:id',
              location: '/practice/scenarios/sc-pending',
              pathParameters: {'id': 'sc-pending'},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);

      expect(ctx.data['screenType'], 'scenarioDetail');
      expect(ctx.data['scenarioId'], 'sc-pending');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data['historyStatus'], 'loading');
      expect(ctx.data.containsKey('scenario'), isFalse);
      expect(ctx.data['recentResultCount'], 0);
      expect(ctx.data['recentResults'], isEmpty);
    });
  });
}
