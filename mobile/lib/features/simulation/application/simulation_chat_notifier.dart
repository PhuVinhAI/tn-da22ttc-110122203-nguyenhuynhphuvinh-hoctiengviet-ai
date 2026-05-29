import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/simulation_providers.dart';
import '../data/simulation_repository.dart';
import '../domain/send_message_response.dart';
import '../domain/simulation_message.dart';
import '../domain/simulation_session.dart';

enum SimulationChatStatus { idle, sending, receiving, completed }

const defaultLearnerName = 'learner:you';

class SimulationChatState {
  const SimulationChatState({
    required this.sessionId,
    required this.chosenCharacterId,
    this.chosenCharacterName = '',
    this.messages = const [],
    this.status = SimulationChatStatus.idle,
    this.nextTurnCharacterId = '',
    this.sessionEnded = false,
    this.endReason,
    this.error,
    this.failedOutboundContent,
    this.scenarioId = '',
    this.resultId,
  });

  final String sessionId;
  final String chosenCharacterId;
  final String chosenCharacterName;
  final List<SimulationMessage> messages;
  final SimulationChatStatus status;
  final String nextTurnCharacterId;
  final bool sessionEnded;
  final String? endReason;
  final String? error;
  final String? failedOutboundContent;
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
    String? failedOutboundContent,
    String? chosenCharacterName,
    String? scenarioId,
    String? resultId,
  }) {
    return SimulationChatState(
      sessionId: sessionId,
      chosenCharacterId: chosenCharacterId,
      chosenCharacterName: chosenCharacterName ?? this.chosenCharacterName,
      messages: messages ?? this.messages,
      status: status ?? this.status,
      nextTurnCharacterId: nextTurnCharacterId ?? this.nextTurnCharacterId,
      sessionEnded: sessionEnded ?? this.sessionEnded,
      endReason: endReason ?? this.endReason,
      error: error,
      failedOutboundContent:
          failedOutboundContent ?? this.failedOutboundContent,
      scenarioId: scenarioId ?? this.scenarioId,
      resultId: resultId ?? this.resultId,
    );
  }
}

class SimulationChatNotifier extends Notifier<SimulationChatState> {
  String? _outboundMessageId;
  CancelToken? _cancelToken;

  bool get isAwaitingAiResponse =>
      _outboundMessageId != null ||
      state.status == SimulationChatStatus.sending;

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
    String chosenCharacterName = '',
    String scenarioId = '',
    Map<String, dynamic>? result,
  }) {
    String? resultId;
    if (result != null && result['id'] != null) {
      resultId = result['id'] as String;
    }

    final resolvedCharacterName = chosenCharacterName.isNotEmpty
        ? chosenCharacterName
        : _characterNameFromMessages(chosenCharacterId, initialMessages);

    _outboundMessageId = null;
    state = SimulationChatState(
      sessionId: sessionId,
      chosenCharacterId: chosenCharacterId,
      chosenCharacterName: resolvedCharacterName,
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

    final learnerMessage = SimulationMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      speakerCharacterId: state.chosenCharacterId,
      speakerName: _learnerDisplayName(),
      isLearner: true,
      content: trimmed,
      orderIndex: state.messages.length,
    );

    _outboundMessageId = learnerMessage.id;
    final cancelToken = CancelToken();
    _cancelToken = cancelToken;

    state = state.copyWith(
      messages: [...state.messages, learnerMessage],
      status: SimulationChatStatus.sending,
      error: null,
      failedOutboundContent: null,
    );

    try {
      final repo = ref.read(simulationRepositoryProvider);
      final response = await repo.sendMessage(
        state.sessionId,
        trimmed,
        cancelToken: cancelToken,
      );
      if (_outboundMessageId != learnerMessage.id) return;

      _outboundMessageId = null;
      _cancelToken = null;
      _applySendResponse(response, learnerMessageIndex: state.messages.length - 1);
    } catch (e) {
      if (e is DioException && e.type == DioExceptionType.cancel) {
        // Connection closed → backend aborted AI → only learner message may
        // have been saved. Clean it up best-effort.
        await _revertPendingLearnerOnServer();
        return;
      }

      if (_outboundMessageId != learnerMessage.id) return;
      _outboundMessageId = null;
      _cancelToken = null;
      await _revertPendingLearnerOnServer();
      state = state.copyWith(
        messages: _messagesWithoutId(state.messages, learnerMessage.id),
        status: SimulationChatStatus.idle,
        error: e.toString(),
        failedOutboundContent: trimmed,
      );
    }
  }

  /// Drops the in-flight learner turn (UI + DB) when send/AI has not finished.
  Future<void> discardPendingOutboundMessage() async {
    if (state.sessionId.isEmpty || !isAwaitingAiResponse) return;

    final outboundId = _outboundMessageId;
    final pendingContent = outboundId != null
        ? state.messages.where((m) => m.id == outboundId).firstOrNull?.content
        : null;

    _outboundMessageId = null;
    _cancelToken?.cancel('user stopped');
    _cancelToken = null;

    // Call server cleanup immediately — don't rely on TCP close event
    // since Dio cancel doesn't guarantee the connection is closed server-side.
    unawaited(_revertPendingLearnerOnServer());

    final messages = outboundId != null
        ? _messagesWithoutId(state.messages, outboundId)
        : state.messages;

    state = state.copyWith(
      messages: messages,
      status: SimulationChatStatus.idle,
      error: null,
      failedOutboundContent: pendingContent,
    );
  }

  Future<void> _revertPendingLearnerOnServer() async {
    if (state.sessionId.isEmpty) return;
    try {
      final repo = ref.read(simulationRepositoryProvider);
      await repo.revertPendingLearnerMessage(state.sessionId);
    } catch (_) {}
  }

  List<SimulationMessage> _messagesWithoutId(
    List<SimulationMessage> messages,
    String messageId,
  ) {
    return messages.where((m) => m.id != messageId).toList();
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
      notifySimulationResultsChanged(ref, scenarioId: state.scenarioId);
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

    _outboundMessageId = null;
    state = const SimulationChatState(
      sessionId: '',
      chosenCharacterId: '',
    );
  }

  String _learnerDisplayName() {
    if (state.chosenCharacterName.isNotEmpty) {
      return state.chosenCharacterName;
    }
    final fromMessages = _characterNameFromMessages(
      state.chosenCharacterId,
      state.messages,
    );
    if (fromMessages.isNotEmpty) return fromMessages;
    return defaultLearnerName;
  }

  String _characterNameFromMessages(
    String characterId,
    List<SimulationMessage> messages,
  ) {
    if (characterId.isEmpty) return '';
    final match = messages
        .where(
          (m) =>
              m.speakerCharacterId == characterId && m.speakerName.isNotEmpty,
        )
        .lastOrNull;
    return match?.speakerName ?? '';
  }

  void loadExistingSession({
    required SimulationSession session,
    required List<SimulationMessage> messages,
    String chosenCharacterName = '',
    Map<String, dynamic>? result,
  }) {
    final isCompleted = session.status == 'COMPLETED';
    String? resultId;
    if (result != null && result['id'] != null) {
      resultId = result['id'] as String;
    }

    final resolvedCharacterName = chosenCharacterName.isNotEmpty
        ? chosenCharacterName
        : _characterNameFromMessages(session.chosenCharacterId, messages);

    _outboundMessageId = null;
    state = SimulationChatState(
      sessionId: session.id,
      chosenCharacterId: session.chosenCharacterId,
      chosenCharacterName: resolvedCharacterName,
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
