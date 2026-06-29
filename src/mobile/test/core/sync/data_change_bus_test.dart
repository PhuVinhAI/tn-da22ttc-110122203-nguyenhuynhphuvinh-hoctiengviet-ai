import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/core/sync/sync.dart';

class _TestSubscriber extends AsyncNotifier<int> with DataChangeBusSubscriber<int> {
  int callCount = 0;

  @override
  Future<int> build() async {
    callCount++;
    watchTags({'bookmark', 'progress'});
    return callCount;
  }
}

final _testSubscriberProvider = AsyncNotifierProvider<_TestSubscriber, int>(_TestSubscriber.new);

final _dummyRefProvider = Provider<Ref>((ref) => ref);

void main() {
  group('DataChangeBus', () {
    test('initial state is null', () {
      final container = ProviderContainer();
      expect(container.read(dataChangeBusProvider), isNull);
    });

    test('emit updates state with DataChanged', () {
      final container = ProviderContainer();
      container.read(dataChangeBusProvider.notifier).emit({'bookmark'});
      final state = container.read(dataChangeBusProvider);
      expect(state, isNotNull);
      expect(state!.tags, contains('bookmark'));
      expect(state.tags.any((t) => t.startsWith('__emit:')), isTrue);
    });

    test('emit overwrites previous state', () {
      final container = ProviderContainer();
      final notifier = container.read(dataChangeBusProvider.notifier);
      notifier.emit({'bookmark'});
      notifier.emit({'progress'});
      final state = container.read(dataChangeBusProvider);
      expect(state!.tags, contains('progress'));
      expect(state.tags, isNot(contains('bookmark')));
    });
  });

  group('Tag subscription', () {
    test('emit event with matching tags triggers subscriber rebuild', () async {
      final container = ProviderContainer();
      final subscriber = container.read(_testSubscriberProvider.notifier);
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'bookmark'});
      await container.read(_testSubscriberProvider.future);

      expect(subscriber.callCount, 2);
    });

    test('emit event with no matching tags does not trigger subscriber rebuild', () async {
      final container = ProviderContainer();
      final subscriber = container.read(_testSubscriberProvider.notifier);
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'exercise'});
      await Future.delayed(Duration.zero);

      expect(subscriber.callCount, 1);
    });

    test('emit same logical tags twice still triggers subscriber rebuild', () async {
      final container = ProviderContainer();
      final subscriber = container.read(_testSubscriberProvider.notifier);
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'bookmark'});
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 2);

      container.read(dataChangeBusProvider.notifier).emit({'bookmark'});
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 3);
    });

    test('multiple emissions are all processed', () async {
      final container = ProviderContainer();
      final subscriber = container.read(_testSubscriberProvider.notifier);
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 1);

      container.read(dataChangeBusProvider.notifier).emit({'bookmark'});
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 2);

      container.read(dataChangeBusProvider.notifier).emit({'progress'});
      await container.read(_testSubscriberProvider.future);
      expect(subscriber.callCount, 3);
    });
  });

  group('RefTagSubscription extension', () {
    test('calls onMatch when tags intersect', () {
      final container = ProviderContainer();
      var matched = false;
      final ref = container.read(_dummyRefProvider);
      ref.watchDataChangeTags({'bookmark'}, () => matched = true);

      container.read(dataChangeBusProvider.notifier).emit({'bookmark', 'exercise'});
      expect(matched, isTrue);
    });

    test('does not call onMatch when tags do not intersect', () {
      final container = ProviderContainer();
      var matched = false;
      final ref = container.read(_dummyRefProvider);
      ref.watchDataChangeTags({'bookmark'}, () => matched = true);

      container.read(dataChangeBusProvider.notifier).emit({'exercise'});
      expect(matched, isFalse);
    });
  });
}
