import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/conversation_model.dart';

void main() {
  group('ConversationMessage visibility', () {
    test('hides empty assistant messages from tool-call history', () {
      const message = ConversationMessage(
        id: 'm-empty-tool-call',
        role: 'assistant',
        content: '',
      );

      expect(message.isVisibleInConversationHistory, isFalse);
    });

    test('keeps assistant messages with content visible', () {
      const message = ConversationMessage(
        id: 'm-answer',
        role: 'assistant',
        content: 'Final answer.',
      );

      expect(message.isVisibleInConversationHistory, isTrue);
    });

    test('keeps interrupted empty assistant messages visible', () {
      const message = ConversationMessage(
        id: 'm-stopped',
        role: 'assistant',
        content: '',
        interrupted: true,
      );

      expect(message.isVisibleInConversationHistory, isTrue);
    });

    test('hides internal tool messages', () {
      const message = ConversationMessage(
        id: 'm-tool',
        role: 'tool',
        content: '',
      );

      expect(message.isVisibleInConversationHistory, isFalse);
    });
  });
}
