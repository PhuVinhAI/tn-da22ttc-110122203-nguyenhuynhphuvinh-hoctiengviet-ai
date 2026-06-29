import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';

class _TestCachedRepo extends CachedRepository<int> {
  int fetchCallCount = 0;
  int? lastFetchResult;

  @override
  Duration get ttl => const Duration(minutes: 5);

  @override
  Future<int> fetchFromApi() async {
    fetchCallCount++;
    lastFetchResult = 100 + fetchCallCount;
    return lastFetchResult!;
  }
}

final _testCachedRepoProvider = AsyncNotifierProvider<_TestCachedRepo, int>(_TestCachedRepo.new);

void main() {
  group('CachedRepository build', () {
    test('fresh provider always fetches from API', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      final value = await container.read(_testCachedRepoProvider.future);

      expect(value, 101);
      expect(repo.fetchCallCount, 1);
    });

    test('data within TTL returns cached without API call', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);
      expect(repo.fetchCallCount, 1);

      final secondRead = await container.read(_testCachedRepoProvider.future);

      expect(secondRead, 101);
      expect(repo.fetchCallCount, 1);
    });

    test('data past TTL returns cached immediately and refetches in background',
        () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);
      expect(repo.fetchCallCount, 1);

      repo.forceExpire();
      container.invalidate(_testCachedRepoProvider);

      final immediateRead =
          await container.read(_testCachedRepoProvider.future);
      expect(immediateRead, 101);

      for (var i = 0; i < 5; i++) {
        await Future<void>.delayed(Duration.zero);
      }

      expect(repo.fetchCallCount, 2);
      expect(repo.state.value, 102);
    });
  });

  group('CachedRepository refresh', () {
    test('refresh forces refetch regardless of TTL', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);
      expect(repo.fetchCallCount, 1);

      repo.refresh();
      await container.read(_testCachedRepoProvider.future);

      expect(repo.fetchCallCount, 2);
    });
  });

  group('CachedRepository mutate', () {
    test('optimistic write updates state immediately', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);
      expect(repo.state.value, 101);

      await repo.mutate(
        optimisticData: 999,
        apiCall: () async => 888,
        emitTags: {'progress'},
      );

      expect(repo.state.value, 888);
    });

    test('API success reconciles state with response and emits event', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);

      await repo.mutate(
        optimisticData: 999,
        apiCall: () async => 555,
        emitTags: {'bookmark'},
      );

      expect(repo.state.value, 555);

      final busState = container.read(dataChangeBusProvider);
      expect(busState, isNotNull);
      expect(busState!.tags, contains('bookmark'));
    });

    test('API failure reverts state to snapshot and error is available', () async {
      final container = ProviderContainer();
      final repo = container.read(_testCachedRepoProvider.notifier);

      await container.read(_testCachedRepoProvider.future);
      expect(repo.state.value, 101);

      Object? caughtError;
      try {
        await repo.mutate(
          optimisticData: 999,
          apiCall: () async => throw Exception('network error'),
          emitTags: {'progress'},
        );
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError, isA<Exception>());
      expect(repo.state.value, 101);

      final busState = container.read(dataChangeBusProvider);
      expect(busState, isNull);
    });
  });
}
