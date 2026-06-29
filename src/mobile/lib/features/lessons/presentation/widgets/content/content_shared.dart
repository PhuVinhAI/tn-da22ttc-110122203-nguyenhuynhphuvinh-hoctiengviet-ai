import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_theme.dart';

/// Tag nhỏ uppercase đầu mỗi nội dung — "VĂN BẢN".
class ContentTypeBadge extends StatelessWidget {
  const ContentTypeBadge({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Bản dịch nhỏ phía trên (kiểu eyebrow / subtitle).
class TranslationEyebrow extends StatelessWidget {
  const TranslationEyebrow({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: AppTypography.bodySmall,
        fontWeight: FontWeight.w500,
        fontStyle: FontStyle.italic,
        color: c.mutedForeground,
        height: 1.5,
      ),
    );
  }
}
