import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/assistant_state.dart';

/// Pure-logic Riverpod notifier encoding the PRD's "Mobile UI state
/// machine" (see PRD §"Mobile UI state machine — Assistant State
/// Machine"). All transitions are explicit; invalid transitions throw
/// [StateError] so a buggy caller (e.g. emitting a `text_chunk` after a
/// `done`) fails loudly during development.
///
/// The notifier is intentionally I/O-free: it knows nothing about the
/// SSE stream, Dio, or the network. The `AssistantChatNotifier` orchestrates
/// the actual stream subscription and feeds events into this machine.
class AssistantStateMachine extends Notifier<AssistantState> {
  @override
  AssistantState build() => const AssistantCollapsed();

  /// Bar tap / drag-up: Collapsed → MidCompose.
  void openBar() {
    if (state is! AssistantCollapsed) {
      throw _invalid('openBar');
    }
    state = const AssistantMidCompose();
  }

  /// Restores a paused session directly from [AssistantCollapsed].
  /// [savedState] must already be sanitized by the caller (no streaming,
  /// no loading — only Compose, Reading(done), or Error).
  void restoreSession(AssistantState savedState) {
    if (state is! AssistantCollapsed) {
      throw _invalid('restoreSession');
    }
    state = savedState;
  }

  /// Send tapped: MidCompose → MidLoading. Also valid as a retry from
  /// MidError so the chat notifier can re-issue with the cached input
  /// without manually clearing the error state first.
  void send(String input) {
    final s = _activeState;
    if (s is! AssistantMidCompose && s is! AssistantMidError) {
      throw _invalid('send');
    }
    _setActiveState(AssistantMidLoading(lastInput: input));
  }

