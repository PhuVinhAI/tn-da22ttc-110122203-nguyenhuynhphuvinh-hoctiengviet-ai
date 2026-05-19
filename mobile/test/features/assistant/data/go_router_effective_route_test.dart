import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:linvnix/features/assistant/data/go_router_effective_route.dart';

/// Mirrors [app_router.dart]: `/courses` lives in a [ShellRoute], while
/// `/courses/:id` is a root-level route opened with [GoRouter.push].
void main() {
  group('effectiveRouteMatchFromGoRouter', () {
    late GoRouter router;

    setUp(() {
      router = GoRouter(
        routes: [
          ShellRoute(
            builder: (context, state, child) => child,
            routes: [
              GoRoute(
                path: '/courses',
                builder: (context, state) =>
                    const Scaffold(body: Text('courses list')),
              ),
            ],
          ),
          GoRoute(
            path: '/courses/:id',
            builder: (context, state) => Scaffold(
              body: Text('course ${state.pathParameters['id']}'),
            ),
          ),
        ],
        initialLocation: '/courses',
      );
    });

    Future<void> pumpRouter(WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp.router(routerConfig: router),
      );
      await tester.pumpAndSettle();
    }

    testWidgets('reports courses list on shell tab route', (tester) async {
      await pumpRouter(tester);

      final match = effectiveRouteMatchFromGoRouter(router);

      expect(match.routePattern, '/courses');
      expect(match.location, '/courses');
      expect(match.pathParameters, isEmpty);
    });

    testWidgets(
      'reports course detail after imperative push from courses tab',
      (tester) async {
        await pumpRouter(tester);

        router.push('/courses/course-a1');
        await tester.pumpAndSettle();

        final match = effectiveRouteMatchFromGoRouter(router);

        expect(match.routePattern, '/courses/:id');
        expect(match.location, '/courses/course-a1');
        expect(match.pathParameters, {'id': 'course-a1'});
      },
    );

  });
}
