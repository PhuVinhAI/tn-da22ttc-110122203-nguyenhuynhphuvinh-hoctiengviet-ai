import '../../lessons/domain/question_models.dart';

/// Returns a JSON-safe representation of [answer] for the given [type],
/// suitable for inclusion in `ScreenContext.data` and forwarding to the
/// LLM over Dio's default JSON encoder.
///
/// Matching exercises hand back `List<MatchPair>`, which is not directly
/// JSON-encodable — convert to `[{left, right}, ...]`. Every other type
/// already stores primitives or `List<String>` / `String`, so we forward
/// them as-is.
Object? userAnswerForAssistantContext(QuestionType type, dynamic answer) {
  if (answer == null) return null;
  if (type == QuestionType.matching && answer is List<MatchPair>) {
    return answer
        .map((p) => <String, String>{'left': p.left, 'right': p.right})
        .toList(growable: false);
  }
  return answer;
}

/// Returns the subset of `Exercise.options.toJson()` safe to expose to the
/// assistant.
///
/// Pre-submit (`revealAnswers: false`), strips fields that ARE the answer:
/// `acceptedAnswers`, `acceptedTranslations`, the correct match mapping
/// (`pairs`), the canonical ordering (`items`), and `keywords` hints. The
/// AI still gets enough to ground hints (e.g. number of blanks, language
/// direction, audio URL) but can't simply read off the answer.
///
/// Post-submit, the full payload is returned because the learner already
/// sees the correct answer in the `ExplanationPanel` — the AI's job at
/// that point is to explain mistakes, not preserve mystery.
Map<String, dynamic> optionsForAssistantContext(
  Question question, {
  required bool revealAnswers,
}) {
  final raw = question.options.toJson();
  if (revealAnswers) return _stripNulls(raw);

  switch (question.questionType) {
    case QuestionType.multipleChoice:
      // Choices are all visible to the user — no leak.
      return _stripNulls(raw);
    case QuestionType.fillBlank:
      return {
        if (raw['blanks'] != null) 'blanks': raw['blanks'],
        // wordBank is shown to the learner — safe to share with the AI so it
        // can ground hints in the actual chips available.
        if (raw['wordBank'] != null) 'wordBank': raw['wordBank'],
      };
    case QuestionType.matching:
      // pairs.left ↔ pairs.right IS the answer. Split into independent
      // item lists (the right column is alphabetised, never matched).
      final pairs = (raw['pairs'] as List?)?.cast<dynamic>() ?? const [];
      final lefts = pairs
          .map((p) => (p as Map)['left'] as String? ?? '')
          .toList(growable: false);
      final rights = pairs
          .map((p) => (p as Map)['right'] as String? ?? '')
          .toList(growable: false)
        ..sort();
      return {
        'leftItems': lefts,
        'rightItems': rights,
        'pairCount': pairs.length,
      };
    case QuestionType.ordering:
      // items is the canonical correct order. Alphabetise so the AI
      // knows the pool without knowing the ranking.
      final items = ((raw['items'] as List?) ?? const [])
          .map((e) => e as String)
          .toList()
        ..sort();
      return {
        'availableItems': items,
        'itemCount': items.length,
      };
    case QuestionType.translation:
      return {
        if (raw['sourceLanguage'] != null)
          'sourceLanguage': raw['sourceLanguage'],
        if (raw['targetLanguage'] != null)
          'targetLanguage': raw['targetLanguage'],
      };
    case QuestionType.listening:
      // `keywords` would give the AI partial answer; suppress until
      // submitted.
      return {
        if (raw['audioUrl'] != null) 'audioUrl': raw['audioUrl'],
        if (raw['transcriptType'] != null)
          'transcriptType': raw['transcriptType'],
      };
    case QuestionType.speaking:
      // promptText and promptAudioUrl ARE shown to the learner, so
      // safe to forward. `keywords` is suppressed for the same reason
      // as listening.
      return {
        if (raw['promptText'] != null) 'promptText': raw['promptText'],
        if (raw['promptAudioUrl'] != null)
          'promptAudioUrl': raw['promptAudioUrl'],
        if (raw['transcriptType'] != null)
          'transcriptType': raw['transcriptType'],
      };
  }
}

Map<String, dynamic> _stripNulls(Map<String, dynamic> raw) {
  final out = <String, dynamic>{};
  for (final entry in raw.entries) {
    if (entry.value != null) out[entry.key] = entry.value;
  }
  return out;
}
