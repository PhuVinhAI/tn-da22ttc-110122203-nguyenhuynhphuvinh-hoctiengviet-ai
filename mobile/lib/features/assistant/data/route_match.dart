import 'package:flutter/foundation.dart';

/// A snapshot of the current route, mirroring the subset of `GoRouterState`
/// the assistant cares about. Kept as a plain value so it can be pushed into
/// a Riverpod provider without any go_router dependency in domain code.
@immutable
class RouteMatch {
  const RouteMatch({
    required this.routePattern,
    required this.location,
    this.pathParameters = const {},
    this.queryParameters = const {},
  });

  /// The route's parameterised pattern, e.g. `/lessons/:id`. Used by the
  /// `ScreenContextRegistry` as a lookup key.
  final String routePattern;

  /// The concrete matched location, e.g. `/lessons/abc`.
  final String location;

  final Map<String, String> pathParameters;
  final Map<String, String> queryParameters;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteMatch &&
          routePattern == other.routePattern &&
          location == other.location &&
          mapEquals(pathParameters, other.pathParameters) &&
          mapEquals(queryParameters, other.queryParameters);

  @override
  int get hashCode => Object.hash(
        routePattern,
        location,
        Object.hashAllUnordered(
          pathParameters.entries.map((e) => Object.hash(e.key, e.value)),
        ),
        Object.hashAllUnordered(
          queryParameters.entries.map((e) => Object.hash(e.key, e.value)),
        ),
      );

  @override
  String toString() =>
      'RouteMatch(routePattern: $routePattern, location: $location, '
      'pathParameters: $pathParameters, queryParameters: $queryParameters)';
}
