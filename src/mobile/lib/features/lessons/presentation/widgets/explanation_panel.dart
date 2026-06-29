import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:linvnix/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';

class ExplanationPanel extends StatelessWidget {
  const ExplanationPanel({
    super.key,
    required this.isCorrect,
    required this.correctAnswer,
    this.explanation,
    this.score,
  });

  final bool isCorrect;
  final String correctAnswer;
  final String? explanation;
  final int? score;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = isCorrect ? c.success : c.error;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: accent.withValues(alpha: 0.3), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle : Icons.cancel,
                color: accent,
                size: 22,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                isCorrect
                    ? S.of(context).correctLabel
                    : S.of(context).incorrectLabel,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyLarge,
                  fontWeight: FontWeight.w700,
                  color: accent,
                ),
              ),
              if (score != null) ...[
                const Spacer(),
                Text(
                  S.of(context).pointsParam(score!),
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    fontWeight: FontWeight.w700,
                    color: accent,
                  ),
                ),
              ],
            ],
          ),
          if (!isCorrect) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              S.of(context).correctAnswerParam(correctAnswer),
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.foreground,
                fontWeight: FontWeight.w600,
                height: 1.45,
              ),
            ),
          ],
          if (explanation != null && explanation!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              explanation!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
