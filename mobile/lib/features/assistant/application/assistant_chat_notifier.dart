import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/ai_api.dart';
import '../data/ai_api_provider.dart';
import '../data/screen_context_provider.dart';
import '../domain/assistant_event.dart';
import '../domain/assistant_state.dart';
import 'assistant_state_machine.dart';

/// Orchestrator that wires [AiApi.chatStream] into the
/// [AssistantStateMachine]. Owns the in-flight Dio `CancelToken` and
/// stream subscription so the widget tree never touches them directly,
/// and persists the server-assigned `conversationId` across "Soạn tiếp"
/// follow-ups (cleared by `reset`, `collapse`, or the next bar open).
///
/// Surfaces a small command API to the UI:
/// - [sendMessage] — first send or a follow-up after Soạn tiếp.
/// - [stop] — user tapped Stop mid-stream.
/// - [composeAgain] — user tapped "Soạn tiếp"; keeps `conversationId`.
/// - [reset] — user tapped "Reset"; drops `conversationId` so the next
///   send opens a fresh Conversation with the current `screenContext`.
/// - [collapse] — user dismissed the sheet ("−", backdrop, drag-down).
/// - [retry] — user tapped "Thử lại" on a pre-token error.
/// - [openBar] — user tapped the bar to enter Compose.
///
/// State is observable via [assistantStateMachineProvider]; this notifier
/// does not have observable state of its own.
class AssistantChatNotifier {
  AssistantChatNotifier(this._ref);

  final Ref _ref;

  CancelToken? _cancelToken;
  StreamSubscription<AssistantEvent>? _subscription;
  String? _conversationId;
  bool _userCancelled = false;

  @visibleForTesting
  String? get conversationIdForTesting => _conversationId;

  /// The current conversation ID. Used by the full-screen widget to
  /// load conversation messages.
  String? get conversationId => _conversationId;

  /// Bar tap / drag-up: Collapsed → MidCompose. Idempotent on already-open
  /// states (no-op if not Collapsed) so the bar can be safely re-tapped
  /// in race conditions.
  void openBar() {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    if (_ref.read(assistantStateMachineProvider) is! AssistantCollapsed) {
      return;
    }
    sm.openBar();
  }

