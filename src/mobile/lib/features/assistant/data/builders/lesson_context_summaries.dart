import '../../../lessons/domain/lesson_models.dart';

const _maxGrammarExplanationLength = 600;

/// Compact vocabulary entry for assistant screen context.
Map<String, dynamic> vocabularyContextSummary(LessonVocabulary vocabulary, {String? preferredDialect}) {
  final String displayedWord;
  if (preferredDialect != null &&
      vocabulary.dialectVariants != null &&
      vocabulary.dialectVariants![preferredDialect] != null &&
      vocabulary.dialectVariants![preferredDialect]!.isNotEmpty) {
    displayedWord = vocabulary.dialectVariants![preferredDialect]!;
  } else {
    displayedWord = vocabulary.word;
  }

  return {
    'id': vocabulary.id,
    'word': displayedWord,
    'translation': vocabulary.translation,
    if (vocabulary.partOfSpeech != null) 'partOfSpeech': vocabulary.partOfSpeech,
    if (vocabulary.classifier != null) 'classifier': vocabulary.classifier,
    if (vocabulary.exampleSentence != null)
      'exampleSentence': vocabulary.exampleSentence,
    if (vocabulary.exampleTranslation != null)
      'exampleTranslation': vocabulary.exampleTranslation,
    'isBookmarked': vocabulary.isBookmarked,
  };
}

/// Compact grammar rule for assistant screen context.
Map<String, dynamic> grammarRuleContextSummary(GrammarRule rule) {
  return {
    'id': rule.id,
    'title': rule.title,
    'explanation': _truncate(rule.explanation, _maxGrammarExplanationLength),
    if (rule.structure != null) 'structure': rule.structure,
    if (rule.notes != null && rule.notes!.isNotEmpty) 'notes': rule.notes,
    if (rule.examples.isNotEmpty)
      'examples': rule.examples
          .take(3)
          .map(
            (e) => {
              'vi': e.vi,
              'en': e.en,
              if (e.note != null) 'note': e.note,
            },
          )
          .toList(growable: false),
  };
}

String _truncate(String text, int maxLength) {
  if (text.length <= maxLength) return text;
  return '${text.substring(0, maxLength - 3)}...';
}
