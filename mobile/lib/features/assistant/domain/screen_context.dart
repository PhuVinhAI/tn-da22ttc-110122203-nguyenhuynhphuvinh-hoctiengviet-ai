import 'package:flutter/foundation.dart';

/// Snapshot of "what screen is the learner on right now and what should the
/// AI know about it" in PRD shape. Built reactively on the mobile side from
/// the current route + watched domain providers, then pushed to the backend
/// when the learner sends their first message.
///
/// Field semantics (per `.scratch/troly-ai/PRD.md`):
/// - [route]: matched go_router location, e.g. `/lessons/abc`
/// - [displayName]: short user-facing label of this screen, e.g. "Bài học · Greetings"
/// - [barPlaceholder]: the contextual placeholder shown inside the AssistantBar
/// - [data]: a JSON-serializable bag of screen-scoped facts used to build the
///   prompt; structure varies by route.
@immutable
class ScreenContext {
  const ScreenContext({
    required this.route,
    required this.displayName,
    required this.barPlaceholder,
    this.data = const {},
  });

  final String route;
  final String displayName;
  final String barPlaceholder;
  final Map<String, dynamic> data;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScreenContext &&
          route == other.route &&
          displayName == other.displayName &&
          barPlaceholder == other.barPlaceholder &&
          mapEquals(data, other.data);

  @override
  int get hashCode => Object.hash(
        route,
        displayName,
        barPlaceholder,
        Object.hashAllUnordered(
          data.entries.map((e) => Object.hash(e.key, e.value)),
        ),
      );

  @override
  String toString() =>
      'ScreenContext(route: $route, displayName: $displayName, '
      'barPlaceholder: $barPlaceholder, data: $data)';
}
