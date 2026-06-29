import 'package:flutter/foundation.dart';

/// UI states for the Trợ lý AI surface. Drives both the `AssistantBar` and
/// `AssistantQuestionSheet` widgets through a single Riverpod notifier.
///
/// The state machine is intentionally *minimal* — it only encodes the
/// phases described in the PRD ("Streaming protocol — single SSE
/// endpoint" + "Mobile UI state machine"). Conversation identity, partial
/// text accumulation across resends, and CancelToken lifecycle are
/// orchestrated by `AssistantChatNotifier` on top of this state.
@immutable
sealed class AssistantState {
  const AssistantState();
}

/// Default state. Sheet is hidden; only the bar is visible.
class AssistantCollapsed extends AssistantState {
  const AssistantCollapsed();

  @override
  bool operator ==(Object other) => other is AssistantCollapsed;

  @override
  int get hashCode => 0;

  @override
  String toString() => 'AssistantCollapsed';
}

/// Compose phase of the Mid (Hỏi) state — textarea visible, Send tappable.
class AssistantMidCompose extends AssistantState {
  const AssistantMidCompose({this.pendingInput});

  /// When non-null, the compose input should be pre-filled with this text.
  /// Set by [AssistantStateMachine.composeWithInput] after a failed turn
  /// so the learner can edit and retry without re-typing.
  final String? pendingInput;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantMidCompose && pendingInput == other.pendingInput;

  @override
  int get hashCode => pendingInput.hashCode;

  @override
  String toString() => 'AssistantMidCompose(pendingInput: $pendingInput)';
}

/// Loading phase — spinner + per-tool status text + Stop. Entered when
/// the user taps Send; exits to MidReading on the first `text_chunk` or
/// to MidError on a pre-token error.
class AssistantMidLoading extends AssistantState {
  const AssistantMidLoading({
    required this.lastInput,
    this.statusText = defaultStatusText,
  });

  static const String defaultStatusText = 'Thinking...';

  /// The message the learner just sent. Retained so `MidError → retry`
  /// can re-issue the same request without re-prompting.
  final String lastInput;

  /// Vietnamese status string shown next to the spinner. Updated on
  /// every `tool_start` to the tool's `displayName`.
  final String statusText;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantMidLoading &&
          lastInput == other.lastInput &&
          statusText == other.statusText;

  @override
  int get hashCode => Object.hash(lastInput, statusText);

  @override
  String toString() =>
      'AssistantMidLoading(statusText: $statusText, lastInput: $lastInput)';
}

/// Reading phase — partial markdown response shown. `streaming` is true
/// while text chunks are still arriving; false after `done` (or after
/// Stop / mid-stream error).
class AssistantMidReading extends AssistantState {
  const AssistantMidReading({
    required this.partial,
    required this.streaming,
    this.interrupted = false,
    this.messageId,
    this.toolStatusText,
  });

  final String partial;
  final bool streaming;
  final bool interrupted;
  final String? messageId;
  final String? toolStatusText;

  /// True once `done` has been received (or Stop / error has terminated
  /// the stream). Useful for UI predicates: "show Soạn tiếp button only
  /// when reading is done".
  bool get isDone => !streaming;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantMidReading &&
          partial == other.partial &&
          streaming == other.streaming &&
          interrupted == other.interrupted &&
          messageId == other.messageId &&
          toolStatusText == other.toolStatusText;

  @override
  int get hashCode => Object.hash(
    partial,
    streaming,
    interrupted,
    messageId,
    toolStatusText,
  );

  @override
  String toString() =>
      'AssistantMidReading(streaming: $streaming, interrupted: $interrupted, '
      'messageId: $messageId, partialLength: ${partial.length}, '
      'toolStatusText: $toolStatusText)';
}

/// Pre-token error state — backend returned an error before any
/// `text_chunk` arrived. The UI shows the message and a "Thử lại" button
/// that retries with [lastInput].
class AssistantMidError extends AssistantState {
  const AssistantMidError({required this.message, required this.lastInput});

  final String message;
  final String lastInput;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantMidError &&
          message == other.message &&
          lastInput == other.lastInput;

  @override
  int get hashCode => Object.hash(message, lastInput);

  @override
  String toString() =>
      'AssistantMidError(message: $message, lastInput: $lastInput)';
}

/// Full-screen chat state. Reachable via drag-up from any Mid state.
/// Stores [priorState] so Full can render the active Mid turn while it is
/// open. Closing Full collapses the surface; it does not restore stale
/// Mid content.
class AssistantFull extends AssistantState {
  const AssistantFull({this.priorState});

  /// The state the user was in before entering Full. `null` means the
  /// machine was freshly opened into Full (unlikely but safe).
  final AssistantState? priorState;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantFull && priorState == other.priorState;

  @override
  int get hashCode => priorState.hashCode;

  @override
  String toString() => 'AssistantFull(priorState: $priorState)';
}