  /// `tool_start` event arrived. Updates the loading-phase status text.
  /// The PRD pins the source of [displayName] to the tool's own
  /// declaration (e.g. "Đang tóm tắt thông tin của bạn..."), not a
  /// generic fallback. If text already started streaming, the reading body
  /// stays visible and the tool status is rendered as one inline loading row.
  void onToolStart({required String displayName}) {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(
        AssistantMidLoading(lastInput: s.lastInput, statusText: displayName),
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial,
          streaming: true,
          interrupted: s.interrupted,
          messageId: s.messageId,
          toolStatusText: displayName,
        ),
      );
      return;
    }
    throw _invalid('onToolStart');
  }

  /// `tool_result` event arrived. When a tool was shown inline after text had
  /// already started streaming, clear that one-line loading row.
  void onToolResult() {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(
        AssistantMidLoading(lastInput: s.lastInput, statusText: s.statusText),
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial,
          streaming: true,
          interrupted: s.interrupted,
          messageId: s.messageId,
          toolStatusText: null,
        ),
      );
      return;
    }
    throw _invalid('onToolResult');
  }

  /// `text_chunk` event arrived. From MidLoading this transitions into
  /// MidReading(streaming); subsequent chunks append to `partial`.
  void onTextChunk(String text) {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(AssistantMidReading(partial: text, streaming: true));
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial + text,
          streaming: true,
          interrupted: s.interrupted,
          messageId: s.messageId,
          toolStatusText: s.toolStatusText,
        ),
      );
      return;
    }
    throw _invalid('onTextChunk');
  }

  /// `error` event arrived. From MidLoading (no token yet) transitions
  /// to MidError so the UI can show a "Thử lại" button. From mid-stream
  /// MidReading, the partial text is preserved and the stream is
  /// considered done with `interrupted=true`.
  void onError({required String message}) {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(
        AssistantMidError(message: message, lastInput: s.lastInput),
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial,
          streaming: false,
          interrupted: true,
          messageId: s.messageId,
          toolStatusText: null,
        ),
      );
      return;
    }
    throw _invalid('onError');
  }

  /// `done` event arrived. Terminal for the turn. From MidLoading
  /// (server skipped any text — unusual but possible for tool-only
  /// turns) transitions to MidReading(done) with an empty partial.
  void onDone({required String messageId, required bool interrupted}) {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(
        AssistantMidReading(
          partial: '',
          streaming: false,
          interrupted: interrupted,
          messageId: messageId,
        ),
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial,
          streaming: false,
          interrupted: interrupted,
          messageId: messageId,
          toolStatusText: null,
        ),
      );
      return;
    }
    throw _invalid('onDone');
  }

  /// Stop tapped — UI-side cancellation. The notifier separately cancels
  /// the Dio `CancelToken`; here we synthesize the terminal
  /// "interrupted done" UI state so the user immediately sees "Đã dừng"
  /// and "Soạn tiếp" instead of staring at a frozen spinner.
  void stop() {
    final s = _activeState;
    if (s is AssistantMidLoading) {
      _setActiveState(
        const AssistantMidReading(
          partial: '',
          streaming: false,
          interrupted: true,
        ),
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      _setActiveState(
        AssistantMidReading(
          partial: s.partial,
          streaming: false,
          interrupted: true,
          messageId: s.messageId,
          toolStatusText: null,
        ),
      );
      return;
    }
    throw _invalid('stop');
  }

  /// "Soạn tiếp" tapped — clears the on-screen answer and returns to
  /// Compose. Server-side conversation is preserved by the chat
  /// notifier (which keeps the cached `conversationId`).
  void composeAgain() {
    final s = _activeState;
    if (s is! AssistantMidReading || s.streaming) {
      throw _invalid('composeAgain');
    }
    _setActiveState(const AssistantMidCompose());
  }

  /// Error recovery — transitions to Compose with [input] pre-filled so
  /// the learner can edit and retry without re-typing. Valid from MidError
  /// or MidLoading (when stop is called before any text arrived).
  void composeWithInput(String input) {
    final s = _activeState;
    if (s is AssistantMidError || s is AssistantMidLoading) {
      _setActiveState(AssistantMidCompose(pendingInput: input));
      return;
    }
    throw _invalid('composeWithInput');
  }

  /// "Reset" button — drops the current conversation and returns to
  /// Compose. Valid from any non-Collapsed state. The chat notifier
  /// separately clears its cached `conversationId`.
  void reset() {
    if (state is AssistantCollapsed) {
      throw _invalid('reset');
    }
    _setActiveState(const AssistantMidCompose());
  }

  /// Backdrop tap, "−" button, drag-down — back to Collapsed.
  void collapse() {
    if (state is AssistantCollapsed) {
      throw _invalid('collapse');
    }
    state = const AssistantCollapsed();
  }

  /// Drag-up from any Mid state → Full. Saves the current state as
  /// [priorState] so Full can keep rendering the active turn.
  void enterFull() {
    final s = state;
    if (s is AssistantCollapsed || s is AssistantFull) {
      throw _invalid('enterFull');
    }
    state = AssistantFull(priorState: s);
  }

  /// Back gesture or close button from Full → Collapsed. Closing Full
  /// intentionally does not restore the previous Mid state; the next bar
  /// open starts from Compose instead of showing stale Mid content.
  void exitFull() {
    final s = state;
    if (s is! AssistantFull) {
      throw _invalid('exitFull');
    }
    state = const AssistantCollapsed();
  }

  AssistantState get _activeState {
    final s = state;
    if (s is AssistantFull) {
      return s.priorState ?? const AssistantCollapsed();
    }
    return s;
  }

  void _setActiveState(AssistantState next) {
    final s = state;
    if (s is AssistantFull) {
      state = AssistantFull(priorState: next);
      return;
    }
    state = next;
  }

  StateError _invalid(String op) => StateError(
    'AssistantStateMachine.$op called in invalid state: '
    '${state.runtimeType}',
  );
}

final assistantStateMachineProvider =
    NotifierProvider<AssistantStateMachine, AssistantState>(
      AssistantStateMachine.new,
    );
