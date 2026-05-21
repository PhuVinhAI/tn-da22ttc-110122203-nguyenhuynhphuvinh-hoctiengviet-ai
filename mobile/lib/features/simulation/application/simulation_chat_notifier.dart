import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../profile/data/profile_providers.dart';
import '../data/simulation_providers.dart';
import '../data/simulation_repository.dart';
import '../domain/send_message_response.dart';
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

  bool get isLearnerTurn =>
      !sessionEnded && nextTurnCharacterId == chosenCharacterId;
  bool get isNpcTurn =>
      !sessionEnded &&
      nextTurnCharacterId.isNotEmpty &&
      nextTurnCharacterId != chosenCharacterId;

  /// Resolves a display name from prior messages for a character id.
  String speakerNameFor(String characterId) {
    if (characterId.isEmpty) return '';
    final match = messages
        .where(
          (m) =>
              m.speakerCharacterId == characterId && m.speakerName.isNotEmpty,
        )
        .lastOrNull;
    return match?.speakerName ?? '';
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
  }

  Future<void> sendMessage(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty || state.status != SimulationChatStatus.idle) return;
    if (state.sessionEnded) return;

    final profile = ref.read(userProfileProvider).value;
    final learnerMessage = SimulationMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      speakerCharacterId: state.chosenCharacterId,
      speakerName: profile?.fullName ?? 'You',
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
      _applySendResponse(response, learnerMessageIndex: state.messages.length - 1);
    } catch (e) {
      state = state.copyWith(
        status: SimulationChatStatus.idle,
        error: e.toString(),
      );
    }
  }

  void _applySendResponse(
    SendMessageResponse response, {
    required int learnerMessageIndex,
  }) {
    if (state.sessionEnded) return;

    var messages = [...state.messages, ...response.messages];

    if (response.feedback != null && learnerMessageIndex >= 0) {
      final learner = messages[learnerMessageIndex];
      messages = [
        ...messages.sublist(0, learnerMessageIndex),
        SimulationMessage(
          id: learner.id,
          speakerCharacterId: learner.speakerCharacterId,
          speakerName: learner.speakerName,
          isLearner: learner.isLearner,
          content: learner.content,
          feedback: response.feedback,
          orderIndex: learner.orderIndex,
        ),
        ...messages.sublist(learnerMessageIndex + 1),
      ];
    }

    state = state.copyWith(
      status: SimulationChatStatus.receiving,
      messages: messages,
      nextTurnCharacterId: response.nextTurnCharacterId,
    );

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
      status:
          isCompleted ? SimulationChatStatus.completed : SimulationChatStatus.idle,
      sessionEnded: isCompleted,
      scenarioId: session.scenarioId,
      resultId: resultId,
    );
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
