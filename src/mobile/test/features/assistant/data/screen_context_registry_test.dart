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
        (
          routePattern: '/bookmarks',
          location: '/bookmarks',
          pathParameters: {},
          screenType: 'bookmarksList',
        ),
        (
          routePattern: '/bookmarks/flashcard',
          location: '/bookmarks/flashcard',
          pathParameters: {},
          screenType: 'savedWords',
        ),
        (
          routePattern: '/lessons/:id/exercises',
          location: '/lessons/lesson-1/exercises',
          pathParameters: {'id': 'lesson-1'},
          screenType: 'exerciseHub',
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

    test('/courses without a builder falls back to generic context', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(currentRouteMatchProvider.notifier).update(
            const RouteMatch(routePattern: '/courses', location: '/courses'),
          );

      final ctx = container.read(currentScreenContextProvider);
      expect(ctx.data.containsKey('screenType'), isFalse);
      expect(ctx.route, '/courses');
    });
  });
}
