import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';

void main() {
  group('production ScreenContextRegistry', () {
    test('registers course-related builders for shell and detail routes', () {
      final cases = <({
        String routePattern,
        String location,
        Map<String, String> pathParameters,
        String screenType,
      })>[
        (
          routePattern: '/courses',
          location: '/courses',
          pathParameters: {},
          screenType: 'coursesList',
        ),
        (
          routePattern: '/courses/:id',
          location: '/courses/c1',
          pathParameters: {'id': 'c1'},
          screenType: 'courseDetail',
        ),
        (
          routePattern: '/modules/:id',
          location: '/modules/m1',
          pathParameters: {'id': 'm1'},
          screenType: 'moduleDetail',
        ),
      ];

      for (final testCase in cases) {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        container.read(currentRouteMatchProvider.notifier).update(
              RouteMatch(
                routePattern: testCase.routePattern,
                location: testCase.location,
                pathParameters: testCase.pathParameters,
              ),
            );

        final ctx = container.read(currentScreenContextProvider);
        expect(ctx.data['screenType'], testCase.screenType);
      }
    });

    test('resolves course detail when location is specific but pattern is stale',
        () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(
              routePattern: '/courses',
              location: '/courses/c1',
            ),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data['screenType'], 'courseDetail');
      expect(ctx.data['courseId'], 'c1');
    });

    test('/courses resolves to coursesList screen type', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(routePattern: '/courses', location: '/courses'),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data['screenType'], 'coursesList');
      expect(ctx.data['status'], 'loading');
      expect(ctx.data['courseCount'], 0);
      expect(ctx.data['courses'], isEmpty);
      expect(ctx.data.containsKey('uiSnapshot'), isFalse);
    });
  });
}
