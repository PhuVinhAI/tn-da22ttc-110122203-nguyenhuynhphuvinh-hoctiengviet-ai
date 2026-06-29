import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/simulation_stats.dart';

class _TestSimulationStatsNotifier extends SimulationStatsNotifier {
  int fetchCallCount = 0;

  @override
  Future<SimulationStats> build() async {
    watchTags({'simulation'});
    fetchCallCount++;
    return const SimulationStats(
      scenariosAttempted: 0,
      averageScore: 0.0,
    );
  }
}

final _testSimulationStatsProvider =
    AsyncNotifierProvider<_TestSimulationStatsNotifier, SimulationStats>(
  _TestSimulationStatsNotifier.new,
);

void main() {
  group('SimulationStatsNotifier', () {
    test('subscribes to DataChangeBus tag simulation and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testSimulationStatsProvider.notifier,
      );

      await container.read(_testSimulationStatsProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'simulation'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testSimulationStatsProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testSimulationStatsProvider.notifier,
      );

      await container.read(_testSimulationStatsProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'exercise'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testSimulationStatsProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });
}
