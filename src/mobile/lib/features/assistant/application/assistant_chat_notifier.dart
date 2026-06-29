import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/ai_api.dart';
import '../data/ai_api_provider.dart';
import '../data/conversation_list_provider.dart';
import '../data/go_router_effective_route.dart';
import '../data/screen_context_for_api.dart';
import '../data/screen_context_provider.dart';
import '../data/screen_ui_snapshot_provider.dart';
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

  // Paused session — preserved across a single bar-close/reopen cycle
  // when the screen (route location) has not changed.
  String? _pausedConversationId;
  AssistantState? _pausedState;
  String? _pausedLocation;

  @visibleForTesting
  String? get conversationIdForTesting => _conversationId;

  /// The current conversation ID. Used by the full-screen widget to
  /// load conversation messages.
  String? get conversationId => _conversationId;

  /// Bar tap / drag-up: Collapsed → MidCompose (fresh) or restores the
  /// paused session if the current screen matches the screen where the bar
  /// was last closed. Idempotent on already-open states.
  void openBar() {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    if (_ref.read(assistantStateMachineProvider) is! AssistantCollapsed) {
      return;
    }
    final currentLocation = _ref.read(currentRouteMatchProvider)?.location;
    if (_pausedConversationId != null &&
        _pausedState != null &&
        currentLocation != null &&
        currentLocation == _pausedLocation) {
      _conversationId = _pausedConversationId;
      final savedState = _pausedState!;
      _clearPausedSession();
      sm.restoreSession(savedState);
    } else {
      _clearPausedSession();
      sm.openBar();
    }
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
    final rawState = _ref.read(assistantStateMachineProvider);
    final current = _activeState(rawState);

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
      if (rawState is AssistantFull) {
        sm.reset();
      } else {
        sm.openBar();
      }
    }

    sm.send(trimmed);

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;
    _userCancelled = false;

    syncCurrentRouteMatch(_ref);
    _refreshScreenUiSnapshotIfNeeded();
    final screenContext = screenContextForApi(
      _ref.read(currentScreenContextProvider),
    );
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
  ///
  /// If AI hasn't streamed anything yet (MidLoading), also deletes the
  /// user message from the server and restores the input to Compose.
  void stop() {
    if (_cancelToken == null && _subscription == null) {
      return;
    }

    final current = _activeState(_ref.read(assistantStateMachineProvider));
    final isPreStream = current is AssistantMidLoading;
    final lastInput = isPreStream ? current.lastInput : null;

    _userCancelled = true;
    _cancelToken?.cancel('user pressed Stop');

    final sm = _ref.read(assistantStateMachineProvider.notifier);

    if (isPreStream && lastInput != null) {
      // No text streamed yet — restore input to Compose and delete user message.
      sm.composeWithInput(lastInput);
      if (_conversationId != null) {
        unawaited(_deleteLastUserMessage(_conversationId!));
      }
      _conversationId = null;
    } else {
      sm.stop();
    }
  }

  /// User tapped "Soạn tiếp". Returns to Compose; keeps
  /// `conversationId` so the next send continues the same server-side
  /// Conversation.
  void composeAgain() {
    _ref.read(assistantStateMachineProvider.notifier).composeAgain();
  }

  /// User tapped "Reset". Drops the cached `conversationId` and paused
  /// session, returns to Compose; the next send creates a brand-new
  /// Conversation with the now-current `screenContext`.
  Future<void> reset() async {
    await _cancelInFlight();
    _conversationId = null;
    _clearPausedSession();
    _ref.read(assistantStateMachineProvider.notifier).reset();
  }

  /// User dismissed the sheet (`−` button, backdrop tap, drag-down).
  /// Pauses the current session (if a conversation is active) so it can
  /// be restored when the bar is reopened on the same screen.
  Future<void> collapse() async {
    if (_ref.read(assistantStateMachineProvider) is AssistantFull) {
      return;
    }
    await _cancelInFlight();
    _savePausedSession(_ref.read(assistantStateMachineProvider));
    _conversationId = null;
    _ref.read(assistantStateMachineProvider.notifier).collapse();
  }

  /// Drag-up gesture from Mid state → Full. Does NOT drop
  /// `conversationId` so the same conversation is shown in Full.
  void enterFull() {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    sm.enterFull();
  }

  /// Back gesture or close button from Full → Collapsed.
  /// Returns `true` when the state machine actually exited Full.
  bool exitFull() {
    final rawState = _ref.read(assistantStateMachineProvider);
    if (rawState is! AssistantFull) {
      return false;
    }
    final priorState = rawState.priorState;
    final isPreStream = priorState is AssistantMidLoading;
    final convId = _conversationId;

    unawaited(_cancelInFlight());

    if (isPreStream && convId != null) {
      unawaited(_deleteLastUserMessage(convId));
    }

    _savePausedSession(rawState);
    _conversationId = null;
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    sm.exitFull();
    return true;
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

  /// User tapped "Thử lại" on a pre-token error. Deletes the orphaned
  /// user message from the backend (best-effort), then restores the
  /// input to Compose so the learner can edit and resend.
  Future<void> retry() async {
    final s = _activeState(_ref.read(assistantStateMachineProvider));
    if (s is! AssistantMidError) return;
    final lastInput = s.lastInput;
    if (_conversationId != null) {
      unawaited(_deleteLastUserMessage(_conversationId!));
    }
    _ref
        .read(assistantStateMachineProvider.notifier)
        .composeWithInput(lastInput);
  }

  /// User tapped Regenerate on an assistant message. Deletes [messageId]
  /// and all messages after it (the AI turn + any follow-ups), then
  /// re-sends the preceding user message.
  ///
  /// [precedingUserMessage] is the user message immediately before the
  /// assistant turn being regenerated. [hasMessagesAfter] controls
  /// whether the caller already confirmed deletion of subsequent messages.
  Future<void> regenerateFrom({
    required String messageId,
    required String precedingUserMessage,
  }) async {
    final convId = _conversationId;
    if (convId == null) return;

    await _cancelInFlight();

    try {
      final api = _ref.read(aiApiProvider);
      await api.deleteMessagesFrom(convId, messageId);
    } catch (_) {
      // Best-effort — proceed anyway; server will deduplicate.
    }

    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _activeState(_ref.read(assistantStateMachineProvider));

    // Bring state machine to a send-accepting state.
    if (current is AssistantMidReading || current is AssistantMidError) {
      sm.composeAgain();
    } else if (current is AssistantCollapsed) {
      sm.openBar();
    }

    sm.send(precedingUserMessage);

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;
    _userCancelled = false;

    syncCurrentRouteMatch(_ref);
    final screenContext = screenContextForApi(
      _ref.read(currentScreenContextProvider),
    );
    final api = _ref.read(aiApiProvider);

    try {
      _subscription = api
          .chatStream(
            message: precedingUserMessage,
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

  Future<void> _deleteLastUserMessage(String conversationId) async {
    try {
      final api = _ref.read(aiApiProvider);
      await api.deleteLastUserMessage(conversationId);
    } catch (_) {}
  }

  void _handleEvent(AssistantEvent event) {
    final sm = _ref.read(assistantStateMachineProvider.notifier);
    final current = _activeState(_ref.read(assistantStateMachineProvider));

    switch (event) {
      case ConversationStartedEvent(:final conversationId):
        _conversationId = conversationId;
      case ToolStartEvent(:final displayName):
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onToolStart(displayName: displayName);
        }
      case ToolResultEvent():
        // No state change in V1 — tool_result is observable via
        // network logs and the message-history endpoint. The UI does
        // not visualize per-tool result yet.
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onToolResult();
        }
      case TextChunkEvent(:final text):
        if (current is AssistantMidLoading ||
            (current is AssistantMidReading && current.streaming)) {
          sm.onTextChunk(text);
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
          _ref.invalidate(conversationListProvider);
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
    final current = _activeState(_ref.read(assistantStateMachineProvider));
    if (current is AssistantMidLoading) {
      // Error before any text streamed — restore input and clean up DB.
      final lastInput = current.lastInput;
      sm.composeWithInput(lastInput);
      if (_conversationId != null) {
        unawaited(_deleteLastUserMessage(_conversationId!));
        _conversationId = null;
      }
    } else if (current is AssistantMidReading && current.streaming) {
      sm.onError(message: message);
    }
    _subscription = null;
    _cancelToken = null;
  }

  void _handleStreamDone() {
    final current = _activeState(_ref.read(assistantStateMachineProvider));
    // Server should have sent a `done` event; if not, defensively
    // terminate the stream so the UI does not stay stuck in Loading.
    if (current is AssistantMidLoading) {
      // Closed before any text — restore input.
      final lastInput = current.lastInput;
      _ref.read(assistantStateMachineProvider.notifier).composeWithInput(lastInput);
      if (_conversationId != null) {
        unawaited(_deleteLastUserMessage(_conversationId!));
        _conversationId = null;
      }
    } else if (current is AssistantMidReading && current.streaming) {
      _ref.read(assistantStateMachineProvider.notifier).stop();
    }
    _subscription = null;
    _cancelToken = null;
  }

  AssistantState _activeState(AssistantState state) {
    if (state is AssistantFull) {
      return state.priorState ?? const AssistantCollapsed();
    }
    return state;
  }

  String _humanReadableError(Object error) {
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status != null) {
        return 'Server error ($status). Please try again.';
      }
      return 'Connection lost. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  }

  void _refreshScreenUiSnapshotIfNeeded() {
    final match = _ref.read(currentRouteMatchProvider);
    final registry = _ref.read(screenContextRegistryProvider);
    if (match != null && registry.hasBuilderForLocation(match.location)) {
      _ref.read(currentScreenUiSnapshotProvider.notifier).clear();
      return;
    }
    _refreshScreenUiSnapshot();
  }

  void _refreshScreenUiSnapshot() {
    final snapshot = _ref
        .read(screenUiSnapshotCoordinatorProvider)
        .captureNow();
    if (snapshot == null) return;

    final notifier = _ref.read(currentScreenUiSnapshotProvider.notifier);
    if (snapshot.isEmpty) {
      notifier.clear();
      return;
    }
    notifier.update(snapshot.toJson());
  }

  void _savePausedSession(AssistantState currentState) {
    if (_conversationId == null) {
      _clearPausedSession();
      return;
    }
    _pausedConversationId = _conversationId;
    _pausedState = _sanitizeForPause(currentState);
    _pausedLocation = _ref.read(currentRouteMatchProvider)?.location;
  }

  void _clearPausedSession() {
    _pausedConversationId = null;
    _pausedState = null;
    _pausedLocation = null;
  }

  AssistantState _sanitizeForPause(AssistantState state) {
    if (state is AssistantFull) {
      return _sanitizeForPause(state.priorState ?? const AssistantCollapsed());
    }
    if (state is AssistantMidLoading) {
      // Stream was cancelled — restore input so user can resend.
      return AssistantMidCompose(pendingInput: state.lastInput);
    }
    if (state is AssistantMidReading && state.streaming) {
      // Mark interrupted — the stream is gone.
      return AssistantMidReading(
        partial: state.partial,
        streaming: false,
        interrupted: true,
        messageId: state.messageId,
      );
    }
    return state;
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
