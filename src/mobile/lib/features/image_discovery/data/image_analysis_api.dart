import 'package:dio/dio.dart';

import '../domain/image_analysis_models.dart';

class ImageAnalysisApi {
  ImageAnalysisApi(this._dio);

  final Dio _dio;

  static final _aiRequestOptions = Options(
    connectTimeout: Duration.zero,
    receiveTimeout: Duration.zero,
    sendTimeout: Duration.zero,
  );

  Future<ImageAnalysisResponse> analyze({
    required List<ImageAnalysisRequestImage> images,
    required String prompt,
    List<ImageAnalysisChatHistoryMessage> chatHistory = const [],
    CancelToken? cancelToken,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/image-analysis/analyze',
      data: {
        'images': images.map((image) => image.toJson()).toList(),
        'prompt': prompt,
        'chatHistory': chatHistory.map((message) => message.toJson()).toList(),
      },
      options: _aiRequestOptions,
      cancelToken: cancelToken,
    );

    return ImageAnalysisResponse.fromJson(response.data!);
  }

  Future<void> addVocabularyFromAnalysis(
    ImageAnalysisVocabulary vocabulary,
  ) async {
    await _dio.post<Map<String, dynamic>>(
      '/personal-vocabularies/from-analysis',
      data: vocabulary.toJson(),
    );
  }
}
