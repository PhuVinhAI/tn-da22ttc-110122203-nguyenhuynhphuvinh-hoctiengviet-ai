import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/features/simulation/application/simulation_chat_notifier.dart';
import 'package:linvnix/features/simulation/data/simulation_repository.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/send_message_response.dart';
import 'package:linvnix/features/simulation/domain/simulation_message.dart';
import 'package:linvnix/features/simulation/domain/simulation_session.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

class MockSimulationRepository extends Mock implements SimulationRepository {}

void main() {
  late MockSimulationRepository mockRepo;
  late ProviderContainer container;

  setUp(() {
    mockRepo = MockSimulationRepository();
    container = ProviderContainer(
      overrides: [
        simulationRepositoryProvider.overrideWithValue(mockRepo),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  group('SimulationChatNotifier', () {
    SimulationChatNotifier getNotifier() {
      return container.read(simulationChatProvider.notifier);
    }

    SimulationChatState getState() {
      return container.read(simulationChatProvider);
    }

    test('initial state has empty sessionId and idle status', () {
      final state = getState();
      expect(state.sessionId, '');
      expect(state.status, SimulationChatStatus.idle);
      expect(state.messages, isEmpty);
    });

    test('initSession sets session data and messages', () {
      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        chosenCharacterName: 'Khách hàng',
        initialMessages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerCharacterId: 'npc-1',
            speakerName: 'Lan',
            isLearner: false,
            content: 'Chào bạn!',
            orderIndex: 0,
          ),
        ],
        nextTurnCharacterId: 'char-learner',
      );

      final state = getState();
      expect(state.sessionId, 'session-1');
      expect(state.chosenCharacterId, 'char-learner');
      expect(state.chosenCharacterName, 'Khách hàng');
      expect(state.messages, hasLength(1));
      expect(state.nextTurnCharacterId, 'char-learner');
      expect(state.isLearnerTurn, true);
      expect(state.isNpcTurn, false);
    });

    test('sendMessage uses chosen character name instead of user profile', () async {
      when(() => mockRepo.sendMessage('session-1', 'Xin chào'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [
            SimulationMessage(
              id: 'msg-2',
              speakerCharacterId: 'npc-1',
              speakerName: 'Lan',
              isLearner: false,
              content: 'Chào bạn!',
              orderIndex: 1,
            ),
          ],
          nextTurnCharacterId: 'char-learner',
          sessionEnded: false,
        ),
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        chosenCharacterName: 'Khách hàng',
        initialMessages: const [],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('Xin chào');

      final state = getState();
      expect(state.messages[0].speakerName, 'Khách hàng');
      expect(state.messages[0].isLearner, true);
    });

    test('sendMessage accumulates learner message then NPC response', () async {
      when(() => mockRepo.sendMessage('session-1', 'Xin chào'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [
            SimulationMessage(
              id: 'msg-2',
              speakerCharacterId: 'npc-1',
              speakerName: 'Lan',
              isLearner: false,
              content: 'Chào bạn!',
              orderIndex: 1,
            ),
          ],
          nextTurnCharacterId: 'char-learner',
          sessionEnded: false,
        ),
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerCharacterId: 'npc-1',
            speakerName: 'Lan',
            isLearner: false,
            content: 'Xin chào!',
            orderIndex: 0,
          ),
        ],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('Xin chào');

      final state = getState();
      expect(state.messages, hasLength(3));
      expect(state.messages[1].isLearner, true);
      expect(state.messages[1].content, 'Xin chào');
      expect(state.messages[2].isLearner, false);
      expect(state.messages[2].content, 'Chào bạn!');
      expect(state.status, SimulationChatStatus.idle);
      expect(state.isLearnerTurn, true);
    });

    test('sendMessage transitions to completed when sessionEnded', () async {
      when(() => mockRepo.sendMessage('session-1', 'Tạm biệt'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [
            SimulationMessage(
              id: 'msg-3',
              speakerCharacterId: 'npc-1',
              speakerName: 'Lan',
              isLearner: false,
              content: 'Tạm biệt!',
              orderIndex: 2,
            ),
          ],
          nextTurnCharacterId: '',
          sessionEnded: true,
          endReason: 'COMPLETED',
        ),
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('Tạm biệt');

      final state = getState();
      expect(state.sessionEnded, true);
      expect(state.endReason, 'COMPLETED');
      expect(state.status, SimulationChatStatus.completed);
    });

    test('sendMessage with empty content does nothing', () async {
      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('   ');

      final state = getState();
      expect(state.messages, isEmpty);
      expect(state.status, SimulationChatStatus.idle);
    });

    test('sendMessage when session is ended does nothing', () async {
      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
      );

      when(() => mockRepo.sendMessage('session-1', 'bye'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [],
          nextTurnCharacterId: '',
          sessionEnded: true,
          endReason: 'COMPLETED',
        ),
      );

      await notifier.sendMessage('bye');
      await notifier.sendMessage('another message');

      final state = getState();
      expect(state.sessionEnded, true);
    });

    test('loadExistingSession with COMPLETED status sets completed state', () {
      final notifier = getNotifier();
      notifier.loadExistingSession(
        session: const SimulationSession(
          id: 'session-1',
          scenarioId: 'scenario-1',
          chosenCharacterId: 'char-learner',
          status: 'COMPLETED',
          nextTurnCharacterId: '',
        ),
        messages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerCharacterId: 'npc-1',
            speakerName: 'Lan',
            isLearner: false,
            content: 'Hello',
            orderIndex: 0,
          ),
        ],
      );

      final state = getState();
      expect(state.sessionEnded, true);
      expect(state.status, SimulationChatStatus.completed);
      expect(state.messages, hasLength(1));
    });

    test('speakerNameFor resolves name by character id', () {
      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerCharacterId: 'npc-1',
            speakerName: 'Lan',
            isLearner: false,
            content: 'Hi',
            orderIndex: 0,
          ),
          const SimulationMessage(
            id: 'msg-2',
            speakerCharacterId: 'npc-2',
            speakerName: 'Minh',
            isLearner: false,
            content: 'Hello',
            orderIndex: 1,
          ),
        ],
        nextTurnCharacterId: 'char-learner',
      );

      final state = getState();
      expect(state.speakerNameFor('npc-1'), 'Lan');
      expect(state.speakerNameFor('npc-2'), 'Minh');
      expect(state.speakerNameFor('unknown'), '');
    });

    test('multiple NPC messages in response all accumulate in order', () async {
      when(() => mockRepo.sendMessage('session-1', 'Xin chào'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [
            SimulationMessage(
              id: 'msg-2',
              speakerCharacterId: 'npc-1',
              speakerName: 'Lan',
              isLearner: false,
              content: 'Chào!',
              orderIndex: 1,
            ),
            SimulationMessage(
              id: 'msg-3',
              speakerCharacterId: 'npc-2',
              speakerName: 'Minh',
              isLearner: false,
              content: 'Xin chào!',
              orderIndex: 2,
            ),
          ],
          nextTurnCharacterId: 'char-learner',
          sessionEnded: false,
        ),
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerName: '',
            isLearner: false,
            content: 'Scene begins',
            orderIndex: 0,
          ),
        ],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('Xin chào');

      final state = getState();
      expect(state.messages, hasLength(4));
      expect(state.messages[1].isLearner, true);
      expect(state.messages[2].speakerName, 'Lan');
      expect(state.messages[3].speakerName, 'Minh');
    });

    test('initSession sets scenarioId and resultId from result map', () {
      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
        scenarioId: 'scenario-1',
        result: {'id': 'result-1', 'totalScore': 85},
      );

      final state = getState();
      expect(state.scenarioId, 'scenario-1');
      expect(state.resultId, 'result-1');
    });

    test('sendMessage when sessionEnded sets resultId from result map', () async {
      when(() => mockRepo.sendMessage('session-1', 'bye'))
          .thenAnswer(
        (_) async => const SendMessageResponse(
          messages: [],
          nextTurnCharacterId: '',
          sessionEnded: true,
          endReason: 'COMPLETED',
          result: {'id': 'result-99', 'totalScore': 90},
        ),
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
        scenarioId: 'scenario-1',
      );

      await notifier.sendMessage('bye');

      final state = getState();
      expect(state.sessionEnded, true);
      expect(state.resultId, 'result-99');
    });

    test('cancelSession calls repo.cancelSession and resets state', () async {
      when(() => mockRepo.cancelSession('session-1')).thenAnswer(
        (_) async {},
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.cancelSession();

      verify(() => mockRepo.cancelSession('session-1')).called(1);
      final state = getState();
      expect(state.sessionId, '');
      expect(state.messages, isEmpty);
    });

    test('loadExistingSession sets scenarioId and resultId', () {
      final notifier = getNotifier();
      notifier.loadExistingSession(
        session: const SimulationSession(
          id: 'session-1',
          scenarioId: 'scenario-1',
          chosenCharacterId: 'char-learner',
          status: 'COMPLETED',
          nextTurnCharacterId: '',
        ),
        messages: [
          const SimulationMessage(
            id: 'msg-1',
            speakerCharacterId: 'npc-1',
            speakerName: 'Lan',
            isLearner: false,
            content: 'Hello',
            orderIndex: 0,
          ),
        ],
        result: {'id': 'result-1'},
      );

      final state = getState();
      expect(state.scenarioId, 'scenario-1');
      expect(state.resultId, 'result-1');
    });

    test('error during send sets error and returns to idle', () async {
      when(() => mockRepo.sendMessage('session-1', 'test'))
          .thenThrow(Exception('Network error'));
      when(() => mockRepo.revertPendingLearnerMessage('session-1'))
          .thenAnswer((_) async {});

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: [],
        nextTurnCharacterId: 'char-learner',
      );

      await notifier.sendMessage('test');

      final state = getState();
      expect(state.status, SimulationChatStatus.idle);
      expect(state.error, isNotNull);
      expect(state.messages, isEmpty);
      expect(state.failedOutboundContent, 'test');
      verify(() => mockRepo.revertPendingLearnerMessage('session-1')).called(1);
    });

    test('discardPendingOutboundMessage removes optimistic learner message', () async {
      when(() => mockRepo.revertPendingLearnerMessage('session-1'))
          .thenAnswer((_) async {});
      when(() => mockRepo.sendMessage('session-1', 'Xin chào')).thenAnswer(
        (_) async {
          await Future<void>.delayed(const Duration(milliseconds: 50));
          return const SendMessageResponse(
            messages: [],
            nextTurnCharacterId: 'char-learner',
            sessionEnded: false,
          );
        },
      );

      final notifier = getNotifier();
      notifier.initSession(
        sessionId: 'session-1',
        chosenCharacterId: 'char-learner',
        initialMessages: const [],
        nextTurnCharacterId: 'char-learner',
      );

      final sendFuture = notifier.sendMessage('Xin chào');
      expect(getState().messages, hasLength(1));
      expect(getState().status, SimulationChatStatus.sending);

      await notifier.discardPendingOutboundMessage();

      final state = getState();
      expect(state.messages, isEmpty);
      expect(state.status, SimulationChatStatus.idle);
      verify(() => mockRepo.revertPendingLearnerMessage('session-1')).called(1);

      await sendFuture;
      expect(getState().messages, isEmpty);
    });
  });
}
