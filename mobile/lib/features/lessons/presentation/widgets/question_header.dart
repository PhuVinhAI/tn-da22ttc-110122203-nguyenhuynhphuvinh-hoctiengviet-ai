import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/exercise_models.dart';
import '../../domain/exercise_theme_helper.dart';

class QuestionHeader extends StatelessWidget {
  const QuestionHeader({
    super.key,
    required this.exercise,
    required this.renderer,
  });

  final Exercise exercise;
  final Widget renderer;

  @override
  Widget build(BuildContext context) {
    final visuals = getExerciseVisuals(context, exercise.exerciseType);

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
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: visuals.accent,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        renderer,
      ],
    );
  }
}
