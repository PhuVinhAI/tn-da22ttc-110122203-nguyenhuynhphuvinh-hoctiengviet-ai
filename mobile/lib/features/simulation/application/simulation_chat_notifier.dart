import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/simulation_providers.dart';
import '../data/simulation_repository.dart';
import '../domain/simulation_message.dart';
import '../domain/simulation_session.dart';

enum SimulationChatStatus { idle, sending, receiving, completed }

class SimulationChatState {
  const SimulationChatState({
    required this.sessionId,
    required this.chosenCharacterId,
    this.messages = const [],
    this.status = SimulationChatStatus.idle,
    this.nextTurnCharacterId = '',
    this.sessionEnded = false,
    this.endReason,
    this.error,
    this.scenarioId = '',
    this.resultId,
  });

  final String sessionId;
  final String chosenCharacterId;
  final List<SimulationMessage> messages;
  final SimulationChatStatus status;
  final String nextTurnCharacterId;
  final bool sessionEnded;
  final String? endReason;
  final String? error;
  final String scenarioId;
  final String? resultId;

  bool get isLearnerTurn => !sessionEnded && nextTurnCharacterId == chosenCharacterId;
  bool get isNpcTurn => !sessionEnded && nextTurnCharacterId.isNotEmpty && nextTurnCharacterId != chosenCharacterId;

  String get npcSpeakerName {
    final npcMsg = messages.where((m) => !m.isLearner && m.speakerName.isNotEmpty).lastOrNull;
    return npcMsg?.speakerName ?? '';
  }

  SimulationChatState copyWith({
    List<SimulationMessage>? messages,
    SimulationChatStatus? status,
    String? nextTurnCharacterId,
    bool? sessionEnded,
    String? endReason,
    String? error,
    String? scenarioId,
    String? resultId,
  }) {
    return SimulationChatState(
      sessionId: sessionId,
      chosenCharacterId: chosenCharacterId,
      messages: messages ?? this.messages,
      status: status ?? this.status,
      nextTurnCharacterId: nextTurnCharacterId ?? this.nextTurnCharacterId,
      sessionEnded: sessionEnded ?? this.sessionEnded,
      endReason: endReason ?? this.endReason,
      error: error,
      scenarioId: scenarioId ?? this.scenarioId,
      resultId: resultId ?? this.resultId,
    );
  }
}

class SimulationChatNotifier extends Notifier<SimulationChatState> {
  @override
  SimulationChatState build() {
    return const SimulationChatState(
      sessionId: '',
      chosenCharacterId: '',
    );
  }

  void initSession({
    required String sessionId,
    required String chosenCharacterId,
    required List<SimulationMessage> initialMessages,
    required String nextTurnCharacterId,
    String scenarioId = '',
    Map<String, dynamic>? result,
  }) {
    String? resultId;
    if (result != null && result['id'] != null) {
      resultId = result['id'] as String;
    }

    state = SimulationChatState(
      sessionId: sessionId,
      chosenCharacterId: chosenCharacterId,
      messages: initialMessages,
      nextTurnCharacterId: nextTurnCharacterId,
      status: SimulationChatStatus.idle,
      scenarioId: scenarioId,
      resultId: resultId,
    );

    if (state.isNpcTurn) {
      _autoTriggerNpcTurn();
    }
  }

  Future<void> sendMessage(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty || state.status != SimulationChatStatus.idle) return;
    if (state.sessionEnded) return;

    final learnerMessage = SimulationMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      speakerCharacterId: state.chosenCharacterId,
      speakerName: '',
      isLearner: true,
      content: trimmed,
      orderIndex: state.messages.length,
    );

    state = state.copyWith(
      messages: [...state.messages, learnerMessage],
      status: SimulationChatStatus.sending,
      error: null,
    );

    try {
      final repo = ref.read(simulationRepositoryProvider);
      final response = await repo.sendMessage(state.sessionId, trimmed);

      if (!state.sessionEnded) {
        state = state.copyWith(
          status: SimulationChatStatus.receiving,
          nextTurnCharacterId: response.nextTurnCharacterId,
        );

        final allMessages = [...state.messages, ...response.messages];
        state = state.copyWith(messages: allMessages);

        if (response.sessionEnded) {
          String? resultId;
          if (response.result != null && response.result!['id'] != null) {
            resultId = response.result!['id'] as String;
          }
          state = state.copyWith(
            status: SimulationChatStatus.completed,
            sessionEnded: true,
            endReason: response.endReason,
            resultId: resultId,
          );
        } else {
          state = state.copyWith(status: SimulationChatStatus.idle);

          if (state.isNpcTurn) {
            _autoTriggerNpcTurn();
          }
        }
      }
    } catch (e) {
      state = state.copyWith(
        status: SimulationChatStatus.idle,
        error: e.toString(),
      );
    }
  }

  Future<void> _autoTriggerNpcTurn() async {
    if (state.status != SimulationChatStatus.idle || state.sessionEnded) return;

    state = state.copyWith(status: SimulationChatStatus.sending);

    try {
      final repo = ref.read(simulationRepositoryProvider);
      final response = await repo.sendMessage(state.sessionId, '');

      state = state.copyWith(
        status: SimulationChatStatus.receiving,
        nextTurnCharacterId: response.nextTurnCharacterId,
      );

      final allMessages = [...state.messages, ...response.messages];
      state = state.copyWith(messages: allMessages);

      if (response.sessionEnded) {
        String? resultId;
        if (response.result != null && response.result!['id'] != null) {
          resultId = response.result!['id'] as String;
        }
        state = state.copyWith(
          status: SimulationChatStatus.completed,
          sessionEnded: true,
          endReason: response.endReason,
          resultId: resultId,
        );
      } else {
        state = state.copyWith(status: SimulationChatStatus.idle);

        if (state.isNpcTurn) {
          _autoTriggerNpcTurn();
        }
      }
    } catch (e) {
      state = state.copyWith(
        status: SimulationChatStatus.idle,
        error: e.toString(),
      );
    }
  }

  Future<void> cancelSession() async {
    if (state.sessionId.isEmpty) return;

    try {
      final repo = ref.read(simulationRepositoryProvider);
      await repo.cancelSession(state.sessionId);
    } catch (_) {}

    state = const SimulationChatState(
      sessionId: '',
      chosenCharacterId: '',
    );
  }

  void loadExistingSession({
    required SimulationSession session,
    required List<SimulationMessage> messages,
    Map<String, dynamic>? result,
  }) {
    final isCompleted = session.status == 'COMPLETED';
    String? resultId;
    if (result != null && result['id'] != null) {
      resultId = result['id'] as String;
    }

    state = SimulationChatState(
      sessionId: session.id,
      chosenCharacterId: session.chosenCharacterId,
      messages: messages,
      nextTurnCharacterId: session.nextTurnCharacterId,
      status: isCompleted ? SimulationChatStatus.completed : SimulationChatStatus.idle,
      sessionEnded: isCompleted,
      scenarioId: session.scenarioId,
      resultId: resultId,
    );

    if (!isCompleted && state.isNpcTurn) {
      _autoTriggerNpcTurn();
    }
  }
}

final simulationChatProvider =
    NotifierProvider<SimulationChatNotifier, SimulationChatState>(
  SimulationChatNotifier.new,
);

final simulationSessionProvider =
    FutureProvider.family<SessionWithMessages, String>((ref, sessionId) async {
  final repo = ref.read(simulationRepositoryProvider);
  return repo.getSession(sessionId);
});
