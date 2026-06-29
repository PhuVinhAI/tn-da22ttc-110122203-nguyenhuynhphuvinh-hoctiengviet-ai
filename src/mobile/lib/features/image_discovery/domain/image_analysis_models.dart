enum ImageDiscoveryError {
  unableToLoadImage,
  maxImagesReached,
  addPhotoFirst,
  unableToAnalyzeImage,
  unableToSaveVocabulary,
}

class ImageAnalysisRequestImage {
  const ImageAnalysisRequestImage({
    required this.base64,
    required this.mimeType,
  });

  final String base64;
  final String mimeType;

  Map<String, dynamic> toJson() => {'base64': base64, 'mimeType': mimeType};
}

class ImageAnalysisChatHistoryMessage {
  const ImageAnalysisChatHistoryMessage({
    required this.role,
    required this.content,
  });

  final String role;
  final String content;

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
}

class ImageAnalysisVocabulary {
  const ImageAnalysisVocabulary({
    required this.word,
    required this.translation,
    this.partOfSpeech,
    this.exampleSentence,
    this.exampleTranslation,
    this.classifier,
  });

  final String word;
  final String translation;
  final String? partOfSpeech;
  final String? exampleSentence;
  final String? exampleTranslation;
  final String? classifier;

  factory ImageAnalysisVocabulary.fromJson(Map<String, dynamic> json) {
    return ImageAnalysisVocabulary(
      word: json['word'] as String,
      translation: json['translation'] as String,
      partOfSpeech: json['partOfSpeech'] as String?,
      exampleSentence: json['exampleSentence'] as String?,
      exampleTranslation: json['exampleTranslation'] as String?,
      classifier: json['classifier'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'word': word,
    'translation': translation,
    if (partOfSpeech != null) 'partOfSpeech': partOfSpeech,
    if (exampleSentence != null) 'exampleSentence': exampleSentence,
    if (exampleTranslation != null) 'exampleTranslation': exampleTranslation,
    if (classifier != null) 'classifier': classifier,
  };
}

class ImageAnalysisResponse {
  const ImageAnalysisResponse({required this.text, required this.vocabularies});

  final String text;
  final List<ImageAnalysisVocabulary> vocabularies;

  factory ImageAnalysisResponse.fromJson(Map<String, dynamic> json) {
    return ImageAnalysisResponse(
      text: json['text'] as String,
      vocabularies: (json['vocabularies'] as List<dynamic>? ?? [])
          .map(
            (item) =>
                ImageAnalysisVocabulary.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}
