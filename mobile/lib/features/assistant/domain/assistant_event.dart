import 'package:flutter/foundation.dart';

/// Typed events emitted by the backend's `POST /ai/chat/stream` SSE
/// endpoint and decoded by [SseEventDecoder]. The sealed hierarchy
/// mirrors `backend/src/modules/agent/application/stream-event.ts`.
@immutable
sealed class AssistantEvent {
  const AssistantEvent();
}

/// Emitted once per turn, as the very first event. Carries the
/// server-assigned `conversationId` so the mobile client can persist it
/// for follow-up ("Soạn tiếp") messages.
class ConversationStartedEvent extends AssistantEvent {
  const ConversationStartedEvent({required this.conversationId});

  final String conversationId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConversationStartedEvent &&
          conversationId == other.conversationId;

  @override
  int get hashCode => conversationId.hashCode;

  @override
  String toString() =>
      'ConversationStartedEvent(conversationId: $conversationId)';
}

/// A tool invocation has started. Mobile uses [displayName] to update
/// the per-tool status text shown during the Loading phase.
class ToolStartEvent extends AssistantEvent {
  const ToolStartEvent({
    required this.name,
    required this.displayName,
    this.args = const {},
  });

  final String name;
  final String displayName;
  final Map<String, dynamic> args;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ToolStartEvent &&
          name == other.name &&
          displayName == other.displayName &&
          mapEquals(args, other.args);

  @override
  int get hashCode => Object.hash(
        name,
        displayName,
        Object.hashAllUnordered(
          args.entries.map((e) => Object.hash(e.key, e.value)),
        ),
      );

  @override
  String toString() =>
      'ToolStartEvent(name: $name, displayName: $displayName, args: $args)';
}

/// A tool invocation completed. `ok=false` means the tool returned an
/// `{error}` payload or threw.
class ToolResultEvent extends AssistantEvent {
  const ToolResultEvent({required this.name, required this.ok});

  final String name;
  final bool ok;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ToolResultEvent && name == other.name && ok == other.ok;

  @override
  int get hashCode => Object.hash(name, ok);

  @override
  String toString() => 'ToolResultEvent(name: $name, ok: $ok)';
}

/// A chunk of the assistant's final answer. Concatenate in order to
/// build the full message.
class TextChunkEvent extends AssistantEvent {
  const TextChunkEvent({required this.text});

  final String text;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TextChunkEvent && text == other.text;

  @override
  int get hashCode => text.hashCode;

  @override
  String toString() => 'TextChunkEvent(text: $text)';
}

/// Structured proposal payload from a propose-tool. Mobile renders a
/// confirm card; on "Có" the mobile client calls the real REST
/// endpoint. Reserved for slice #07; declared here so the protocol
/// surface is locked.
class ProposeEvent extends AssistantEvent {
  const ProposeEvent({
    required this.kind,
    required this.title,
    required this.description,
    required this.endpoint,
    this.payload = const {},
  });

  final String kind;
  final String title;
  final String description;
  final String endpoint;
  final Map<String, dynamic> payload;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProposeEvent &&
          kind == other.kind &&
          title == other.title &&
          description == other.description &&
          endpoint == other.endpoint &&
          mapEquals(payload, other.payload);

  @override
  int get hashCode => Object.hash(kind, title, description, endpoint);

  @override
  String toString() =>
      'ProposeEvent(kind: $kind, title: $title, endpoint: $endpoint)';
}

/// Backend-side error mid-stream. The mobile UI shows the message and,
/// for pre-token errors, a "Thử lại" button.
class AssistantErrorEvent extends AssistantEvent {
  const AssistantErrorEvent({required this.code, required this.message});

  final String code;
  final String message;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssistantErrorEvent &&
          code == other.code &&
          message == other.message;

  @override
  int get hashCode => Object.hash(code, message);

  @override
  String toString() => 'AssistantErrorEvent(code: $code, message: $message)';
}

/// Terminal event of a successful (or aborted) turn. `interrupted=true`
/// when the client cancelled the stream mid-turn.
class DoneEvent extends AssistantEvent {
  const DoneEvent({required this.messageId, this.interrupted = false});

  final String messageId;
  final bool interrupted;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DoneEvent &&
          messageId == other.messageId &&
          interrupted == other.interrupted;

  @override
  int get hashCode => Object.hash(messageId, interrupted);

  @override
  String toString() =>
      'DoneEvent(messageId: $messageId, interrupted: $interrupted)';
}

/// Thrown by [SseEventDecoder] when an SSE frame cannot be parsed
/// (malformed JSON, unknown event type with a malformed payload, etc.).
/// Surfaced through the stream's error channel rather than silently
/// dropping the event so callers can decide how to react.
class SseDecoderException implements Exception {
  const SseDecoderException(this.message, [this.rawFrame]);

  final String message;
  final String? rawFrame;

  @override
  String toString() => 'SseDecoderException: $message';
}
