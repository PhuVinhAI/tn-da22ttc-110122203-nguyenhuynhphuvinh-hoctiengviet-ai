import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';

class _TestUserProgressNotifier extends UserProgressNotifier {
  int fetchCallCount = 0;

  @override
  Future<List<UserProgress>> build() async {
    watchTags({'progress'});
    fetchCallCount++;
    return const [];
  }
}

final _testUserProgressProvider =
    AsyncNotifierProvider<_TestUserProgressNotifier, List<UserProgress>>(
  _TestUserProgressNotifier.new,
);

void main() {
  group('UserProgressNotifier', () {
    test('subscribes to DataChangeBus tag progress and auto-refetches',
        () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testUserProgressProvider.notifier,
      );

      await container.read(_testUserProgressProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'progress'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testUserProgressProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 2);
    });

    test('non-matching DataChangeBus tag does not trigger refetch', () async {
      final container = ProviderContainer();
      final notifier = container.read(
        _testUserProgressProvider.notifier,
      );

      await container.read(_testUserProgressProvider.future);
      expect(notifier.fetchCallCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'exercise'});
      await Future.delayed(Duration.zero);

      final secondRead = await container.read(
        _testUserProgressProvider.future,
      );
      expect(secondRead, isNotNull);
      expect(notifier.fetchCallCount, 1);
    });
  });
}
