import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class MultipleChoiceRenderer extends ExerciseRenderer {
  const MultipleChoiceRenderer();

  @override
  ExerciseType get type => ExerciseType.multipleChoice;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    return answer is String && answer.isNotEmpty;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'selectedChoice': answer as String};
  }

  @override
  Widget buildQuestion(Exercise exercise, BuildContext context) {
    return Text(
      exercise.question,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }

  @override
  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = exercise.options as MultipleChoiceOptions;
    final selected = currentAnswer as String?;

    return _MultipleChoiceInput(
      choices: options.choices,
      selected: selected,
      onSelected: onAnswerChanged,
    );
  }
}

class _MultipleChoiceInput extends StatelessWidget {
  const _MultipleChoiceInput({
    required this.choices,
    required this.selected,
    required this.onSelected,
  });

  final List<String> choices;
  final String? selected;
  final ValueChanged<dynamic> onSelected;

  static const _letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getExerciseVisuals(context, ExerciseType.multipleChoice);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: List.generate(choices.length, (index) {
        final choice = choices[index];
        final isSelected = selected == choice;
        final letter = index < _letters.length ? _letters[index] : '${index + 1}';

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: () => onSelected(choice),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md + 2,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? visuals.surface
                      : c.card,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(
                    color: isSelected ? visuals.accent : c.border,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    // Letter badge
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? visuals.accent
                            : c.muted,
                        borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                      ),
                      child: Center(
                        child: Text(
                          letter,
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? c.primaryForeground
                                : c.mutedForeground,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    // Choice text
                    Expanded(
                      child: Text(
                        choice,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w400,
                          color: isSelected ? visuals.accent : c.foreground,
                        ),
                      ),
                    ),
                    // Selection indicator
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSelected ? visuals.accent : Colors.transparent,
                        border: Border.all(
                          color: isSelected ? visuals.accent : c.border,
                          width: 2,
                        ),
                      ),
                      child: isSelected
                          ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                          : null,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