  /// User tapped Send. Cancels any in-flight stream (rapid-send), drives
  /// the state machine into Loading, then opens a new SSE stream and
  /// dispatches events to the state machine.
  Future<void> sendMessage(String message) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) return;

    // Rapid send — cancel whatever is in flight without surfacing an
    // error to the UI.
    await _cancelInFlight();

    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _ref.read(assistantStateMachineProvider);

    // Bring the state machine to a `send()`-accepting state (Compose or
    // Error). Rapid send from a still-streaming reply synthesizes the
    // Stop + Soạn-tiếp transitions the user would otherwise tap.
    if (current is AssistantMidLoading ||
        (current is AssistantMidReading && current.streaming)) {
      sm.stop();
      sm.composeAgain();
    } else if (current is AssistantMidReading) {
      // MidReading(done) — implicit Soạn tiếp.
      sm.composeAgain();
    } else if (current is AssistantCollapsed) {
      // Defensive: allow programmatic send to also open the sheet.
      sm.openBar();
    }

    sm.send(trimmed);

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;
    _userCancelled = false;

    final screenContext = _ref.read(currentScreenContextProvider);
    final api = _ref.read(aiApiProvider);

    try {
      _subscription = api
          .chatStream(
            message: trimmed,
            conversationId: _conversationId,
            screenContext: screenContext,
            cancelToken: cancelToken,
          )
          .listen(
            _handleEvent,
            onError: _handleStreamError,
            onDone: _handleStreamDone,
            cancelOnError: true,
          );
    } catch (e) {
      _handleStreamError(e);
    }
  }

  /// User tapped Stop. Cancels the Dio request (server persists partial
  /// with `interrupted=true`) and synthesizes the terminal "interrupted
  /// done" state immediately so the UI doesn't have to wait for the
  /// abort to round-trip.
  void stop() {
    if (_cancelToken == null && _subscription == null) {
      return;
    }
    _userCancelled = true;
    _cancelToken?.cancel('user pressed Stop');
    _ref.read(assistantStateMachineProvider.notifier).stop();
  }

  /// User tapped "Soạn tiếp". Returns to Compose; keeps
  /// `conversationId` so the next send continues the same server-side
  /// Conversation.
  void composeAgain() {
    _ref.read(assistantStateMachineProvider.notifier).composeAgain();
  }

  /// User tapped "Reset". Drops the cached `conversationId` and returns
  /// to Compose; the next send creates a brand-new Conversation with the
  /// now-current `screenContext`.
  Future<void> reset() async {
    await _cancelInFlight();
    _conversationId = null;
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _ref.read(assistantStateMachineProvider);
    if (current is AssistantFull) {
      sm.reset();
    } else {
      sm.reset();
    }
  }

  /// User dismissed the sheet (`−` button, backdrop tap, drag-down).
  /// Drops `conversationId` per PRD §"Conversation lifecycle" — each
  /// new bar-open session starts a fresh Conversation on first send.
  Future<void> collapse() async {
    await _cancelInFlight();
    _conversationId = null;
    _ref.read(assistantStateMachineProvider.notifier).collapse();
  }

  /// Drag-up gesture from Mid state → Full. Does NOT drop
  /// `conversationId` so the same conversation is shown in Full.
  void enterFull() {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    sm.enterFull();
  }

  /// Back gesture or close button from Full → prior Mid state.
  void exitFull() {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    sm.exitFull();
  }

  /// Opens an existing conversation by id. Sets the internal
  /// `conversationId` and transitions to MidReading so the caller can
  /// display the loaded messages. Used when tapping a conversation row
  /// in the drawer.
  void openExistingConversation(String conversationId) {
    _conversationId = conversationId;
    // Transition to MidCompose so the user can send a follow-up.
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _ref.read(assistantStateMachineProvider);
    if (current is AssistantFull) {
      // Stay in Full; the full-screen widget handles message display.
    } else if (current is! AssistantMidCompose) {
      // If not already in compose, try to get there.
      if (current is AssistantCollapsed) {
        sm.openBar();
      }
    }
  }

  /// User tapped "Thử lại" on a pre-token error. Re-sends the cached
  /// `lastInput` so the learner doesn't lose their question.
  Future<void> retry() async {
    final s = _ref.read(assistantStateMachineProvider);
    if (s is! AssistantMidError) return;
    await sendMessage(s.lastInput);
  }

  /// Updates a proposal's status (e.g. loading → success/error).
  void updateProposal(int index, ProposalState updated) {
    _ref.read(assistantStateMachineProvider.notifier).updateProposal(index, updated);
  }

  /// Dismisses a proposal card (decline).
  void dismissProposal(int index) {
    _ref.read(assistantStateMachineProvider.notifier).dismissProposal(index);
  }

  void _handleEvent(AssistantEvent event) {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _ref.read(assistantStateMachineProvider);

    switch (event) {
      case ConversationStartedEvent(:final conversationId):
        _conversationId = conversationId;
      case ToolStartEvent(:final displayName):
        if (current is AssistantMidLoading) {
          sm.onToolStart(displayName: displayName);
        }
      case ToolResultEvent():
        // No state change in V1 — tool_result is observable via
        // network logs and the message-history endpoint. The UI does
        // not visualize per-tool result yet.
        break;
      case TextChunkEvent(:final text):
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onTextChunk(text);
        }
      case ProposeEvent():
        final current = _ref.read(assistantStateMachineProvider);
        if (current is AssistantMidReading && current.streaming) {
          sm.onPropose(event);
        }
      case AssistantErrorEvent(:final message):
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onError(message: message);
        }
      case DoneEvent(:final messageId, :final interrupted):
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onDone(messageId: messageId, interrupted: interrupted);
        }
    }
  }

  void _handleStreamError(Object error, [StackTrace? _]) {
    if (_userCancelled) {
      // Cancellation surfaces as a DioException(cancel) — we already
      // transitioned the state machine via `stop()`. Swallow.
      _subscription = null;
      _cancelToken = null;
      return;
    }
    if (error is DioException && error.type == DioExceptionType.cancel) {
      _subscription = null;
      _cancelToken = null;
      return;
    }

    final message = _humanReadableError(error);
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _ref.read(assistantStateMachineProvider);
    if (current is AssistantMidLoading ||
        (current is AssistantMidReading && current.streaming)) {
      sm.onError(message: message);
    }
    _subscription = null;
    _cancelToken = null;
  }

  void _handleStreamDone() {
    final current = _ref.read(assistantStateMachineProvider);
    // Server should have sent a `done` event; if not, defensively
    // terminate the stream so the UI does not stay stuck in Loading.
    if (current is AssistantMidLoading ||
        (current is AssistantMidReading && current.streaming)) {
      _ref.read(assistantStateMachineProvider.notifier).stop();
    }
    _subscription = null;
    _cancelToken = null;
  }

  String _humanReadableError(Object error) {
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status != null) return 'Lỗi máy chủ ($status). Vui lòng thử lại.';
      return 'Mất kết nối. Vui lòng thử lại.';
    }
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  Future<void> _cancelInFlight() async {
    final token = _cancelToken;
    final sub = _subscription;
    _userCancelled = true;
    if (token != null && !token.isCancelled) {
      token.cancel('superseded by next request');
    }
    // We deliberately do NOT await `sub.cancel()` here: cancelling the
    // subscription before the Dio cancel-error has had a chance to flow
    // through our `onError` handler causes the error to be reported as
    // an uncaught async error in tests (`flutter_test` zone error
    // handler). Instead, we rely on the existing `cancelOnError: true`
    // on the subscription: the cancel-error fires, our onError swallows
    // it (because `_userCancelled` is true), and the subscription
    // auto-cancels. The local refs are dropped so a subsequent send can
    // start a fresh stream without touching the dying one.
    sub?.onError((Object _, StackTrace _) {});
    _subscription = null;
    _cancelToken = null;
  }

  @visibleForTesting
  Future<void> dispose() async {
    await _cancelInFlight();
  }
}

final assistantChatNotifierProvider = Provider<AssistantChatNotifier>((ref) {
  final notifier = AssistantChatNotifier(ref);
  ref.onDispose(notifier.dispose);
  return notifier;
});
