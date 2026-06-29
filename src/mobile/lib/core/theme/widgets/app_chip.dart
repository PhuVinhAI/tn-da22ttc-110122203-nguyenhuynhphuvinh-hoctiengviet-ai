import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';

class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.color,
    this.fontSize,
    this.padding,
  });

  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final Color? color;
  final double? fontSize;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accentColor = color ?? c.primary;
    final effectiveFontSize = fontSize ?? AppTypography.caption;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ??
            const EdgeInsets.symmetric(
              horizontal: AppSpacing.md + 2,
              vertical: AppSpacing.sm,
            ),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withValues(alpha: 0.12) : c.muted,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
            color: isSelected ? accentColor : c.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: effectiveFontSize,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? accentColor : c.foreground,
          ),
        ),
      ),
    );
  }
}
