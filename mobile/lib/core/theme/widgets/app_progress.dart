import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppProgress extends StatelessWidget {
  const AppProgress({
    super.key,
    this.value,
    this.isCircular = false,
    this.color,
    this.trackColor,
    this.height = 3,
    this.radius = 16,
    this.strokeWidth = 4,
  });

  final double? value;
  final bool isCircular;
  final Color? color;
  final Color? trackColor;
  final double height;
  final double radius;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final activeColor = color ?? c.primary;
    final track = trackColor ?? c.muted;

    if (isCircular) {
      return SizedBox(
        width: radius * 2,
        height: radius * 2,
        child: CircularProgressIndicator(
          value: value,
          color: activeColor,
          backgroundColor: track,
          strokeWidth: strokeWidth,
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(height / 2),
      child: SizedBox(
        height: height,
        child: LinearProgressIndicator(
          value: value,
          color: activeColor,
          backgroundColor: track,
          minHeight: height,
        ),
      ),
    );
  }
}
