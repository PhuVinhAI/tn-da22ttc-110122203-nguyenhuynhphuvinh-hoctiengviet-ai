import 'package:flutter/material.dart';

/// Semantic color tokens that give each exercise type a unique visual identity.
///
/// Register in [AppTheme.light] / [AppTheme.dark] via the `extensions` list,
/// then retrieve with `AppTheme.exerciseTokens(context)`.
class QuestionThemeTokens extends ThemeExtension<QuestionThemeTokens> {
  const QuestionThemeTokens({
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
    required this.listeningAccent,
    required this.listeningSurface,
    required this.speakingAccent,
    required this.speakingSurface,
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

  // ── Listening — Sky / Blue family ──
  final Color listeningAccent;
  final Color listeningSurface;

  // ── Speaking — Rose / Pink family ──
  final Color speakingAccent;
  final Color speakingSurface;

  // ── Light palette ──
  static const light = QuestionThemeTokens(
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
    listeningAccent: Color(0xFF0EA5E9), // Sky-500
    listeningSurface: Color(0xFFF0F9FF), // Sky-50
    speakingAccent: Color(0xFFE11D48), // Rose-600
    speakingSurface: Color(0xFFFFF1F2), // Rose-50
  );

  // ── Dark palette ──
  static const dark = QuestionThemeTokens(
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
    listeningAccent: Color(0xFF38BDF8), // Sky-400
    listeningSurface: Color(0xFF082F49), // Sky-950
    speakingAccent: Color(0xFFFB7185), // Rose-400
    speakingSurface: Color(0xFF4C0519), // Rose-950
  );

  @override
  QuestionThemeTokens copyWith({
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
    Color? listeningAccent,
    Color? listeningSurface,
    Color? speakingAccent,
    Color? speakingSurface,
  }) {
    return QuestionThemeTokens(
      multipleChoiceAccent: multipleChoiceAccent ?? this.multipleChoiceAccent,
      multipleChoiceSurface:
          multipleChoiceSurface ?? this.multipleChoiceSurface,
      fillBlankAccent: fillBlankAccent ?? this.fillBlankAccent,
      fillBlankSurface: fillBlankSurface ?? this.fillBlankSurface,
      matchingAccent: matchingAccent ?? this.matchingAccent,
      matchingSurface: matchingSurface ?? this.matchingSurface,
      orderingAccent: orderingAccent ?? this.orderingAccent,
      orderingSurface: orderingSurface ?? this.orderingSurface,
      translationAccent: translationAccent ?? this.translationAccent,
      translationSurface: translationSurface ?? this.translationSurface,
      listeningAccent: listeningAccent ?? this.listeningAccent,
      listeningSurface: listeningSurface ?? this.listeningSurface,
      speakingAccent: speakingAccent ?? this.speakingAccent,
      speakingSurface: speakingSurface ?? this.speakingSurface,
    );
  }

  @override
  QuestionThemeTokens lerp(QuestionThemeTokens? other, double t) {
    if (other is! QuestionThemeTokens) return this;
    return QuestionThemeTokens(
      multipleChoiceAccent: Color.lerp(
        multipleChoiceAccent,
        other.multipleChoiceAccent,
        t,
      )!,
      multipleChoiceSurface: Color.lerp(
        multipleChoiceSurface,
        other.multipleChoiceSurface,
        t,
      )!,
      fillBlankAccent: Color.lerp(fillBlankAccent, other.fillBlankAccent, t)!,
      fillBlankSurface: Color.lerp(
        fillBlankSurface,
        other.fillBlankSurface,
        t,
      )!,
      matchingAccent: Color.lerp(matchingAccent, other.matchingAccent, t)!,
      matchingSurface: Color.lerp(matchingSurface, other.matchingSurface, t)!,
      orderingAccent: Color.lerp(orderingAccent, other.orderingAccent, t)!,
      orderingSurface: Color.lerp(orderingSurface, other.orderingSurface, t)!,
      translationAccent: Color.lerp(
        translationAccent,
        other.translationAccent,
        t,
      )!,
      translationSurface: Color.lerp(
        translationSurface,
        other.translationSurface,
        t,
      )!,
      listeningAccent: Color.lerp(listeningAccent, other.listeningAccent, t)!,
      listeningSurface: Color.lerp(
        listeningSurface,
        other.listeningSurface,
        t,
      )!,
      speakingAccent: Color.lerp(speakingAccent, other.speakingAccent, t)!,
      speakingSurface: Color.lerp(speakingSurface, other.speakingSurface, t)!,
    );
  }
}
