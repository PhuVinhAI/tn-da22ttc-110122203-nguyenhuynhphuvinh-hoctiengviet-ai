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

  /// Send tapped: MidCompose → MidLoading. Also valid as a retry from
  /// MidError so the chat notifier can re-issue with the cached input
  /// without manually clearing the error state first.
  void send(String input) {
    final s = state;
    if (s is! AssistantMidCompose && s is! AssistantMidError) {
      throw _invalid('send');
    }
    state = AssistantMidLoading(lastInput: input);
  }

  /// `tool_start` event arrived. Updates the loading-phase status text.
  /// The PRD pins the source of [displayName] to the tool's own
  /// declaration (e.g. "Đang tóm tắt thông tin của bạn..."), not a
  /// generic fallback.
  void onToolStart({required String displayName}) {
    final s = state;
    if (s is! AssistantMidLoading) {
      throw _invalid('onToolStart');
    }
    state = AssistantMidLoading(
      lastInput: s.lastInput,
      statusText: displayName,
    );
  }

  /// `text_chunk` event arrived. From MidLoading this transitions into
  /// MidReading(streaming); subsequent chunks append to `partial`.
  void onTextChunk(String text) {
    final s = state;
    if (s is AssistantMidLoading) {
      state = AssistantMidReading(partial: text, streaming: true);
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      state = AssistantMidReading(
        partial: s.partial + text,
        streaming: true,
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
    final s = state;
    if (s is AssistantMidLoading) {
      state = AssistantMidError(message: message, lastInput: s.lastInput);
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      state = AssistantMidReading(
        partial: s.partial,
        streaming: false,
        interrupted: true,
        messageId: s.messageId,
      );
      return;
    }
    throw _invalid('onError');
  }

  /// `done` event arrived. Terminal for the turn. From MidLoading
  /// (server skipped any text — unusual but possible for tool-only
  /// turns) transitions to MidReading(done) with an empty partial.
  void onDone({required String messageId, required bool interrupted}) {
    final s = state;
    if (s is AssistantMidLoading) {
      state = AssistantMidReading(
        partial: '',
        streaming: false,
        interrupted: interrupted,
        messageId: messageId,
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      state = AssistantMidReading(
        partial: s.partial,
        streaming: false,
        interrupted: interrupted,
        messageId: messageId,
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
    final s = state;
    if (s is AssistantMidLoading) {
      state = AssistantMidReading(
        partial: '',
        streaming: false,
        interrupted: true,
      );
      return;
    }
    if (s is AssistantMidReading && s.streaming) {
      state = AssistantMidReading(
        partial: s.partial,
        streaming: false,
        interrupted: true,
        messageId: s.messageId,
      );
      return;
    }
    throw _invalid('stop');
  }

  /// "Soạn tiếp" tapped — clears the on-screen answer and returns to
  /// Compose. Server-side conversation is preserved by the chat
  /// notifier (which keeps the cached `conversationId`).
  void composeAgain() {
    final s = state;
    if (s is! AssistantMidReading || s.streaming) {
      throw _invalid('composeAgain');
    }
    state = const AssistantMidCompose();
  }

  /// "Reset" button — drops the current conversation and returns to
  /// Compose. Valid from any non-Collapsed state. The chat notifier
  /// separately clears its cached `conversationId`.
  void reset() {
    if (state is AssistantCollapsed) {
      throw _invalid('reset');
    }
    state = const AssistantMidCompose();
  }

  /// Backdrop tap, "−" button, drag-down — back to Collapsed.
  void collapse() {
    if (state is AssistantCollapsed) {
      throw _invalid('collapse');
    }
    state = const AssistantCollapsed();
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
