import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/image_discovery/application/image_discovery_notifier.dart';
import 'package:linvnix/features/image_discovery/data/image_analysis_api.dart';
import 'package:linvnix/features/image_discovery/data/image_analysis_providers.dart';
import 'package:linvnix/features/image_discovery/domain/image_analysis_models.dart';
import 'package:linvnix/features/image_discovery/presentation/screens/image_discovery_screen.dart';

final _pngBytes = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8'
  '/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
);

void main() {
  testWidgets('hides quick actions and disables send until an image is added', (
    tester,
  ) async {
    final api = _FakeImageAnalysisApi();
    final container = ProviderContainer(
      overrides: [imageAnalysisApiProvider.overrideWithValue(api)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    expect(find.text('Analyze image'), findsNothing);
    expect(find.text('Find vocabulary'), findsNothing);
    expect(find.text('Translate text'), findsNothing);
    expect(find.text('Explain content'), findsNothing);
    expect(
      find.text('Add at least one photo to send a message'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField), 'Hello');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pumpAndSettle();

    expect(api.capturedPrompt, isNull);
    expect(find.byTooltip('Reset session'), findsNothing);
  });

  testWidgets('reset clears images, chat history, and input', (tester) async {
    final api = _FakeImageAnalysisApi();
    final container = ProviderContainer(
      overrides: [imageAnalysisApiProvider.overrideWithValue(api)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    await container
        .read(imageDiscoveryProvider.notifier)
        .setImage(
          XFile.fromData(_pngBytes, name: 'photo.png', mimeType: 'image/png'),
        );
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'What does this say?');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Reset session'), findsOneWidget);
    expect(find.text('What does this say?'), findsOneWidget);
    expect(find.byKey(const ValueKey('image_discovery_image_grid')), findsOne);

    await tester.tap(find.byTooltip('Reset session'));
    await tester.pumpAndSettle();

    final state = container.read(imageDiscoveryProvider);
    expect(state.images, isEmpty);
    expect(state.messages, isEmpty);
    expect(state.error, isNull);
    expect(find.byTooltip('Reset session'), findsNothing);
    expect(find.byKey(const ValueKey('image_discovery_image_grid')), findsNothing);
    expect(tester.widget<TextField>(find.byType(TextField)).controller?.text, '');
  });

  testWidgets('sends all selected images and prior chat history', (
    tester,
  ) async {
    final api = _FakeImageAnalysisApi();
    final container = ProviderContainer(
      overrides: [imageAnalysisApiProvider.overrideWithValue(api)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    await container
        .read(imageDiscoveryProvider.notifier)
        .addImage(
          XFile.fromData(_pngBytes, name: 'photo.png', mimeType: 'image/png'),
        );
    await container
        .read(imageDiscoveryProvider.notifier)
        .addImage(
          XFile.fromData(_pngBytes, name: 'second.jpg', mimeType: 'image/jpeg'),
        );
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'What does this say?');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pump();
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'What else is visible?');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(api.capturedPrompt, 'What else is visible?');
    expect(api.capturedImages, hasLength(2));
    expect(api.capturedImages.first.mimeType, 'image/png');
    expect(api.capturedImages.first.base64, base64Encode(_pngBytes));
    expect(api.capturedImages.last.mimeType, 'image/jpeg');
    expect(api.capturedChatHistory.map((message) => message.toJson()), [
      {'role': 'user', 'content': 'What does this say?'},
      {'role': 'assistant', 'content': '**cấm đỗ xe** means no parking.'},
    ]);
    expect(find.text('cấm đỗ xe'), findsWidgets);
    expect(find.text('no parking'), findsWidgets);

    await tester.tap(find.text('Thêm').last);
    await tester.pump();
    await tester.pumpAndSettle();

    expect(api.addedVocabulary?.word, 'cấm đỗ xe');
    expect(find.text('Đã thêm'), findsOneWidget);
  });

  testWidgets('gallery upload renders a removable image grid', (tester) async {
    final api = _FakeImageAnalysisApi();
    final picker = _FakeImagePicker([
      XFile.fromData(_pngBytes, name: 'one.png', mimeType: 'image/png'),
      XFile.fromData(_pngBytes, name: 'two.png', mimeType: 'image/png'),
      XFile.fromData(_pngBytes, name: 'three.png', mimeType: 'image/png'),
    ]);
    final container = ProviderContainer(
      overrides: [
        imageAnalysisApiProvider.overrideWithValue(api),
        imagePickerProvider.overrideWithValue(picker),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    await tester.tap(find.text('Upload'));
    await tester.pumpAndSettle();

    expect(picker.capturedLimit, maxImageDiscoveryImages);
    expect(find.byKey(const ValueKey('image_discovery_image_grid')), findsOne);
    expect(find.byTooltip('Remove image'), findsNWidgets(3));

    await tester.tap(find.byTooltip('Remove image').first);
    await tester.pumpAndSettle();

    expect(find.byTooltip('Remove image'), findsNWidgets(2));
  });

  testWidgets('quick action chips send the prompt without filling the input', (
    tester,
  ) async {
    final api = _FakeImageAnalysisApi();
    final container = ProviderContainer(
      overrides: [imageAnalysisApiProvider.overrideWithValue(api)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    await container
        .read(imageDiscoveryProvider.notifier)
        .setImage(
          XFile.fromData(_pngBytes, name: 'photo.png', mimeType: 'image/png'),
        );
    await tester.pump();

    expect(find.text('Analyze image'), findsOneWidget);
    expect(find.text('Find vocabulary'), findsOneWidget);
    expect(find.text('Translate text'), findsOneWidget);
    expect(find.text('Explain content'), findsOneWidget);

    await tester.tap(find.text('Find vocabulary'));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(
      api.capturedPrompt,
      'Find useful Vietnamese vocabulary in these images.',
    );
    expect(
      find.text('Find useful Vietnamese vocabulary in these images.'),
      findsOneWidget,
    );
    expect(tester.widget<TextField>(find.byType(TextField)).controller?.text, '');
  });

  testWidgets('shows an error message when analysis fails', (tester) async {
    final api = _FakeImageAnalysisApi(shouldFail: true);
    final container = ProviderContainer(
      overrides: [imageAnalysisApiProvider.overrideWithValue(api)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const ImageDiscoveryScreen(),
        ),
      ),
    );

    await container
        .read(imageDiscoveryProvider.notifier)
        .setImage(
          XFile.fromData(_pngBytes, name: 'photo.png', mimeType: 'image/png'),
        );
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'Analyze this');
    await tester.tap(find.byIcon(Icons.arrow_upward_rounded));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(
      find.text('Unable to analyze image. Please try again.'),
      findsOneWidget,
    );
  });
}

class _FakeImageAnalysisApi extends ImageAnalysisApi {
  _FakeImageAnalysisApi({this.shouldFail = false}) : super(Dio());

  final bool shouldFail;
  List<ImageAnalysisRequestImage> capturedImages = const [];
  List<ImageAnalysisChatHistoryMessage> capturedChatHistory = const [];
  ImageAnalysisVocabulary? addedVocabulary;
  String? capturedPrompt;

  @override
  Future<ImageAnalysisResponse> analyze({
    CancelToken? cancelToken,
    required List<ImageAnalysisRequestImage> images,
    required String prompt,
    List<ImageAnalysisChatHistoryMessage> chatHistory = const [],
  }) async {
    capturedImages = images;
    capturedPrompt = prompt;
    capturedChatHistory = chatHistory;
    if (shouldFail) {
      throw Exception('analysis failed');
    }
    return const ImageAnalysisResponse(
      text: '**cấm đỗ xe** means no parking.',
      vocabularies: [
        ImageAnalysisVocabulary(
          word: 'cấm đỗ xe',
          translation: 'no parking',
          partOfSpeech: 'phrase',
        ),
      ],
    );
  }

  @override
  Future<void> addVocabularyFromAnalysis(
    ImageAnalysisVocabulary vocabulary,
  ) async {
    addedVocabulary = vocabulary;
  }
}

class _FakeImagePicker extends ImagePicker {
  _FakeImagePicker(this.files);

  final List<XFile> files;
  int? capturedLimit;

  @override
  Future<List<XFile>> pickMultiImage({
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    int? limit,
    bool requestFullMetadata = true,
  }) async {
    capturedLimit = limit;
    return files;
  }

  @override
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
    bool requestFullMetadata = true,
  }) async {
    return files.isEmpty ? null : files.first;
  }
}
