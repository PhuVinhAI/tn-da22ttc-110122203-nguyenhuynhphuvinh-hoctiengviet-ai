import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/exercise_theme_tokens.dart';
import 'exercise_models.dart';

/// Visual identity for a specific exercise type.
class ExerciseTypeVisuals {
  const ExerciseTypeVisuals({
    required this.accent,
    required this.surface,
    required this.icon,
    required this.label,
  });

  /// Primary accent color for this exercise type.
  final Color accent;

  /// Subtle background / surface color (low-opacity accent).
  final Color surface;

  /// Representative icon for this exercise type.
  final IconData icon;

  /// Human-readable label for the exercise type.
  final String label;
}

/// Resolves the [ExerciseTypeVisuals] for a given [ExerciseType] using the
/// current theme's [ExerciseThemeTokens].
ExerciseTypeVisuals getExerciseVisuals(
  BuildContext context,
  ExerciseType type,
) {
  final tokens = AppTheme.exerciseTokens(context);

  return switch (type) {
    ExerciseType.multipleChoice => ExerciseTypeVisuals(
      accent: tokens.multipleChoiceAccent,
      surface: tokens.multipleChoiceSurface,
      icon: Icons.radio_button_checked_rounded,
      label: 'Multiple Choice',
    ),
    ExerciseType.fillBlank => ExerciseTypeVisuals(
      accent: tokens.fillBlankAccent,
      surface: tokens.fillBlankSurface,
      icon: Icons.text_fields_rounded,
      label: 'Fill in the Blank',
    ),
    ExerciseType.matching => ExerciseTypeVisuals(
      accent: tokens.matchingAccent,
      surface: tokens.matchingSurface,
      icon: Icons.compare_arrows_rounded,
      label: 'Matching',
    ),
    ExerciseType.ordering => ExerciseTypeVisuals(
      accent: tokens.orderingAccent,
      surface: tokens.orderingSurface,
      icon: Icons.sort_rounded,
      label: 'Ordering',
    ),
    ExerciseType.translation => ExerciseTypeVisuals(
      accent: tokens.translationAccent,
      surface: tokens.translationSurface,
      icon: Icons.translate_rounded,
      label: 'Translation',
    ),
    ExerciseType.listening => ExerciseTypeVisuals(
      accent: tokens.listeningAccent,
      surface: tokens.listeningSurface,
      icon: Icons.headphones_rounded,
      label: 'Listening',
    ),
    ExerciseType.speaking => ExerciseTypeVisuals(
      accent: tokens.speakingAccent,
      surface: tokens.speakingSurface,
      icon: Icons.mic_rounded,
      label: 'Speaking',
    ),
  };
}
