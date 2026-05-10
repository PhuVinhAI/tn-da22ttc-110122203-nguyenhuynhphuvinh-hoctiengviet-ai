import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ShellScreen extends StatelessWidget {
  const ShellScreen({super.key, required this.child});
  final Widget child;

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    return switch (location) {
      '/' => 0,
      '/courses' => 1,
      '/review' => 2,
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
        context.go('/review');
      case 3:
        context.go('/profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getCurrentIndex(context),
        onDestinationSelected: (index) => _onTap(context, index),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: 'Home',
            tooltip: 'Go to Home screen',
          ),
          NavigationDestination(
            icon: const Icon(Icons.school_outlined),
            selectedIcon: const Icon(Icons.school),
            label: 'Courses',
            tooltip: 'Browse available courses',
          ),
          NavigationDestination(
            icon: const Icon(Icons.style_outlined),
            selectedIcon: const Icon(Icons.style),
            label: 'Review',
            tooltip: 'Review vocabulary',
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outlined),
            selectedIcon: const Icon(Icons.person),
            label: 'Profile',
            tooltip: 'View your profile',
          ),
        ],
      ),
    );
  }
}
