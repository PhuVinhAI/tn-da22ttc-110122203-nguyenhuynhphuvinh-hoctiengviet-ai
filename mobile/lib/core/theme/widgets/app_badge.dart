import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';

class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.color,
    this.foregroundColor,
    this.fontSize,
    this.padding,
  });

  final String label;
  final Color? color;
  final Color? foregroundColor;
  final double? fontSize;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bgColor = color ?? c.muted;
    final effectiveFontSize = fontSize ?? AppTypography.caption;

    return Container(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
      decoration: BoxDecoration(
        color: bgColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: bgColor.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: effectiveFontSize,
          fontWeight: FontWeight.w600,
          color: foregroundColor ?? bgColor,
        ),
      ),
    );
  }
}
