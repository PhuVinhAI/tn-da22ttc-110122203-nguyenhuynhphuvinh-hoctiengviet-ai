import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/application/assistant_state_machine.dart';
import 'package:linvnix/features/assistant/domain/assistant_state.dart';

void main() {
  late ProviderContainer container;
  late AssistantStateMachine sm;

  setUp(() {
    container = ProviderContainer();
    sm = container.read(assistantStateMachineProvider.notifier);
  });

  tearDown(() {
    container.dispose();
  });

  group('initial state', () {
    test('starts collapsed', () {
      expect(
        container.read(assistantStateMachineProvider),
        isA<AssistantCollapsed>(),
      );
    });
  });

  group('happy-path trigger sequence (PRD §"Mobile UI state machine")', () {
    test(
      'open → compose → send → loading → tool_start → text_chunk → '
      'done → soạn-tiếp → compose',
      () {
        sm.openBar();
        expect(
          container.read(assistantStateMachineProvider),
          isA<AssistantMidCompose>(),
        );

        sm.send('How am I doing?');
        final loading1 = container.read(assistantStateMachineProvider)
            as AssistantMidLoading;
        expect(loading1.lastInput, 'How am I doing?');
        expect(loading1.statusText, AssistantMidLoading.defaultStatusText);

        sm.onToolStart(
          displayName: 'Đang tóm tắt thông tin của bạn...',
        );
        final loading2 = container.read(assistantStateMachineProvider)
            as AssistantMidLoading;
        expect(loading2.statusText, 'Đang tóm tắt thông tin của bạn...');

        sm.onTextChunk('Bạn đang ');
        final reading1 = container.read(assistantStateMachineProvider)
            as AssistantMidReading;
        expect(reading1.partial, 'Bạn đang ');
        expect(reading1.streaming, isTrue);
        expect(reading1.interrupted, isFalse);
        expect(reading1.isDone, isFalse);

        sm.onTextChunk('học rất tốt!');
        final reading2 = container.read(assistantStateMachineProvider)
            as AssistantMidReading;
        expect(reading2.partial, 'Bạn đang học rất tốt!');
        expect(reading2.streaming, isTrue);

        sm.onDone(messageId: 'msg-42', interrupted: false);
        final reading3 = container.read(assistantStateMachineProvider)
            as AssistantMidReading;
        expect(reading3.streaming, isFalse);
        expect(reading3.isDone, isTrue);
        expect(reading3.interrupted, isFalse);
        expect(reading3.messageId, 'msg-42');
        expect(reading3.partial, 'Bạn đang học rất tốt!');

        sm.composeAgain();
        expect(
          container.read(assistantStateMachineProvider),
          isA<AssistantMidCompose>(),
        );
      },
    );

    test('stop tapped during MidLoading transitions to interrupted done', () {
      sm.openBar();
      sm.send('hi');
      sm.stop();

      final s = container.read(assistantStateMachineProvider)
          as AssistantMidReading;
      expect(s.isDone, isTrue);
      expect(s.interrupted, isTrue);
      expect(s.partial, isEmpty);
    });

    test(
      'stop tapped mid-stream preserves partial text and marks interrupted',
      () {
        sm.openBar();
        sm.send('hi');
        sm.onTextChunk('partial answ');
        sm.stop();

        final s = container.read(assistantStateMachineProvider)
            as AssistantMidReading;
        expect(s.isDone, isTrue);
        expect(s.interrupted, isTrue);
        expect(s.partial, 'partial answ');
      },
    );

    test('pre-token error transitions to MidError with lastInput preserved', () {
      sm.openBar();
      sm.send('what is xin chào');
      sm.onError(message: 'AI_SERVICE_UNAVAILABLE');

      final s = container.read(assistantStateMachineProvider)
          as AssistantMidError;
      expect(s.message, 'AI_SERVICE_UNAVAILABLE');
      expect(s.lastInput, 'what is xin chào');
    });

    test(
      'mid-stream error preserves partial text and ends the stream as '
      'interrupted',
      () {
        sm.openBar();
        sm.send('hi');
        sm.onTextChunk('got some answer ');
        sm.onError(message: 'AI_RATE_LIMIT_EXCEEDED');

        final s = container.read(assistantStateMachineProvider)
            as AssistantMidReading;
        expect(s.partial, 'got some answer ');
        expect(s.isDone, isTrue);
        expect(s.interrupted, isTrue);
      },
    );

    test('send() is a valid transition from MidError for retry semantics', () {
      sm.openBar();
      sm.send('retry me');
      sm.onError(message: 'AI_SERVICE_UNAVAILABLE');
      sm.send('retry me');

      final s = container.read(assistantStateMachineProvider)
          as AssistantMidLoading;
      expect(s.lastInput, 'retry me');
    });

    test('reset() returns to MidCompose from any non-Collapsed state', () {
      sm.openBar();
      sm.send('hi');
      sm.onTextChunk('partial');
      sm.reset();

      expect(
        container.read(assistantStateMachineProvider),
        isA<AssistantMidCompose>(),
      );
    });

    test('collapse() from MidReading returns to Collapsed', () {
      sm.openBar();
      sm.send('hi');
      sm.onTextChunk('partial');
      sm.onDone(messageId: 'm', interrupted: false);
      sm.collapse();

      expect(
        container.read(assistantStateMachineProvider),
        isA<AssistantCollapsed>(),
      );
    });

    test('done received from MidLoading (no text emitted) still transitions', () {
      sm.openBar();
      sm.send('hi');
      sm.onDone(messageId: 'm-empty', interrupted: false);

      final s = container.read(assistantStateMachineProvider)
          as AssistantMidReading;
      expect(s.isDone, isTrue);
      expect(s.partial, isEmpty);
      expect(s.messageId, 'm-empty');
    });
  });

  group('invalid transitions throw StateError', () {
    test('openBar from non-Collapsed throws', () {
      sm.openBar();
      expect(() => sm.openBar(), throwsStateError);
    });

    test('send from Collapsed throws', () {
      expect(() => sm.send('hi'), throwsStateError);
    });

    test('send from MidLoading throws', () {
      sm.openBar();
      sm.send('hi');
      expect(() => sm.send('again'), throwsStateError);
    });

    test('send from MidReading (streaming) throws', () {
      sm.openBar();
      sm.send('hi');
      sm.onTextChunk('partial');
      expect(() => sm.send('again'), throwsStateError);
    });

    test('onToolStart from MidCompose throws', () {
      sm.openBar();
      expect(
        () => sm.onToolStart(displayName: 'x'),
        throwsStateError,
      );
    });

    test('onTextChunk from MidCompose throws', () {
      sm.openBar();
      expect(() => sm.onTextChunk('x'), throwsStateError);
    });

    test('onTextChunk after done throws', () {
      sm.openBar();
      sm.send('hi');
      sm.onDone(messageId: 'm', interrupted: false);
      expect(() => sm.onTextChunk('late'), throwsStateError);
    });

    test('onDone from Collapsed throws', () {
      expect(
        () => sm.onDone(messageId: 'm', interrupted: false),
        throwsStateError,
      );
    });

    test('onDone from MidCompose throws', () {
      sm.openBar();
      expect(
        () => sm.onDone(messageId: 'm', interrupted: false),
        throwsStateError,
      );
    });

    test('stop from MidCompose throws', () {
      sm.openBar();
      expect(() => sm.stop(), throwsStateError);
    });

    test('stop from MidReading(done) throws', () {
      sm.openBar();
      sm.send('hi');
      sm.onDone(messageId: 'm', interrupted: false);
      expect(() => sm.stop(), throwsStateError);
    });

    test('composeAgain from MidLoading throws', () {
      sm.openBar();
      sm.send('hi');
      expect(() => sm.composeAgain(), throwsStateError);
    });

    test('composeAgain from MidReading(streaming) throws', () {
      sm.openBar();
      sm.send('hi');
      sm.onTextChunk('partial');
      expect(() => sm.composeAgain(), throwsStateError);
    });

    test('reset from Collapsed throws', () {
      expect(() => sm.reset(), throwsStateError);
    });

    test('collapse from Collapsed throws', () {
      expect(() => sm.collapse(), throwsStateError);
    });
  });
}
