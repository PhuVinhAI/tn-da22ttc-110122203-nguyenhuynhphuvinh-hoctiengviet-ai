import 'dart:async';
import 'dart:convert';

import 'assistant_event.dart';

/// Decodes the byte stream of `POST /ai/chat/stream` (a Dio response with
/// `ResponseType.stream`) into typed [AssistantEvent]s.
///
/// The SSE wire format produced by NestJS's `@Sse()` runtime is one
/// `event: <type>\ndata: <json>\n\n` frame per emitted event. This
/// decoder:
///
/// - Tolerates byte-level chunking (one event may arrive across two
///   reads from the socket).
/// - Concatenates multi-line `data:` lines per the SSE spec (each
///   `data:` line is joined with a literal newline).
/// - Surfaces malformed frames as a [SseDecoderException] on the stream's
///   error channel rather than silently dropping them — this lets the
///   caller decide whether to fail the turn or skip.
class SseEventDecoder {
  SseEventDecoder();

  Stream<AssistantEvent> decode(Stream<List<int>> bytes) async* {
    // Bind through `utf8.decoder` so a multi-byte UTF-8 char split across
    // two byte chunks is reassembled before being handed to us as a
    // String — important for Vietnamese which is heavily multi-byte.
    final pieces = utf8.decoder.bind(bytes);

    var buffer = '';
    await for (final piece in pieces) {
      buffer += piece;

      while (true) {
        final boundary = _findFrameBoundary(buffer);
        if (boundary == null) break;

        final rawFrame = buffer.substring(0, boundary.start);
        buffer = buffer.substring(boundary.end);

        if (rawFrame.trim().isEmpty) {
          continue;
        }

        try {
          final event = _parseFrame(rawFrame);
          if (event != null) yield event;
        } on SseDecoderException catch (e) {
          yield* Stream<AssistantEvent>.error(e);
        }
      }
    }
  }

  _FrameBoundary? _findFrameBoundary(String buffer) {
    final lf = buffer.indexOf('\n\n');
    final crlf = buffer.indexOf('\r\n\r\n');

    if (lf < 0 && crlf < 0) return null;
    if (lf < 0) return _FrameBoundary(start: crlf, end: crlf + 4);
    if (crlf < 0) return _FrameBoundary(start: lf, end: lf + 2);

    return lf < crlf
        ? _FrameBoundary(start: lf, end: lf + 2)
        : _FrameBoundary(start: crlf, end: crlf + 4);
  }

  AssistantEvent? _parseFrame(String rawFrame) {
    String? type;
    final dataLines = <String>[];

    for (final line in const LineSplitter().convert(rawFrame)) {
      if (line.isEmpty) continue;
      if (line.startsWith(':')) continue;

      if (line.startsWith('event:')) {
        type = line.substring('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.add(line.substring('data:'.length).trim());
      }
    }

    if (type == null && dataLines.isEmpty) return null;
    if (type == null) {
      throw SseDecoderException('SSE frame missing event type', rawFrame);
    }

    final dataPayload = dataLines.join('\n');
    Map<String, dynamic> data;
    try {
      final decoded = jsonDecode(dataPayload);
      if (decoded is! Map<String, dynamic>) {
        throw SseDecoderException(
          'SSE frame data must decode to a JSON object',
          rawFrame,
        );
      }
      data = decoded;
    } on FormatException catch (e) {
      throw SseDecoderException(
        'Invalid JSON on data: line — ${e.message}',
        rawFrame,
      );
    }

    return _buildEvent(type, data, rawFrame);
  }

  AssistantEvent? _buildEvent(
    String type,
    Map<String, dynamic> data,
    String rawFrame,
  ) {
    switch (type) {
      case 'conversation_started':
        final id = data['conversationId'];
        if (id is! String || id.isEmpty) {
          throw SseDecoderException(
            'conversation_started missing conversationId',
            rawFrame,
          );
        }
        return ConversationStartedEvent(conversationId: id);

      case 'tool_start':
        final name = data['name'];
        final displayName = data['displayName'];
        if (name is! String || displayName is! String) {
          throw SseDecoderException(
            'tool_start missing name or displayName',
            rawFrame,
          );
        }
        final rawArgs = data['args'];
        return ToolStartEvent(
          name: name,
          displayName: displayName,
          args: rawArgs is Map<String, dynamic>
              ? rawArgs
              : <String, dynamic>{},
        );

      case 'tool_result':
        final name = data['name'];
        final ok = data['ok'];
        if (name is! String || ok is! bool) {
          throw SseDecoderException(
            'tool_result missing name or ok flag',
            rawFrame,
          );
        }
        return ToolResultEvent(name: name, ok: ok);

      case 'text_chunk':
        final text = data['text'];
        if (text is! String) {
          throw SseDecoderException(
            'text_chunk missing text',
            rawFrame,
          );
        }
        return TextChunkEvent(text: text);

      case 'propose':
        final kind = data['kind'];
        final title = data['title'];
        final description = data['description'];
        final endpoint = data['endpoint'];
        if (kind is! String ||
            title is! String ||
            description is! String ||
            endpoint is! String) {
          throw SseDecoderException(
            'propose event missing required fields',
            rawFrame,
          );
        }
        final rawPayload = data['payload'];
        final rawLabels = data['labels'];
        String confirmLabel = 'Có';
        String declineLabel = 'Không';
        if (rawLabels is Map<String, dynamic>) {
          final c = rawLabels['confirm'];
          final d = rawLabels['decline'];
          if (c is String) confirmLabel = c;
          if (d is String) declineLabel = d;
        }
        return ProposeEvent(
          kind: kind,
          title: title,
          description: description,
          endpoint: endpoint,
          payload: rawPayload is Map<String, dynamic>
              ? rawPayload
              : <String, dynamic>{},
          confirmLabel: confirmLabel,
          declineLabel: declineLabel,
        );

      case 'error':
        final code = data['code'];
        final message = data['message'];
        if (code is! String || message is! String) {
          throw SseDecoderException(
            'error event missing code or message',
            rawFrame,
          );
        }
        return AssistantErrorEvent(code: code, message: message);

      case 'done':
        final messageId = data['messageId'];
        final interrupted = data['interrupted'];
        if (messageId is! String || interrupted is! bool) {
          throw SseDecoderException(
            'done event missing messageId or interrupted',
            rawFrame,
          );
        }
        return DoneEvent(messageId: messageId, interrupted: interrupted);
    }

    // Unknown event type — skip silently (forward-compat for future event
    // kinds added in later slices). This is intentionally distinct from
    // malformed parsing, which is surfaced as a decoder error.
    return null;
  }
}

class _FrameBoundary {
  const _FrameBoundary({required this.start, required this.end});
  final int start;
  final int end;
}
