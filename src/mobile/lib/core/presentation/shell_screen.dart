import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/widgets/widgets.dart';
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
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _updateNotificationSchedule();
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
          title: S.of(context).dailyGoals,
          body: S.of(context).greatJobCompletedAllGoals,
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
      '/practice' => 2,
      '/profile' => 3,
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
        context.go('/practice');
      case 3:
        context.go('/profile');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(userProfileProvider, (_, _) => _updateNotificationSchedule());
    ref.listen(
      dailyGoalProgressProvider,
      (_, _) => _updateNotificationSchedule(),
    );

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          widget.child,
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: AppNavBar(
              selectedIndex: _getCurrentIndex(context),
              onDestinationSelected: (index) => _onTap(context, index),
              onCenterAction: () => context.push('/camera'),
              destinations: [
                AppNavBarDestination(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: S.of(context).homeNavBar,
                ),
                AppNavBarDestination(
                  icon: Icons.school_outlined,
                  selectedIcon: Icons.school,
                  label: S.of(context).coursesTitle,
                ),
                AppNavBarDestination(
                  icon: Icons.chat_bubble_outline,
                  selectedIcon: Icons.chat_bubble,
                  label: S.of(context).practiceTitle,
                ),
                AppNavBarDestination(
                  icon: Icons.person_outlined,
                  selectedIcon: Icons.person,
                  label: S.of(context).profileTitle,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
