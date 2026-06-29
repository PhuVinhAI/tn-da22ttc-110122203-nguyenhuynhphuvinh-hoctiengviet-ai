import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/assistant_bar_provider.dart';
import '../../../core/providers/bottom_sheet_provider.dart';
import '../../../core/router/app_router.dart';
import '../application/assistant_state_machine.dart';
import '../data/go_router_effective_route.dart';
import '../data/route_match.dart' as assistant_route;
import '../data/screen_context_provider.dart';
import '../data/screen_ui_snapshot_provider.dart';
import '../domain/assistant_state.dart';
import 'assistant_visibility.dart';
import 'screen_ui_snapshot.dart';
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
  late final ScreenUiSnapshotCoordinator _snapshotCoordinator;
  final _snapshotHostKey = GlobalKey<ScreenUiSnapshotHostState>();

  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _router = ref.read(routerProvider);
    _snapshotCoordinator = ref.read(screenUiSnapshotCoordinatorProvider);
    // Defer subscribing until AFTER the very first frame commits so that
    // `setInitialRoutePath` (which runs during the initial route widget's
    // didChangeDependencies) doesn't fire our listener mid-build, and so
    // the test environment's `pumpAndSettle` is not extended past the
    // first redirect by a stray microtask.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _router.routeInformationProvider.addListener(_scheduleRouteSync);
      _router.routerDelegate.addListener(_scheduleRouteSync);
      _listening = true;
      _handleRouteChange();
    });
  }

  @override
  void dispose() {
    if (_listening) {
      _router.routeInformationProvider.removeListener(_scheduleRouteSync);
      _router.routerDelegate.removeListener(_scheduleRouteSync);
    }
    _snapshotCoordinator.detach(_snapshotHostKey);
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
    try {
      _router.routerDelegate.currentConfiguration;
    } catch (_) {
      // Router not yet initialised (race during first frame of a test).
      return;
    }

    final next = effectiveRouteMatchFromGoRouter(_router);
    if (next.location.isEmpty) return;

    final current = ref.read(currentRouteMatchProvider);
    if (current != next) {
      ref.read(currentRouteMatchProvider.notifier).update(next);
    }
    _syncScreenUiSnapshotIfNeeded(next);
  }

  void _syncScreenUiSnapshotIfNeeded(assistant_route.RouteMatch match) {
    final registry = ref.read(screenContextRegistryProvider);
    if (registry.hasBuilderForLocation(match.location)) {
      ref.read(currentScreenUiSnapshotProvider.notifier).clear();
      return;
    }
    _syncScreenUiSnapshotNow();
  }

  void _syncScreenUiSnapshotNow() {
    final snapshot = _snapshotCoordinator.captureNow();
    if (snapshot == null) return;
    _storeScreenUiSnapshot(snapshot);
  }

  void _storeScreenUiSnapshot(ScreenUiSnapshot snapshot) {
    final notifier = ref.read(currentScreenUiSnapshotProvider.notifier);
    if (snapshot.isEmpty) {
      notifier.clear();
      return;
    }
    notifier.update(snapshot.toJson());
  }

  @override
  Widget build(BuildContext context) {
    _snapshotCoordinator.attach(_snapshotHostKey);

    final match = ref.watch(currentRouteMatchProvider);
    final assistantState = ref.watch(assistantStateMachineProvider);
    final assistantBarEnabled = ref.watch(assistantBarEnabledProvider);
    final isBottomSheetOpen = ref.watch(bottomSheetOpenProvider);

    final barShouldBeVisible =
        assistantBarEnabled &&
        isAssistantBarVisible(match?.location) &&
        assistantState is! AssistantFull;

    // Hide bar when sheet is open (any Mid state) or when any bottom sheet is open
    final showBar = barShouldBeVisible &&
        assistantState is AssistantCollapsed &&
        !isBottomSheetOpen;

    if (!barShouldBeVisible) {
      return ScreenUiSnapshotHost(key: _snapshotHostKey, child: widget.child);
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
            child: ScreenUiSnapshotHost(
              key: _snapshotHostKey,
              child: widget.child,
            ),
          ),
        ),
        Visibility(
          visible: showBar,
          maintainState: true,
          maintainAnimation: true,
          maintainSize: false,
          child: AssistantBar(
            onOpen: () {
              final match = ref.read(currentRouteMatchProvider);
              if (match != null) {
                _syncScreenUiSnapshotIfNeeded(match);
              } else {
                _syncScreenUiSnapshotNow();
              }
            },
          ),
        ),
      ],
    );
  }
}
