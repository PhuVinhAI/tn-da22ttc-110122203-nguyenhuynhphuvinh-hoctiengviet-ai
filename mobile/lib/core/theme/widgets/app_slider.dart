import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppSlider extends StatelessWidget {
  const AppSlider({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 100,
    this.divisions,
    this.label,
    this.activeColor,
    this.inactiveColor,
  });

  final double value;
  final ValueChanged<double>? onChanged;
  final double min;
  final double max;
  final int? divisions;
  final String? label;
  final Color? activeColor;
  final Color? inactiveColor;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return SliderTheme(
      data: SliderThemeData(
        activeTrackColor: activeColor ?? c.primary,
        inactiveTrackColor: inactiveColor ?? c.muted,
        thumbColor: activeColor ?? c.primary,
        overlayColor: (activeColor ?? c.primary).withValues(alpha: 0.12),
        trackHeight: 4,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
      ),
      child: Slider(
        value: value,
        onChanged: onChanged,
        min: min,
        max: max,
        divisions: divisions,
        label: label,
      ),
    );
  }
}
