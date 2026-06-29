import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppSwitch extends StatelessWidget {
  const AppSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor,
    this.inactiveTrackColor,
    this.inactiveThumbColor,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final Color? activeColor;
  final Color? inactiveTrackColor;
  final Color? inactiveThumbColor;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final active = activeColor ?? c.primary;
    final inactiveTrack = inactiveTrackColor ?? c.muted;
    final inactiveThumb = inactiveThumbColor ?? c.mutedForeground;

    return SwitchTheme(
      data: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return c.primaryForeground;
          }
          return inactiveThumb;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return active;
          }
          return inactiveTrack;
        }),
        trackOutlineColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.transparent;
          }
          return c.border;
        }),
      ),
      child: Switch(
        value: value,
        onChanged: onChanged,
      ),
    );
  }
}
