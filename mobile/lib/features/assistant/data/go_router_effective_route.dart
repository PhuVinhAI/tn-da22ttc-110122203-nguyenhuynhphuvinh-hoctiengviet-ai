import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_router.dart';
import 'route_match.dart' as assistant;
import 'screen_context_provider.dart';

/// Resolves the route the learner actually sees, including routes opened via
/// [GoRouter.push] ([ImperativeRouteMatch]) and leaf routes inside a
/// [ShellRoute].
///
/// [RouteMatchList.fullPath] and [RouteMatchList.uri] ignore imperative matches,
/// so reading them directly mis-reports e.g. `/courses` while the user is on
/// `/courses/:id` pushed from the courses tab.
assistant.RouteMatch effectiveRouteMatchFromGoRouter(GoRouter router) {
  final matchList = router.routerDelegate.currentConfiguration;
  if (matchList.isEmpty) {
    return _fromRouteInformation(router) ??
        const assistant.RouteMatch(routePattern: '/', location: '/');
  }

  final imperative = _findLastImperativeMatch(matchList.matches);
  if (imperative != null) {
    final inner = imperative.matches;
    return assistant.RouteMatch(
      routePattern: inner.fullPath,
      location: inner.uri.path,
      pathParameters: Map<String, String>.from(inner.pathParameters),
      queryParameters: Map<String, String>.from(inner.uri.queryParameters),
    );
  }

  var routePattern = matchList.fullPath;
  var location = matchList.uri.path;
  final pathParameters = Map<String, String>.from(matchList.pathParameters);

  if (matchList.matches.isNotEmpty) {
    RouteMatchBase lastMatch = matchList.matches.last;
    while (lastMatch is ShellRouteMatch) {
      if (lastMatch.matches.isEmpty) break;
      lastMatch = lastMatch.matches.last;
    }

    if (lastMatch is RouteMatch) {
      location = lastMatch.matchedLocation;
      routePattern = lastMatch.route.path;
    }
  }

  final infoPath = router.routeInformationProvider.value.uri.path;
  if (infoPath.isNotEmpty && infoPath != location) {
    location = infoPath;
  }

  return assistant.RouteMatch(
    routePattern: routePattern.isNotEmpty ? routePattern : location,
    location: location.isNotEmpty ? location : '/',
    pathParameters: pathParameters,
    queryParameters: Map<String, String>.from(
      router.routeInformationProvider.value.uri.queryParameters,
    ),
  );
}

ImperativeRouteMatch? _findLastImperativeMatch(List<RouteMatchBase> matches) {
  ImperativeRouteMatch? found;
  for (final match in matches) {
    if (match is ImperativeRouteMatch) {
      found = match;
    } else if (match is ShellRouteMatch) {
      found = _findLastImperativeMatch(match.matches) ?? found;
    }
  }
  return found;
}

assistant.RouteMatch? _fromRouteInformation(GoRouter router) {
  final path = router.routeInformationProvider.value.uri.path;
  if (path.isEmpty) return null;
  return assistant.RouteMatch(
    routePattern: path,
    location: path,
    queryParameters: Map<String, String>.from(
      router.routeInformationProvider.value.uri.queryParameters,
    ),
  );
}

/// Pushes the latest effective route into [currentRouteMatchProvider].
void syncCurrentRouteMatch(Ref ref) {
  final router = ref.read(routerProvider);
  RouteMatchList config;
  try {
    config = router.routerDelegate.currentConfiguration;
  } catch (_) {
    return;
  }
  if (config.isEmpty) return;

  final next = effectiveRouteMatchFromGoRouter(router);
  final current = ref.read(currentRouteMatchProvider);

  // Unit tests stub [currentRouteMatchProvider] without a mounted router tree.
  if (current != null && _isBootstrapRoute(next.location)) {
    return;
  }

  if (current != null && current.location != next.location) {
    final registry = ref.read(screenContextRegistryProvider);
    final currentHasBuilder = registry.hasBuilderForLocation(current.location);
    final nextHasBuilder = registry.hasBuilderForLocation(next.location);
    if (currentHasBuilder &&
        !nextHasBuilder &&
        next.location.length <= current.location.length) {
      return;
    }
  }

  if (current != next) {
    ref.read(currentRouteMatchProvider.notifier).update(next);
  }
}

bool _isBootstrapRoute(String location) {
  return location == '/splash' ||
      location == '/login' ||
      location == '/register' ||
      location == '/onboarding';
}
