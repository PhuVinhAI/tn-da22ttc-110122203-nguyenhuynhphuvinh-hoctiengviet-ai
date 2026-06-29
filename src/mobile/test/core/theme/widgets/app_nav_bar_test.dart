import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/core/theme/widgets/app_nav_bar.dart';

void main() {
  testWidgets('shows a protruding center FAB and triggers center action', (
    tester,
  ) async {
    var tappedCenter = false;
    var selectedIndex = -1;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          bottomNavigationBar: AppNavBar(
            selectedIndex: 0,
            onDestinationSelected: (index) => selectedIndex = index,
            onCenterAction: () => tappedCenter = true,
            destinations: const [
              AppNavBarDestination(
                icon: Icons.home_outlined,
                selectedIcon: Icons.home,
                label: 'Home',
              ),
              AppNavBarDestination(
                icon: Icons.school_outlined,
                selectedIcon: Icons.school,
                label: 'Courses',
              ),
              AppNavBarDestination(
                icon: Icons.chat_bubble_outline,
                selectedIcon: Icons.chat_bubble,
                label: 'Practice',
              ),
              AppNavBarDestination(
                icon: Icons.person_outlined,
                selectedIcon: Icons.person,
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );

    expect(find.byKey(const ValueKey('app_nav_bar_camera_fab')), findsOneWidget);
    expect(find.byIcon(Icons.camera_alt_rounded), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('app_nav_bar_camera_fab')));
    await tester.pump();

    expect(tappedCenter, isTrue);
    expect(selectedIndex, -1);
  });
}
