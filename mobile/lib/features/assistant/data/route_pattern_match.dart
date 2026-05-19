/// Matches a concrete [location] against a go_router-style [pattern]
/// (e.g. `/courses/:id`).
bool locationMatchesPattern(String location, String pattern) {
  final patternSegments =
      pattern.split('/').where((segment) => segment.isNotEmpty).toList();
  final locationSegments =
      location.split('/').where((segment) => segment.isNotEmpty).toList();
  if (patternSegments.length != locationSegments.length) return false;

  for (var i = 0; i < patternSegments.length; i++) {
    final patternSegment = patternSegments[i];
    if (patternSegment.startsWith(':')) continue;
    if (patternSegment != locationSegments[i]) return false;
  }
  return true;
}

/// Picks the most specific registered pattern that matches [location].
String? bestPatternForLocation(String location, Iterable<String> patterns) {
  String? best;
  var bestDepth = -1;
  for (final pattern in patterns) {
    if (!locationMatchesPattern(location, pattern)) continue;
    final depth = pattern.split('/').where((segment) => segment.isNotEmpty).length;
    if (depth > bestDepth) {
      bestDepth = depth;
      best = pattern;
    }
  }
  return best;
}

/// Extracts `:param` values from [location] using [pattern].
Map<String, String> pathParametersFromLocation(String location, String pattern) {
  final patternSegments =
      pattern.split('/').where((segment) => segment.isNotEmpty).toList();
  final locationSegments =
      location.split('/').where((segment) => segment.isNotEmpty).toList();
  if (patternSegments.length != locationSegments.length) return const {};

  final params = <String, String>{};
  for (var i = 0; i < patternSegments.length; i++) {
    final patternSegment = patternSegments[i];
    if (!patternSegment.startsWith(':')) continue;
    params[patternSegment.substring(1)] = locationSegments[i];
  }
  return params;
}
