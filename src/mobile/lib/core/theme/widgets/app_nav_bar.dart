import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';

class AppNavBar extends StatelessWidget {
  const AppNavBar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    this.onCenterAction,
    this.centerActionIcon = Icons.camera_alt_rounded,
    this.centerActionTooltip = 'Open camera',
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<AppNavBarDestination> destinations;
  final VoidCallback? onCenterAction;
  final IconData centerActionIcon;
  final String centerActionTooltip;

  static const double protrusionHeight = 16;
  static const double _barVerticalPadding = AppSpacing.md;
  static const double _destinationHeight =
      AppSpacing.xs * 2 + // item vertical padding
      AppSpacing.sm * 2 + // icon container padding
      24 + // icon size
      4 + // label gap
      12; // caption line height
  static const double barContentHeight =
      _barVerticalPadding * 2 + _destinationHeight;

  /// Full inset needed so scrollable content clears the nav bar overlay.
  static double bottomInset(BuildContext context) {
    return protrusionHeight +
        barContentHeight +
        MediaQuery.paddingOf(context).bottom +
        AppSpacing.lg;
  }

  /// Use as ListView / CustomScrollView bottom padding on tab screens.
  static EdgeInsets scrollPadding(
    BuildContext context, {
    EdgeInsets base = EdgeInsets.zero,
  }) {
    return base.copyWith(bottom: base.bottom + bottomInset(context));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final centerIndex = destinations.length ~/ 2;
    final items = <Widget>[];

    for (var index = 0; index < destinations.length; index++) {
      if (index == centerIndex) {
        items.add(const SizedBox(width: 64));
      }

      items.add(
        _AppNavBarDestinationItem(
          destination: destinations[index],
          isSelected: index == selectedIndex,
          onTap: () => onDestinationSelected(index),
        ),
      );
    }

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.lg,
            protrusionHeight,
            AppSpacing.lg,
            MediaQuery.of(context).padding.bottom + AppSpacing.sm,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              border: Border.all(color: c.border, width: 1),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs,
              vertical: AppSpacing.sm + 2,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: items,
            ),
          ),
        ),
        Positioned(
          top: 0,
          child: _AppNavBarCenterAction(
            icon: centerActionIcon,
            tooltip: centerActionTooltip,
            onTap: onCenterAction,
          ),
        ),
      ],
    );
  }
}

class _AppNavBarDestinationItem extends StatelessWidget {
  const _AppNavBarDestinationItem({
    required this.destination,
    required this.isSelected,
    required this.onTap,
  });

  final AppNavBarDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xs,
              vertical: AppSpacing.sm,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isSelected ? destination.selectedIcon : destination.icon,
                  color: isSelected ? c.primary : c.mutedForeground,
                  size: 24,
                ),
                const SizedBox(height: 4),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.caption,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected ? c.primary : c.mutedForeground,
                    height: 1.0,
                  ),
                  child: Text(
                    destination.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AppNavBarCenterAction extends StatelessWidget {
  const _AppNavBarCenterAction({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final enabled = onTap != null;

    return Tooltip(
      message: tooltip,
      child: Semantics(
        button: true,
        label: tooltip,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            key: const ValueKey('app_nav_bar_camera_fab'),
            onTap: onTap,
            customBorder: const CircleBorder(),
            child: AnimatedOpacity(
              opacity: enabled ? 1 : 0.5,
              duration: const Duration(milliseconds: 200),
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: c.primary,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: c.background,
                    width: 4,
                  ),
                ),
                child: Icon(icon, color: c.primaryForeground, size: 28),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AppNavBarDestination {
  const AppNavBarDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}
