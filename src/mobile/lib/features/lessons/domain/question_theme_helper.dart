import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/question_theme_tokens.dart';
import 'question_models.dart';

/// Visual identity for a specific exercise type.
class QuestionTypeVisuals {
  const QuestionTypeVisuals({
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

/// Resolves the [QuestionTypeVisuals] for a given [QuestionType] using the
/// current theme's [QuestionThemeTokens].
QuestionTypeVisuals getQuestionVisuals(
  BuildContext context,
  QuestionType type,
) {
  final tokens = AppTheme.exerciseTokens(context);

  return switch (type) {
    QuestionType.multipleChoice => QuestionTypeVisuals(
      accent: tokens.multipleChoiceAccent,
      surface: tokens.multipleChoiceSurface,
      icon: Icons.radio_button_checked_rounded,
      label: S.of(context).multipleChoice,
    ),
    QuestionType.fillBlank => QuestionTypeVisuals(
      accent: tokens.fillBlankAccent,
      surface: tokens.fillBlankSurface,
      icon: Icons.text_fields_rounded,
      label: S.of(context).fillInTheBlank,
    ),
    QuestionType.matching => QuestionTypeVisuals(
      accent: tokens.matchingAccent,
      surface: tokens.matchingSurface,
      icon: Icons.compare_arrows_rounded,
      label: S.of(context).matchingExercise,
    ),
    QuestionType.ordering => QuestionTypeVisuals(
      accent: tokens.orderingAccent,
      surface: tokens.orderingSurface,
      icon: Icons.sort_rounded,
      label: S.of(context).orderingExercise,
    ),
    QuestionType.translation => QuestionTypeVisuals(
      accent: tokens.translationAccent,
      surface: tokens.translationSurface,
      icon: Icons.translate_rounded,
      label: S.of(context).translationLabel,
    ),
    QuestionType.listening => QuestionTypeVisuals(
      accent: tokens.listeningAccent,
      surface: tokens.listeningSurface,
      icon: Icons.headphones_rounded,
      label: S.of(context).listeningExercise,
    ),
    QuestionType.speaking => QuestionTypeVisuals(
      accent: tokens.speakingAccent,
      surface: tokens.speakingSurface,
      icon: Icons.mic_rounded,
      label: S.of(context).speakingExercise,
    ),
  };
}
