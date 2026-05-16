import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/screen_context.dart';
import 'builders/exercise_play_screen_context_builder.dart';
import 'builders/home_screen_context_builder.dart';
import 'builders/lesson_screen_context_builder.dart';
import 'route_match.dart';
import 'screen_context_registry.dart';

class CurrentRouteMatchNotifier extends Notifier<RouteMatch?> {
  @override
  RouteMatch? build() => null;

  void update(RouteMatch? match) {
    state = match;
  }
}

/// Holds the most recent `RouteMatch` pushed by `GlobalAssistantShell`. It
/// is exposed as a notifier so the shell can update it imperatively when
/// `GoRouter` emits a new route, and so tests can stub a route directly
/// without spinning up a router.
final currentRouteMatchProvider =
    NotifierProvider<CurrentRouteMatchNotifier, RouteMatch?>(
  CurrentRouteMatchNotifier.new,
);

/// Production-wired registry of `ScreenContextBuilder`s. Overridable in
/// tests with `screenContextRegistryProvider.overrideWithValue(...)`.
final screenContextRegistryProvider = Provider<ScreenContextRegistry>((ref) {
  return ScreenContextRegistry()
    ..register('/', homeScreenContextBuilder)
    ..register('/lessons/:id', lessonScreenContextBuilder)
    ..register(
      '/courses/:id/exercises/play/:setId',
      exercisePlayScreenContextBuilder,
    )
    ..register(
      '/modules/:id/exercises/play/:setId',
      exercisePlayScreenContextBuilder,
    )
    ..register(
      '/lessons/:id/exercises/play/:setId',
      exercisePlayScreenContextBuilder,
    );
});

/// Reactive `ScreenContext` for the current screen. Watches both the route
/// and the registered builder, which itself transitively watches the
/// domain providers it cares about — so any change in goals, lesson
/// detail, or the in-flight exercise attempt immediately propagates here.
final currentScreenContextProvider = Provider<ScreenContext>((ref) {
  final match = ref.watch(currentRouteMatchProvider);
  final registry = ref.watch(screenContextRegistryProvider);
  return registry.resolve(ref, match);
});
