import '../../../bookmarks/domain/bookmark_models.dart';

/// Compact bookmark entry for assistant screen context.
Map<String, dynamic> bookmarkContextSummary(BookmarkWithVocabulary bookmark, {String? preferredDialect}) {
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
    'word': displayedWord,
    'translation': bookmark.translation,
    if (bookmark.phonetic != null) 'phonetic': bookmark.phonetic,
    if (bookmark.partOfSpeech != null) 'partOfSpeech': bookmark.partOfSpeech,
    if (bookmark.difficultyLevel != null)
      'difficultyLevel': bookmark.difficultyLevel,
  };
}
