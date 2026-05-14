import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/lessons/domain/exercise_set_models.dart';
import 'package:linvnix/features/lessons/presentation/widgets/custom_practice_bottom_sheet.dart';

Widget _wrapWithTheme(Widget child) {
  return MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(
      body: Builder(
        builder: (context) {
          return SingleChildScrollView(child: child);
        },
      ),
    ),
  );
}

void main() {
  group('CustomPracticeBottomSheet creation form', () {
    testWidgets('renders all config fields and Create button', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            onSubmit: (_) async {},
          ),
        ),
      );

      expect(find.text('Configure custom practice'), findsOneWidget);
      expect(find.text('Number of questions: 10'), findsOneWidget);
      expect(find.byType(Slider), findsOneWidget);
      expect(find.text('Exercise types'), findsOneWidget);
      expect(find.text('Multiple choice'), findsOneWidget);
      expect(find.text('Fill in the blank'), findsOneWidget);
      expect(find.text('Matching'), findsOneWidget);
      expect(find.text('Ordering'), findsOneWidget);
      expect(find.text('Translation'), findsOneWidget);
      expect(find.text('Listening'), findsOneWidget);
      expect(find.text('Focus'), findsOneWidget);
      expect(find.text('Vocabulary'), findsOneWidget);
      expect(find.text('Grammar'), findsOneWidget);
      expect(find.text('Both'), findsOneWidget);
      expect(find.text('Prompt (optional)'), findsOneWidget);
      expect(find.text('Create exercises'), findsOneWidget);
    });

    testWidgets('renders userPrompt textarea', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            onSubmit: (_) async {},
          ),
        ),
      );

      expect(find.text('Describe what you want to focus on...'), findsOneWidget);
      final textFields = tester.widgetList<TextFormField>(
        find.byType(TextFormField),
      );
      expect(textFields.length, 1);
    });

    testWidgets('pre-fills userPrompt when initialUserPrompt provided', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            initialUserPrompt: 'Focus on grammar',
            onSubmit: (_) async {},
          ),
        ),
      );

      expect(find.text('Focus on grammar'), findsOneWidget);
    });

    testWidgets('calls onSubmit with config including userPrompt', (tester) async {
      CustomSetConfig? captured;
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            onSubmit: (config) async { captured = config; },
          ),
        ),
      );

      await tester.enterText(
        find.byType(TextFormField).first,
        'Review vocabulary',
      );
      await tester.pump();

      await tester.tap(find.text('Create exercises'));
      await tester.pump();

      expect(captured, isNotNull);
      expect(captured!.userPrompt, 'Review vocabulary');
      expect(captured!.questionCount, 10);
    });

    testWidgets('slider changes question count display', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            onSubmit: (_) async {},
          ),
        ),
      );

      expect(find.text('Number of questions: 10'), findsOneWidget);

      final slider = tester.widget<Slider>(find.byType(Slider));
      expect(slider.min, 1);
      expect(slider.max, 30);
    });

    testWidgets('exercise type chips are selectable', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.creation(
            onSubmit: (_) async {},
          ),
        ),
      );

      expect(find.text('Multiple choice'), findsOneWidget);
      expect(find.text('Matching'), findsOneWidget);
    });

    testWidgets('close button calls Navigator.pop', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => CustomPracticeBottomSheet.creation(
                      onSubmit: (_) async {},
                    ),
                  );
                },
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();

      expect(find.text('Configure custom practice'), findsOneWidget);

      await tester.tap(find.byTooltip('Close'));
      await tester.pumpAndSettle();

      expect(find.text('Configure custom practice'), findsNothing);
    });
  });

  group('CustomPracticeBottomSheet info view', () {
    SetProgress makeProgress({
      String title = 'Vocabulary Review',
      String? description = 'AI-generated practice focusing on greetings',
      String? userPrompt = 'Focus on greetings',
      int totalExercises = 10,
      int attempted = 5,
      int correct = 4,
      double percentComplete = 50,
      double percentCorrect = 80,
    }) {
      return SetProgress(
        setId: 'set-1',
        title: title,
        description: description,
        userPrompt: userPrompt,
        isCustom: true,
        isAIGenerated: true,
        totalExercises: totalExercises,
        attempted: attempted,
        correct: correct,
        percentComplete: percentComplete,
        percentCorrect: percentCorrect,
      );
    }

    testWidgets('displays AI-generated title and description', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Vocabulary Review'), findsOneWidget);
      expect(find.text('AI-generated practice focusing on greetings'), findsOneWidget);
    });

    testWidgets('displays progress stats', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('50%'), findsOneWidget);
      expect(find.text('80%'), findsOneWidget);
      expect(find.text('5/10'), findsOneWidget);
      expect(find.text('Progress'), findsOneWidget);
      expect(find.text('Accuracy'), findsOneWidget);
      expect(find.text('Completed'), findsOneWidget);
    });

    testWidgets('shows Start practice button when not started', (tester) async {
      final progress = makeProgress(attempted: 0, percentComplete: 0, percentCorrect: 0);
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Start practice'), findsOneWidget);
    });

    testWidgets('shows Continue practice button when in progress', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Continue practice'), findsOneWidget);
    });

    testWidgets('shows Practice again button when completed', (tester) async {
      final progress = makeProgress(
        attempted: 10,
        correct: 9,
        percentComplete: 100,
        percentCorrect: 90,
      );
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Practice again'), findsOneWidget);
    });

    testWidgets('displays all action buttons', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Continue practice'), findsOneWidget);
      expect(find.text('Regenerate exercises'), findsOneWidget);
      expect(find.text('Reset progress'), findsOneWidget);
      expect(find.text('Delete'), findsOneWidget);
    });

    testWidgets('config summary shows question count and user prompt', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('10 questions'), findsOneWidget);
      expect(find.text('Focus on greetings'), findsOneWidget);
    });

    testWidgets('hides description section when description is null', (tester) async {
      final progress = makeProgress(description: null);
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Vocabulary Review'), findsOneWidget);
      expect(find.text('AI-generated practice focusing on greetings'), findsNothing);
    });

    testWidgets('hides description section when description is empty', (tester) async {
      final progress = makeProgress(description: '');
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
          ),
        ),
      );

      expect(find.text('Vocabulary Review'), findsOneWidget);
    });

    testWidgets('shows Cancel button when onCancel provided', (tester) async {
      final progress = makeProgress();
      await tester.pumpWidget(
        _wrapWithTheme(
          CustomPracticeBottomSheet.info(
            progress: progress,
            onPlay: () {},
            onRegenerate: () {},
            onReset: () {},
            onDelete: () {},
            onCancel: () {},
          ),
        ),
      );

      final cancelButtons = find.widgetWithText(GestureDetector, 'Cancel');
      expect(cancelButtons, findsOneWidget);
    });
  });
}
