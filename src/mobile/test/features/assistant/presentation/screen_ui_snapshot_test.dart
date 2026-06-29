import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/presentation/screen_ui_snapshot.dart';

void main() {
  testWidgets('captures text and structure from the current Flutter subtree', (
    tester,
  ) async {
    final controller = TextEditingController(text: 'typed answer');
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(title: const Text('Lesson title')),
          body: Column(
            children: [
              const Text('Current question'),
              TextField(
                controller: controller,
                decoration: const InputDecoration(labelText: 'Answer'),
              ),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Check answer'),
              ),
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    final captured = const ScreenUiSnapshotCollector().collect(
      tester.element(find.byType(Scaffold)),
    );
    final allText = captured.texts.join('\n');
    final structure = captured.structure.toString();

    expect(captured.texts, contains('Lesson title'));
    expect(captured.texts, contains('Current question'));
    expect(captured.texts, contains('Check answer'));
    expect(allText, contains('Answer'));
    expect(allText, contains('typed answer'));
    expect(structure, contains('Scaffold'));
    expect(structure, contains('button'));
    expect(structure, contains('input'));
  });
}
