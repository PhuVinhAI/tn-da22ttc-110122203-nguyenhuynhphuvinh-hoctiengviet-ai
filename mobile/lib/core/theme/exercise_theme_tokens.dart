import 'package:flutter/material.dart';

/// Semantic color tokens that give each exercise type a unique visual identity.
///
/// Register in [AppTheme.light] / [AppTheme.dark] via the `extensions` list,
/// then retrieve with `AppTheme.exerciseTokens(context)`.
class ExerciseThemeTokens extends ThemeExtension<ExerciseThemeTokens> {
  const ExerciseThemeTokens({
    required this.multipleChoiceAccent,
    required this.multipleChoiceSurface,
    required this.fillBlankAccent,
    required this.fillBlankSurface,
    required this.matchingAccent,
    required this.matchingSurface,
    required this.orderingAccent,
    required this.orderingSurface,
    required this.translationAccent,
    required this.translationSurface,
  });

  // ── Multiple Choice — Indigo family ──
  final Color multipleChoiceAccent;
  final Color multipleChoiceSurface;

  // ── Fill Blank — Amber / Orange family ──
  final Color fillBlankAccent;
  final Color fillBlankSurface;

  // ── Matching — Teal / Cyan family ──
  final Color matchingAccent;
  final Color matchingSurface;

  // ── Ordering — Emerald / Green family ──
  final Color orderingAccent;
  final Color orderingSurface;

  // ── Translation — Violet / Purple family ──
  final Color translationAccent;
  final Color translationSurface;

  // ── Light palette ──
  static const light = ExerciseThemeTokens(
    multipleChoiceAccent: Color(0xFF6366F1), // Indigo-500
    multipleChoiceSurface: Color(0xFFEEF2FF), // Indigo-50
    fillBlankAccent: Color(0xFFF59E0B), // Amber-500
    fillBlankSurface: Color(0xFFFFFBEB), // Amber-50
    matchingAccent: Color(0xFF14B8A6), // Teal-500
    matchingSurface: Color(0xFFF0FDFA), // Teal-50
    orderingAccent: Color(0xFF10B981), // Emerald-500
    orderingSurface: Color(0xFFECFDF5), // Emerald-50
    translationAccent: Color(0xFF8B5CF6), // Violet-500
    translationSurface: Color(0xFFF5F3FF), // Violet-50
  );

  // ── Dark palette ──
  static const dark = ExerciseThemeTokens(
    multipleChoiceAccent: Color(0xFF818CF8), // Indigo-400
    multipleChoiceSurface: Color(0xFF1E1B4B), // Indigo-950
    fillBlankAccent: Color(0xFFFBBF24), // Amber-400
    fillBlankSurface: Color(0xFF451A03), // Amber-950
    matchingAccent: Color(0xFF2DD4BF), // Teal-400
    matchingSurface: Color(0xFF042F2E), // Teal-950
    orderingAccent: Color(0xFF34D399), // Emerald-400
    orderingSurface: Color(0xFF022C22), // Emerald-950
    translationAccent: Color(0xFFA78BFA), // Violet-400
    translationSurface: Color(0xFF2E1065), // Violet-950
  );

  @override
  ExerciseThemeTokens copyWith({
    Color? multipleChoiceAccent,
    Color? multipleChoiceSurface,
    Color? fillBlankAccent,
    Color? fillBlankSurface,
    Color? matchingAccent,
    Color? matchingSurface,
    Color? orderingAccent,
    Color? orderingSurface,
    Color? translationAccent,
    Color? translationSurface,
  }) {
    return ExerciseThemeTokens(
      multipleChoiceAccent: multipleChoiceAccent ?? this.multipleChoiceAccent,
      multipleChoiceSurface: multipleChoiceSurface ?? this.multipleChoiceSurface,
      fillBlankAccent: fillBlankAccent ?? this.fillBlankAccent,
      fillBlankSurface: fillBlankSurface ?? this.fillBlankSurface,
      matchingAccent: matchingAccent ?? this.matchingAccent,
      matchingSurface: matchingSurface ?? this.matchingSurface,
      orderingAccent: orderingAccent ?? this.orderingAccent,
      orderingSurface: orderingSurface ?? this.orderingSurface,
      translationAccent: translationAccent ?? this.translationAccent,
      translationSurface: translationSurface ?? this.translationSurface,
    );
  }

  @override
  ExerciseThemeTokens lerp(ExerciseThemeTokens? other, double t) {
    if (other is! ExerciseThemeTokens) return this;
    return ExerciseThemeTokens(
      multipleChoiceAccent: Color.lerp(multipleChoiceAccent, other.multipleChoiceAccent, t)!,
      multipleChoiceSurface: Color.lerp(multipleChoiceSurface, other.multipleChoiceSurface, t)!,
      fillBlankAccent: Color.lerp(fillBlankAccent, other.fillBlankAccent, t)!,
      fillBlankSurface: Color.lerp(fillBlankSurface, other.fillBlankSurface, t)!,
      matchingAccent: Color.lerp(matchingAccent, other.matchingAccent, t)!,
      matchingSurface: Color.lerp(matchingSurface, other.matchingSurface, t)!,
      orderingAccent: Color.lerp(orderingAccent, other.orderingAccent, t)!,
      orderingSurface: Color.lerp(orderingSurface, other.orderingSurface, t)!,
      translationAccent: Color.lerp(translationAccent, other.translationAccent, t)!,
      translationSurface: Color.lerp(translationSurface, other.translationSurface, t)!,
    );
  }
}
