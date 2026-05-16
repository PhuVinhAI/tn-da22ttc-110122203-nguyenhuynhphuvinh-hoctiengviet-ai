import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/domain/assistant_event.dart';
import 'package:linvnix/features/assistant/domain/sse_event_decoder.dart';

/// Encodes a single SSE frame in the wire format produced by NestJS's
/// `@Sse()` runtime (`event: <type>\ndata: <json>\n\n`). Tests rely on this
/// helper to produce byte chunks that mirror real backend output.
List<int> _frame(String type, Map<String, dynamic> data) {
  final body = 'event: $type\ndata: ${jsonEncode(data)}\n\n';
  return utf8.encode(body);
}

int _indexOfSubsequence(List<int> haystack, List<int> needle) {
  for (var i = 0; i <= haystack.length - needle.length; i++) {
    var match = true;
    for (var j = 0; j < needle.length; j++) {
      if (haystack[i + j] != needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

void main() {
  group('SseEventDecoder', () {
    late SseEventDecoder decoder;

    setUp(() {
      decoder = SseEventDecoder();
    });

    test('decodes a single complete event delivered in one byte chunk',
        () async {
      final source = Stream<List<int>>.fromIterable([
        _frame('text_chunk', {'text': 'Bạn có thể '}),
      ]);

      final events = await decoder.decode(source).toList();

      expect(events, hasLength(1));
      expect(events.single, isA<TextChunkEvent>());
      expect((events.single as TextChunkEvent).text, 'Bạn có thể ');
    });

    test(
      'tolerates a single event split across two byte chunks (no event '
      'emitted before the frame boundary arrives)',
      () async {
        final full = _frame('text_chunk', {'text': 'streaming response'});
        // Split the frame mid-payload — the first chunk does NOT contain
        // the trailing '\n\n' so the decoder must hold it in the buffer.
        final split = full.length ~/ 2;
        final source = Stream<List<int>>.fromIterable([
          full.sublist(0, split),
          full.sublist(split),
        ]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect(events.single, isA<TextChunkEvent>());
        expect(
          (events.single as TextChunkEvent).text,
          'streaming response',
        );
      },
    );

    test(
      'concatenates multiple data: lines per the SSE spec before JSON-decoding',
      () async {
        // Per the SSE spec, multiple `data:` lines in a single event are
        // joined with '\n' before parsing. This payload is INVALID as
        // standalone JSON on either line — it only becomes valid once
        // joined, so it pins the join behavior in.
        final raw = 'event: text_chunk\n'
            'data: {"text":\n'
            'data: "joined value"}\n'
            '\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect(events.single, isA<TextChunkEvent>());
        expect(
          (events.single as TextChunkEvent).text,
          'joined value',
        );
      },
    );

    test(
      'tolerates a Windows-style \\r\\n\\r\\n frame delimiter',
      () async {
        final raw = 'event: text_chunk\r\n'
            'data: {"text":"hi"}\r\n'
            '\r\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect((events.single as TextChunkEvent).text, 'hi');
      },
    );

    test(
      'decodes every protocol event in a single mixed stream',
      () async {
        final body = [
          _frame('conversation_started', {'conversationId': 'conv-1'}),
          _frame('tool_start', {
            'name': 'get_user_summary',
            'displayName': 'Đang tóm tắt thông tin của bạn...',
            'args': {},
          }),
          _frame('tool_result', {'name': 'get_user_summary', 'ok': true}),
          _frame('text_chunk', {'text': 'Bạn đã học '}),
          _frame('text_chunk', {'text': 'liên tục 3 ngày.'}),
          _frame('propose', {
            'kind': 'create_daily_goal',
            'title': 'Tạo mục tiêu hằng ngày?',
            'description': 'Học 30 phút mỗi ngày',
            'endpoint': 'POST /daily-goals',
            'payload': {'goalType': 'STUDY_MINUTES', 'targetValue': 30},
          }),
          _frame('error', {'code': 'AI_X', 'message': 'broken'}),
          _frame('done', {'messageId': 'msg-1', 'interrupted': false}),
        ].expand((bytes) => bytes).toList();
        final source = Stream<List<int>>.fromIterable([body]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(8));
        expect(events[0], isA<ConversationStartedEvent>());
        expect(
          (events[0] as ConversationStartedEvent).conversationId,
          'conv-1',
        );
        expect(events[1], isA<ToolStartEvent>());
        expect(events[2], isA<ToolResultEvent>());
        expect(events[3], isA<TextChunkEvent>());
        expect(events[4], isA<TextChunkEvent>());
        expect(events[5], isA<ProposeEvent>());
        expect((events[5] as ProposeEvent).kind, 'create_daily_goal');
        expect(events[6], isA<AssistantErrorEvent>());
        expect((events[6] as AssistantErrorEvent).code, 'AI_X');
        expect(events[7], isA<DoneEvent>());
        expect((events[7] as DoneEvent).messageId, 'msg-1');
        expect((events[7] as DoneEvent).interrupted, isFalse);
      },
    );

    test(
      'surfaces a malformed JSON payload as a decoder error (not silent drop)',
      () async {
        final raw = 'event: text_chunk\n'
            'data: {not valid json}\n'
            '\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        await expectLater(
          decoder.decode(source),
          emitsInOrder([
            emitsError(isA<SseDecoderException>()),
            emitsDone,
          ]),
        );
      },
    );

    test(
      'surfaces a frame missing the event: line as a decoder error',
      () async {
        final raw = 'data: {"text":"hi"}\n\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        await expectLater(
          decoder.decode(source),
          emitsInOrder([
            emitsError(isA<SseDecoderException>()),
            emitsDone,
          ]),
        );
      },
    );

    test(
      'surfaces a typed event missing required fields as a decoder error',
      () async {
        // text_chunk requires `text`, which is missing here.
        final raw = 'event: text_chunk\ndata: {"other":"value"}\n\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        await expectLater(
          decoder.decode(source),
          emitsInOrder([
            emitsError(isA<SseDecoderException>()),
            emitsDone,
          ]),
        );
      },
    );

    test(
      'silently skips an unknown event type (forward compat with future '
      'event kinds added in later slices)',
      () async {
        final raw =
            'event: future_event\ndata: {"any":"thing"}\n\n${utf8.decode(_frame('text_chunk', {
              'text': 'real',
            }))}';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect((events.single as TextChunkEvent).text, 'real');
      },
    );

    test(
      'ignores SSE comment lines (those starting with ":")',
      () async {
        final raw = ': keep-alive ping\n'
            'event: text_chunk\n'
            'data: {"text":"after ping"}\n'
            '\n';
        final source = Stream<List<int>>.fromIterable([utf8.encode(raw)]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect((events.single as TextChunkEvent).text, 'after ping');
      },
    );

    test(
      'reassembles a multi-byte UTF-8 character split across two byte chunks',
      () async {
        // The character 'ầ' is U+1EA7 → bytes E1 BA A7 (3 bytes). Split the
        // chunk mid-character so the first chunk ends with a partial code
        // point and only the second chunk completes it.
        final body = _frame('text_chunk', {'text': 'a ầ b'});
        // Find a split index inside the 3-byte sequence for 'ầ'.
        final marker = utf8.encode('ầ');
        final markerStart = _indexOfSubsequence(body, marker);
        expect(markerStart, greaterThan(0));
        final splitAt = markerStart + 1; // mid-character

        final source = Stream<List<int>>.fromIterable([
          body.sublist(0, splitAt),
          body.sublist(splitAt),
        ]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(1));
        expect((events.single as TextChunkEvent).text, 'a ầ b');
      },
    );

    test(
      'emits two events when two complete frames arrive in a single chunk',
      () async {
        final body =
            '${utf8.decode(_frame('tool_start', {
                  'name': 'search_vocabulary',
                  'displayName': 'Đang tra cứu từ vựng...',
                  'args': {'query': 'xin chào'},
                }))}'
            '${utf8.decode(_frame('tool_result', {
                  'name': 'search_vocabulary',
                  'ok': true,
                }))}';
        final source = Stream<List<int>>.fromIterable([utf8.encode(body)]);

        final events = await decoder.decode(source).toList();

        expect(events, hasLength(2));
        expect(events[0], isA<ToolStartEvent>());
        expect((events[0] as ToolStartEvent).displayName,
            'Đang tra cứu từ vựng...');
        expect(events[1], isA<ToolResultEvent>());
        expect((events[1] as ToolResultEvent).ok, isTrue);
      },
    );
  });
}
