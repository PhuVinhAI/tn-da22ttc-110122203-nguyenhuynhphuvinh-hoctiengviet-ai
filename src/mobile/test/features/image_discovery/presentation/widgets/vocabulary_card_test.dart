import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/image_discovery/domain/image_analysis_models.dart';
import 'package:linvnix/features/image_discovery/presentation/widgets/vocabulary_card.dart';

void main() {
  testWidgets('renders extracted vocabulary fields and add callback', (
    tester,
  ) async {
    var addCount = 0;
    ImageAnalysisVocabulary? addedVocabulary;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: VocabularyCard(
            vocabulary: const ImageAnalysisVocabulary(
              word: 'cấm đỗ xe',
              translation: 'no parking',
              partOfSpeech: 'phrase',
              exampleSentence: 'Ở đây cấm đỗ xe.',
              exampleTranslation: 'Parking is forbidden here.',
              classifier: 'biển',
            ),
            onAdd: (vocabulary) async {
              addCount += 1;
              addedVocabulary = vocabulary;
            },
          ),
        ),
      ),
    );

    expect(find.text('cấm đỗ xe'), findsOneWidget);
    expect(find.text('no parking'), findsOneWidget);
    expect(find.text('phrase'), findsOneWidget);
    expect(find.text('Thêm'), findsOneWidget);

    await tester.tap(find.text('Thêm'));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(addCount, 1);
    expect(addedVocabulary?.word, 'cấm đỗ xe');
    expect(find.text('Đã thêm'), findsOneWidget);

    await tester.tap(find.text('Đã thêm'));
    await tester.pumpAndSettle();

    expect(addCount, 1);
  });
}
