import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/assistant/data/screen_context_registry.dart';
import 'package:linvnix/features/assistant/domain/screen_context.dart';

class _StringNotifier extends Notifier<String> {
  @override
  String build() => 'initial';

  void set(String value) => state = value;
}

void main() {
  group('currentScreenContextProvider', () {
    test('falls back to a generic screen context when no route is set', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.route, '/');
      expect(ctx.barPlaceholder, 'Hỏi gì đi nào?');
      expect(ctx.data, isEmpty);
    });

    test('falls back to a generic builder for an unregistered route', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/something',
              location: '/something',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.route, '/something');
      expect(ctx.displayName, '/something');
      expect(ctx.barPlaceholder, 'Hỏi gì đi nào?');
      expect(ctx.data, isEmpty);
    });

    test(
        'invokes the registered builder for a matched route '
        'and exposes the produced ScreenContext', () {
      final registry = ScreenContextRegistry()
        ..register(
          '/widgets/:id',
          (ref, match) => ScreenContext(
            route: match.location,
            displayName: 'Widget ${match.pathParameters['id']}',
            barPlaceholder: 'Need a hint?',
            data: {'widgetId': match.pathParameters['id']},
          ),
        );

      final container = ProviderContainer(
        overrides: [
          screenContextRegistryProvider.overrideWithValue(registry),
        ],
      );
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/widgets/:id',
              location: '/widgets/abc',
              pathParameters: {'id': 'abc'},
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.route, '/widgets/abc');
      expect(ctx.displayName, 'Widget abc');
      expect(ctx.barPlaceholder, 'Need a hint?');
      expect(ctx.data, {'widgetId': 'abc'});
    });

    test(
        'recomputes the ScreenContext when an underlying domain provider '
        'changes', () {
      final widgetTitleProvider =
          NotifierProvider<_StringNotifier, String>(_StringNotifier.new);

      final registry = ScreenContextRegistry()
        ..register(
          '/widgets/:id',
          (ref, match) => ScreenContext(
            route: match.location,
            displayName: ref.watch(widgetTitleProvider),
            barPlaceholder: 'Need a hint?',
            data: {'widgetId': match.pathParameters['id']},
          ),
        );

      final container = ProviderContainer(
        overrides: [
          screenContextRegistryProvider.overrideWithValue(registry),
        ],
      );
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/widgets/:id',
              location: '/widgets/abc',
              pathParameters: {'id': 'abc'},
            ),
          );

      final initial = container.read(currentScreenContextProvider);
      expect(initial.displayName, 'initial');

      container.read(widgetTitleProvider.notifier).set('updated');

      final next = container.read(currentScreenContextProvider);
      expect(next.displayName, 'updated');
    });
  });
}
