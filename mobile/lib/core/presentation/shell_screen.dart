import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/widgets/widgets.dart';
import '../../features/daily_goals/data/app_session_timer.dart';
import '../../features/daily_goals/data/notification_service.dart';
import '../../features/daily_goals/data/daily_goal_progress_providers.dart';
import '../../features/profile/data/profile_providers.dart';

class ShellScreen extends ConsumerStatefulWidget {
  const ShellScreen({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen>
    with WidgetsBindingObserver {
  late final AppSessionTimer _sessionTimer;

  @override
  void initState() {
    super.initState();
    _sessionTimer = ref.read(appSessionTimerProvider);
    WidgetsBinding.instance.addObserver(this);
    if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
      _sessionTimer.onAppResumed();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        _sessionTimer.onAppResumed();
        _updateNotificationSchedule();
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        _sessionTimer.onAppPaused();
    }
  }

  void _updateNotificationSchedule() {
    final profile = ref.read(userProfileProvider).value;
    final progress = ref.read(dailyGoalProgressProvider).value;
    if (profile == null) return;

    if (profile.notificationEnabled) {
      if (progress != null &&
          (progress.goals.isEmpty || progress.allGoalsMet)) {
        NotificationService.cancelDailyReminder();
      } else {
        NotificationService.scheduleDailyReminder(
          notificationTime: profile.notificationTime,
        );
      }
    } else {
      NotificationService.cancelDailyReminder();
    }
  }

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    return switch (location) {
      '/' => 0,
      '/courses' => 1,
      '/profile' => 2,
      _ => 0,
    };
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
      case 1:
        context.go('/courses');
      case 2:
        context.go('/profile');
    }
  }

  @override
  void dispose() {
    _sessionTimer.onAppPaused();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(userProfileProvider, (_, __) => _updateNotificationSchedule());
    ref.listen(dailyGoalProgressProvider, (_, __) => _updateNotificationSchedule());

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: AppNavBar(
        selectedIndex: _getCurrentIndex(context),
        onDestinationSelected: (index) => _onTap(context, index),
        destinations: [
          const AppNavBarDestination(
            icon: Icons.home_outlined,
            selectedIcon: Icons.home,
            label: 'Home',
          ),
          const AppNavBarDestination(
            icon: Icons.school_outlined,
            selectedIcon: Icons.school,
            label: 'Courses',
          ),
          const AppNavBarDestination(
            icon: Icons.person_outlined,
            selectedIcon: Icons.person,
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
