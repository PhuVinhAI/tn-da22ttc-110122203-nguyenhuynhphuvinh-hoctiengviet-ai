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
  const AssistantMidCompose();

  @override
  bool operator ==(Object other) => other is AssistantMidCompose;

  @override
  int get hashCode => 0;

  @override
  String toString() => 'AssistantMidCompose';
}

/// Loading phase — spinner + per-tool status text + Stop. Entered when
/// the user taps Send; exits to MidReading on the first `text_chunk` or
/// to MidError on a pre-token error.
class AssistantMidLoading extends AssistantState {
  const AssistantMidLoading({
    required this.lastInput,
    this.statusText = defaultStatusText,
  });

  static const String defaultStatusText = 'Đang suy nghĩ...';

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

/// Lifecycle state of a single proposal card.
enum ProposalCardStatus {
  /// Waiting for user action (Có / Không).
  pending,

  /// REST call in flight — both buttons disabled.
  loading,

  /// REST call succeeded — show success feedback + optional deep-link.
  success,

  /// REST call failed — show inline error + retry (except 403).
  error,
}

/// Tracks the state of a single inline proposal card rendered below the
/// AI message. Created when a `propose` SSE event arrives; mutated as
/// the user interacts (confirm / decline / retry).
@immutable
class ProposalState {
  const ProposalState({
    required this.kind,
    required this.title,
    required this.description,
    required this.endpoint,
    required this.payload,
    this.confirmLabel = 'Có',
    this.declineLabel = 'Không',
    this.status = ProposalCardStatus.pending,
    this.errorMessage,
  });

  final String kind;
  final String title;
  final String description;
  final String endpoint;
  final Map<String, dynamic> payload;
  final String confirmLabel;
  final String declineLabel;
  final ProposalCardStatus status;
  final String? errorMessage;

  ProposalState copyWith({
    ProposalCardStatus? status,
    String? errorMessage,
  }) {
    return ProposalState(
      kind: kind,
      title: title,
      description: description,
      endpoint: endpoint,
      payload: payload,
      confirmLabel: confirmLabel,
      declineLabel: declineLabel,
      status: status ?? this.status,
      errorMessage: errorMessage,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProposalState &&
          kind == other.kind &&
          title == other.title &&
          description == other.description &&
          endpoint == other.endpoint &&
          confirmLabel == other.confirmLabel &&
          declineLabel == other.declineLabel &&
          status == other.status &&
          errorMessage == other.errorMessage &&
          mapEquals(payload, other.payload);

  @override
  int get hashCode => Object.hash(
        kind,
        title,
        description,
        endpoint,
        confirmLabel,
        declineLabel,
        status,
        errorMessage,
      );

  @override
  String toString() =>
      'ProposalState(kind: $kind, status: $status, endpoint: $endpoint)';
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
    this.proposals = const [],
  });

  final String partial;
  final bool streaming;
  final bool interrupted;
  final String? messageId;

  /// Inline proposal cards emitted by `propose` SSE events during this
  /// turn. Rendered below the AI markdown in both Mid and Full modes.
  final List<ProposalState> proposals;

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
          listEquals(proposals, other.proposals);

  @override
  int get hashCode =>
      Object.hash(partial, streaming, interrupted, messageId, Object.hashAll(proposals));

  @override
  String toString() =>
      'AssistantMidReading(streaming: $streaming, interrupted: $interrupted, '
      'messageId: $messageId, partialLength: ${partial.length}, '
      'proposals: ${proposals.length})';
}

/// Pre-token error state — backend returned an error before any
/// `text_chunk` arrived. The UI shows the message and a "Thử lại" button
/// that retries with [lastInput].
class AssistantMidError extends AssistantState {
  const AssistantMidError({
    required this.message,
    required this.lastInput,
  });

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
/// Stores [priorState] so a back gesture or close button can restore
/// the previous Mid state (or Collapsed if none).
class AssistantFull extends AssistantState {
  const AssistantFull({this.priorState});

  /// The state the user was in before entering Full. Back gesture or
  /// close button returns here. `null` means the machine was freshly
  /// opened into Full (unlikely but safe to default to Collapsed).
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
