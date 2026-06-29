import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/image_discovery/data/image_analysis_api.dart';
import 'package:linvnix/features/image_discovery/domain/image_analysis_models.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio dio;
  late ImageAnalysisApi api;

  setUp(() {
    dio = MockDio();
    api = ImageAnalysisApi(dio);
  });

  test('posts images, current prompt, and chat history', () async {
    when(
      () => dio.post<Map<String, dynamic>>(
        '/image-analysis/analyze',
        data: any(named: 'data'),
      ),
    ).thenAnswer(
      (_) async => Response(
        requestOptions: RequestOptions(path: '/image-analysis/analyze'),
        data: {'text': 'Done', 'vocabularies': <dynamic>[]},
      ),
    );

    await api.analyze(
      images: const [
        ImageAnalysisRequestImage(base64: 'one', mimeType: 'image/png'),
        ImageAnalysisRequestImage(base64: 'two', mimeType: 'image/jpeg'),
      ],
      prompt: 'What changed?',
      chatHistory: const [
        ImageAnalysisChatHistoryMessage(
          role: 'user',
          content: 'What does this say?',
        ),
        ImageAnalysisChatHistoryMessage(
          role: 'assistant',
          content: 'It says no parking.',
        ),
      ],
    );

    final captured =
        verify(
              () => dio.post<Map<String, dynamic>>(
                '/image-analysis/analyze',
                data: captureAny(named: 'data'),
              ),
            ).captured.single
            as Map<String, dynamic>;

    expect(captured['images'], [
      {'base64': 'one', 'mimeType': 'image/png'},
      {'base64': 'two', 'mimeType': 'image/jpeg'},
    ]);
    expect(captured['prompt'], 'What changed?');
    expect(captured['chatHistory'], [
      {'role': 'user', 'content': 'What does this say?'},
      {'role': 'assistant', 'content': 'It says no parking.'},
    ]);
  });

  test('posts AI vocabulary to the from-analysis endpoint', () async {
    when(
      () => dio.post<Map<String, dynamic>>(
        '/personal-vocabularies/from-analysis',
        data: any(named: 'data'),
      ),
    ).thenAnswer(
      (_) async => Response(
        requestOptions: RequestOptions(
          path: '/personal-vocabularies/from-analysis',
        ),
        data: {'id': 'pv-1'},
      ),
    );

    await api.addVocabularyFromAnalysis(
      const ImageAnalysisVocabulary(
        word: 'cấm đỗ xe',
        translation: 'no parking',
        partOfSpeech: 'phrase',
        exampleSentence: 'Ở đây cấm đỗ xe.',
        exampleTranslation: 'Parking is forbidden here.',
        classifier: 'biển',
      ),
    );

    final captured =
        verify(
              () => dio.post<Map<String, dynamic>>(
                '/personal-vocabularies/from-analysis',
                data: captureAny(named: 'data'),
              ),
            ).captured.single
            as Map<String, dynamic>;

    expect(captured, {
      'word': 'cấm đỗ xe',
      'translation': 'no parking',
      'partOfSpeech': 'phrase',
      'exampleSentence': 'Ở đây cấm đỗ xe.',
      'exampleTranslation': 'Parking is forbidden here.',
      'classifier': 'biển',
    });
  });
}
