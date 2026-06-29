import '../../../bookmarks/domain/bookmark_models.dart';

/// Compact bookmark entry for assistant screen context.
Map<String, dynamic> bookmarkContextSummary(
  BookmarkWithVocabulary bookmark, {
  String? preferredDialect,
  bool includeStudyDetails = false,
}) {
  final String displayedWord;
  if (preferredDialect != null &&
      bookmark.dialectVariants != null &&
      bookmark.dialectVariants![preferredDialect] != null &&
      bookmark.dialectVariants![preferredDialect]!.isNotEmpty) {
    displayedWord = bookmark.dialectVariants![preferredDialect]!;
  } else {
    displayedWord = bookmark.word;
  }

  return {
    'vocabularyId': bookmark.vocabularyId,
    'type': bookmark.type.value,
    'isPersonal': bookmark.isPersonal,
    if (bookmark.personalVocabularyId != null)
      'personalVocabularyId': bookmark.personalVocabularyId,
    'word': displayedWord,
    'translation': bookmark.translation,
    if (bookmark.partOfSpeech != null) 'partOfSpeech': bookmark.partOfSpeech,
    // Detail-sheet / flashcard-back fields. Only emitted when callers ask
    // for them so the bookmarks-list snapshot stays compact.
    if (includeStudyDetails && bookmark.classifier != null)
      'classifier': bookmark.classifier,
    if (includeStudyDetails && bookmark.exampleSentence != null)
      'exampleSentence': bookmark.exampleSentence,
    if (includeStudyDetails && bookmark.exampleTranslation != null)
      'exampleTranslation': bookmark.exampleTranslation,
  };
}
