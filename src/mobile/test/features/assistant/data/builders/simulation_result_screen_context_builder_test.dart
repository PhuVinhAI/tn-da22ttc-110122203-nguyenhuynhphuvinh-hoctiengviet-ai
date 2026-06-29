import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/simulation_result_detail.dart';

SimulationResultDetail _sampleResult({String endReason = 'COMPLETED'}) {
  return SimulationResultDetail(
    id: 'res-1',
    sessionId: 'sess-1',
    scenarioId: 'sc-1',
    chosenCharacterId: 'char-1',
    totalScore: 78,
    criteriaScores: const [
      CriteriaScore(
        name: 'Politeness',
        score: 80,
        comment: 'Mostly polite, a few slips',
      ),
      CriteriaScore(
        name: 'Vocabulary',
        score: 77,
      ),
    ],
    endReason: endReason,
    aiSummary: 'Good attempt, work on greeting forms.',
    totalMessages: 12,
    createdAt: '2026-05-01T10:00:00Z',
    scenarioTitle: 'Ordering coffee',
    characterName: 'Customer',
  );
}

void main() {
  group('simulationResultScreenContextBuilder', () {
    test(
      'produces simulationResult context with score breakdown and AI summary',
      () async {
        final result = _sampleResult();

        final container = ProviderContainer(
          overrides: [
            simulationResultDetailProvider('res-1')
                .overrideWith((ref) async => result),
          ],
        );
        addTearDown(container.dispose);

        await container.read(simulationResultDetailProvider('res-1').future);

        container.read(currentRouteMatchProvider.notifier).update(
              const RouteMatch(
                routePattern: '/practice/results/:id',
                location: '/practice/results/res-1',
                pathParameters: {'id': 'res-1'},
              ),
            );

        final ctx = container.read(currentScreenContextProvider);

        expect(ctx.route, '/practice/results/res-1');
        expect(ctx.displayName, contains('Ordering coffee'));
        expect(ctx.data['screenType'], 'simulationResult');
        expect(ctx.data['resultId'], 'res-1');
        expect(ctx.data['status'], 'data');
        expect(ctx.data['totalScore'], 78);
        expect(ctx.data['endReason'], 'COMPLETED');
        expect(ctx.data['isCompleted'], true);
        expect(ctx.data['canReplay'], true);
        expect(ctx.data['scenarioTitle'], 'Ordering coffee');
        expect(ctx.data['characterName'], 'Customer');
        expect(ctx.data['aiSummary'], contains('greeting'));

        final criteria = ctx.data['criteriaScores'] as List;
        expect(criteria, hasLength(2));
        expect(criteria.first, containsPair('name', 'Politeness'));
        expect(criteria.first, containsPair('score', 80.0));
        expect(criteria.first, containsPair('comment', isNotEmpty));
      },
    );

    test('flags non-completable end reasons (TOO_MANY_ERRORS)', () async {
      final result = _sampleResult(endReason: 'TOO_MANY_ERRORS');

      final container = ProviderContainer(
        overrides: [
          simulationResultDetailProvider('res-2')
              .overrideWith((ref) async => result),
        ],
      );
      addTearDown(container.dispose);

      await container.read(simulationResultDetailProvider('res-2').future);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/practice/results/:id',
              location: '/practice/results/res-2',
              pathParameters: {'id': 'res-2'},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data['isCompleted'], false);
      expect(ctx.data['isTooManyErrors'], true);
      expect(ctx.data['canReplay'], false);
    });

    test('returns loading snapshot while result is pending', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/practice/results/:id',
              location: '/practice/results/res-pending',
              pathParameters: {'id': 'res-pending'},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data['screenType'], 'simulationResult');
      expect(ctx.data['resultId'], 'res-pending');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data.containsKey('totalScore'), isFalse);
    });
  });
}
