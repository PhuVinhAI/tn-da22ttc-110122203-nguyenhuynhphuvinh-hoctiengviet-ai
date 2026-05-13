import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppSpinner extends StatelessWidget {
  const AppSpinner({
    super.key,
    this.size = 24,
    this.color,
    this.strokeWidth = 2,
  });

  final double size;
  final Color? color;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        color: color ?? c.primary,
      ),
    );
  }
}
