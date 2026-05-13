const kPartOfSpeechViLabels = <String, String>{
  'noun': 'Noun',
  'verb': 'Verb',
  'adjective': 'Adjective',
  'adverb': 'Adverb',
  'pronoun': 'Pronoun',
  'preposition': 'Preposition',
  'conjunction': 'Conjunction',
  'phrase': 'Phrase',
  'interjection': 'Interjection',
};

enum BookmarkSort {
  newest('newest'),
  oldest('oldest'),
  az('az'),
  za('za'),
  difficulty('difficulty');

  const BookmarkSort(this.value);
  final String value;

  static BookmarkSort fromString(String value) {
    return BookmarkSort.values.firstWhere(
      (s) => s.value == value,
      orElse: () => BookmarkSort.newest,
    );
  }
}

class BookmarkWithVocabulary {
  BookmarkWithVocabulary({
    required this.id,
    required this.vocabularyId,
    required this.word,
    required this.translation,
    this.phonetic,
    this.partOfSpeech,
    this.exampleSentence,
    this.exampleTranslation,
    this.audioUrl,
    this.imageUrl,
    this.classifier,
    this.dialectVariants,
    this.audioUrls,
    this.difficultyLevel,
    required this.bookmarkedAt,
  });

  final String id;
  final String vocabularyId;
  final String word;
  final String translation;
  final String? phonetic;
  final String? partOfSpeech;
  final String? exampleSentence;
  final String? exampleTranslation;
  final String? audioUrl;
  final String? imageUrl;
  final String? classifier;
  final Map<String, String>? dialectVariants;
  final Map<String, String>? audioUrls;
  final int? difficultyLevel;
  final DateTime bookmarkedAt;

  factory BookmarkWithVocabulary.fromJson(Map<String, dynamic> json) {
    final vocab = json['vocabulary'] as Map<String, dynamic>? ?? json;
    return BookmarkWithVocabulary(
      id: (json['id'] ?? vocab['id']) as String,
      vocabularyId: (json['vocabularyId'] ?? vocab['id']) as String,
      word: vocab['word'] as String,
      translation: vocab['translation'] as String,
      phonetic: vocab['phonetic'] as String?,
      partOfSpeech: vocab['partOfSpeech'] as String?,
      exampleSentence: vocab['exampleSentence'] as String?,
      exampleTranslation: vocab['exampleTranslation'] as String?,
      audioUrl: vocab['audioUrl'] as String?,
      imageUrl: vocab['imageUrl'] as String?,
      classifier: vocab['classifier'] as String?,
      dialectVariants: (vocab['dialectVariants'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as String)),
      audioUrls: (vocab['audioUrls'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as String)),
      difficultyLevel: vocab['difficultyLevel'] as int?,
      bookmarkedAt: DateTime.parse((json['bookmarkedAt'] ?? vocab['createdAt']) as String),
    );
  }
}

class BookmarksPage {
  BookmarksPage({
    required this.items,
    required this.page,
    required this.limit,
    required this.totalPages,
    required this.totalItems,
  });

  final List<BookmarkWithVocabulary> items;
  final int page;
  final int limit;
  final int totalPages;
  final int totalItems;

  factory BookmarksPage.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List<dynamic>? ??
        json['data'] as List<dynamic>;
    final meta = json['meta'] as Map<String, dynamic>? ?? json;
    return BookmarksPage(
      items: itemsRaw
          .map((e) =>
              BookmarkWithVocabulary.fromJson(e as Map<String, dynamic>))
          .toList(),
      page: (meta['page'] ?? json['page']) as int,
      limit: (meta['limit'] ?? json['limit']) as int,
      totalPages: (meta['totalPages'] ?? json['totalPages']) as int,
      totalItems: (meta['total'] ?? json['totalItems']) as int,
    );
  }
}

class BookmarkStats {
  BookmarkStats({
    required this.total,
    required this.byPartOfSpeech,
  });

  final int total;
  final Map<String, int> byPartOfSpeech;

  factory BookmarkStats.fromJson(Map<String, dynamic> json) {
    return BookmarkStats(
      total: (json['total'] as num).toInt(),
      byPartOfSpeech: (json['byPartOfSpeech'] as Map<String, dynamic>)
          .map((k, v) => MapEntry(k, (v as num).toInt())),
    );
  }
}
