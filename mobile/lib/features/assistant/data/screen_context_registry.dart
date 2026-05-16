import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/screen_context.dart';
import 'route_match.dart';

/// Pure-function builder. Given the current route match plus a Riverpod
/// `Ref` (for watching domain providers), returns the `ScreenContext` to
/// expose to the assistant. Builders MUST use `ref.watch` (not `ref.read`)
/// so the resulting context recomputes when underlying providers change.
typedef ScreenContextBuilder = ScreenContext Function(
  Ref ref,
  RouteMatch match,
);

const String genericBarPlaceholder = 'Hỏi gì đi nào?';

/// In-memory map of `routePattern` -> builder. Patterns use go_router
/// syntax (e.g. `/lessons/:id`) and are matched against
/// `RouteMatch.routePattern`, never reparsed from the literal location.
class ScreenContextRegistry {
  final Map<String, ScreenContextBuilder> _builders = {};

  void register(String routePattern, ScreenContextBuilder builder) {
    _builders[routePattern] = builder;
  }

  /// Returns the `ScreenContext` for [match], invoking the registered
  /// builder if any, otherwise a generic fallback derived from [match] (or
  /// a root-level fallback when [match] is null, e.g. before the router
  /// has emitted its first route).
  ScreenContext resolve(Ref ref, RouteMatch? match) {
    if (match == null) {
      return const ScreenContext(
        route: '/',
        displayName: '/',
        barPlaceholder: genericBarPlaceholder,
      );
    }

    final builder = _builders[match.routePattern];
    if (builder != null) {
      return builder(ref, match);
    }

    return ScreenContext(
      route: match.location,
      displayName: match.location,
      barPlaceholder: genericBarPlaceholder,
    );
  }
}
