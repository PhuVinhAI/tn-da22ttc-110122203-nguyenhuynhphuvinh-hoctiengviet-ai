import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/question_models.dart';
import '../../domain/question_renderer.dart';
import '../../domain/question_theme_helper.dart';

class QuestionHeader extends StatelessWidget {
  const QuestionHeader({
    super.key,
    required this.question,
    required this.renderer,
  });

  final Question question;
  final QuestionRenderer renderer;

  @override
  Widget build(BuildContext context) {
    final visuals = getQuestionVisuals(context, question.questionType);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs + 2,
          ),
          decoration: BoxDecoration(
            color: visuals.accent.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(AppRadius.full),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.25),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                visuals.icon,
                size: 14,
                color: visuals.accent,
              ),
              const SizedBox(width: AppSpacing.xs + 2),
              Text(
                visuals.label,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.caption,
                  color: visuals.accent,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                    ),
              ),
            ],
          ),
        ),
        if (renderer.showsQuestion) ...[
          const SizedBox(height: 16),
          renderer.buildQuestion(question, context),
        ],
      ],
    );
  }
}
