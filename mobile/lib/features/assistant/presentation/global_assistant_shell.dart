import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../data/route_match.dart' as assistant;
import '../data/screen_context_provider.dart';
import 'assistant_visibility.dart';
import 'widgets/assistant_bar.dart';

/// Wraps the entire router output and renders the persistent assistant
/// surface (`AssistantBar` + sheet) below the route content. Hooked into
/// `MaterialApp.router(builder: ...)` from `mobile/lib/main.dart`.
///
/// The shell listens to GoRouter's route information stream and pushes
/// the current `RouteMatch` into `currentRouteMatchProvider`, so any
/// `ScreenContextBuilder` registered in the registry recomputes naturally
/// as the learner navigates.
class GlobalAssistantShell extends ConsumerStatefulWidget {
  const GlobalAssistantShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<GlobalAssistantShell> createState() =>
      _GlobalAssistantShellState();
}

class _GlobalAssistantShellState extends ConsumerState<GlobalAssistantShell> {
  late final GoRouter _router;

  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _router = ref.read(routerProvider);
    // Defer subscribing until AFTER the very first frame commits so that
    // `setInitialRoutePath` (which runs during the initial route widget's
    // didChangeDependencies) doesn't fire our listener mid-build, and so
    // the test environment's `pumpAndSettle` is not extended past the
    // first redirect by a stray microtask.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _router.routeInformationProvider.addListener(_scheduleRouteSync);
      _listening = true;
      _handleRouteChange();
    });
  }

  @override
  void dispose() {
    if (_listening) {
      _router.routeInformationProvider.removeListener(_scheduleRouteSync);
    }
    super.dispose();
  }

  /// GoRouter's listeners can fire from inside Flutter's build pipeline
  /// (e.g. `setInitialRoutePath` during `didChangeDependencies`). Riverpod
  /// disallows provider mutations from build, so we always defer by one
  /// microtask — harmless in production, mandatory in widget tests.
  void _scheduleRouteSync() {
    Future.microtask(_handleRouteChange);
  }

  void _handleRouteChange() {
    if (!mounted) return;
    final RouteMatchList config;
    try {
      config = _router.routerDelegate.currentConfiguration;
    } catch (_) {
      // Router not yet initialised (race during first frame of a test).
      return;
    }
    final fullPath = config.fullPath;
    final location = config.uri.toString();
    if (location.isEmpty) return;
    final pathParameters = config.pathParameters;
    final queryParameters = config.uri.queryParameters;

    final next = assistant.RouteMatch(
      routePattern: fullPath.isEmpty ? location : fullPath,
      location: location,
      pathParameters: Map<String, String>.from(pathParameters),
      queryParameters: Map<String, String>.from(queryParameters),
    );

    final current = ref.read(currentRouteMatchProvider);
    if (current != next) {
      ref.read(currentRouteMatchProvider.notifier).update(next);
    }
  }

  @override
  Widget build(BuildContext context) {
    final match = ref.watch(currentRouteMatchProvider);
    final visible = isAssistantBarVisible(match?.location);

    if (!visible) {
      return widget.child;
    }

    final mq = MediaQuery.of(context);
    return Column(
      mainAxisSize: MainAxisSize.max,
      children: [
        Expanded(
          child: MediaQuery(
            // Take ownership of the bottom safe-area inset so each route's
            // Scaffold + AppNavBar stops drawing into the gesture-bar zone
            // — the AssistantBar handles that with its own SafeArea below.
            data: mq.copyWith(
              padding: mq.padding.copyWith(bottom: 0),
              viewPadding: mq.viewPadding.copyWith(bottom: 0),
            ),
            child: widget.child,
          ),
        ),
        const AssistantBar(),
      ],
    );
  }
}
