import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/screen_context.dart';
import 'route_match.dart';
import 'route_pattern_match.dart';

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

  /// Whether a domain-aware builder is registered for [routePattern].
  bool hasBuilder(String routePattern) => _builders.containsKey(routePattern);

  /// Most specific registered pattern for [location], if any.
  String? patternForLocation(String location) {
    return bestPatternForLocation(location, _builders.keys);
  }

  bool hasBuilderForLocation(String location) {
    return patternForLocation(location) != null;
  }

  RouteMatch _enrichedMatch(RouteMatch match) {
    final pattern =
        patternForLocation(match.location) ?? match.routePattern;
    final fromLocation = pathParametersFromLocation(match.location, pattern);
    return RouteMatch(
      routePattern: pattern,
      location: match.location,
      pathParameters: {...fromLocation, ...match.pathParameters},
      queryParameters: match.queryParameters,
    );
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

    final enriched = _enrichedMatch(match);
    final builder = _builders[enriched.routePattern];
    if (builder != null) {
      return builder(ref, enriched);
    }

    return ScreenContext(
      route: enriched.location,
      displayName: enriched.location,
      barPlaceholder: genericBarPlaceholder,
    );
  }
}
