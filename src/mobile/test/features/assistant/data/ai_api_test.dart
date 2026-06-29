import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/ai_api.dart';
import 'package:linvnix/features/assistant/domain/assistant_event.dart';
import 'package:linvnix/features/assistant/domain/screen_context.dart';

/// Fake `HttpClientAdapter` that lets the test script a streaming SSE
/// byte sequence and observe the request that Dio sends. Mirrors the
/// "stub Dio adapter" option called out in the slice acceptance
/// criteria so the test doesn't need a real HTTP server.
class _FakeStreamingAdapter implements HttpClientAdapter {
  _FakeStreamingAdapter({
    required this.controller,
    this.statusCode = 200,
    this.contentType = 'text/event-stream',
  });

  final StreamController<List<int>> controller;
  final int statusCode;
  final String contentType;
  final List<RequestOptions> capturedRequests = [];

  bool _closed = false;
  bool get closed => _closed;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    capturedRequests.add(options);

    cancelFuture?.then((_) {
      _closed = true;
      if (!controller.isClosed) controller.close();
    });

    return ResponseBody(
      controller.stream.map((c) => Uint8List.fromList(c)),
      statusCode,
      headers: {
        'content-type': [contentType],
      },
    );
  }

  @override
  void close({bool force = false}) {
    _closed = true;
    if (!controller.isClosed) controller.close();
  }
}

List<int> _frame(String type, Map<String, dynamic> data) =>
    utf8.encode('event: $type\ndata: ${jsonEncode(data)}\n\n');

void main() {
  group('AiApi.chatStream (integration via stub Dio adapter)', () {
    late StreamController<List<int>> wireController;
    late _FakeStreamingAdapter adapter;
    late Dio dio;
    late AiApi api;

    setUp(() {
      wireController = StreamController<List<int>>();
      adapter = _FakeStreamingAdapter(controller: wireController);
      dio = Dio(BaseOptions(baseUrl: 'https://test.local'));
      dio.httpClientAdapter = adapter;
      api = AiApi(dio);
    });

    tearDown(() async {
      if (!wireController.isClosed) await wireController.close();
      dio.close(force: true);
    });

    test(
      'emits a scripted SSE byte stream as decoded AssistantEvents in order',
      () async {
        scheduleMicrotask(() {
          wireController
            ..add(_frame('conversation_started', {'conversationId': 'conv-1'}))
            ..add(_frame('tool_start', {
              'name': 'get_user_summary',
              'displayName': 'Đang tóm tắt thông tin của bạn...',
              'args': {},
            }))
            ..add(_frame('tool_result', {
              'name': 'get_user_summary',
              'ok': true,
            }))
            ..add(_frame('text_chunk', {'text': 'Streak 3 ngày.'}))
            ..add(_frame('done', {
              'messageId': 'msg-1',
              'interrupted': false,
            }));
          wireController.close();
        });

        final events = await api
            .chatStream(message: 'How am I doing?')
            .toList();

        expect(events, hasLength(5));
        expect(events[0], isA<ConversationStartedEvent>());
        expect(
          (events[0] as ConversationStartedEvent).conversationId,
          'conv-1',
        );
        expect(events[1], isA<ToolStartEvent>());
        expect(
          (events[1] as ToolStartEvent).displayName,
          'Đang tóm tắt thông tin của bạn...',
        );
        expect(events[2], isA<ToolResultEvent>());
        expect(events[3], isA<TextChunkEvent>());
        expect(events[4], isA<DoneEvent>());
      },
    );

    test(
      'POSTs to /ai/chat/stream with message, conversationId, screenContext',
      () async {
        scheduleMicrotask(() {
          wireController
            ..add(_frame('done', {
              'messageId': 'msg-1',
              'interrupted': false,
            }))
            ..close();
        });

        await api
            .chatStream(
              message: 'Hỏi tiếp',
              conversationId: 'conv-prev',
              screenContext: const ScreenContext(
                route: '/lessons/abc',
                displayName: 'Bài học: Chào hỏi',
                barPlaceholder: 'Hỏi về bài học?',
                data: {'lessonId': 'abc'},
              ),
            )
            .toList();

        expect(adapter.capturedRequests, hasLength(1));
        final req = adapter.capturedRequests.single;
        expect(req.path, '/ai/chat/stream');
        expect(req.method.toUpperCase(), 'POST');
        expect(req.responseType, ResponseType.stream);
        expect(req.headers['Accept'], 'text/event-stream');

        final body = req.data as Map<String, dynamic>;
        expect(body['message'], 'Hỏi tiếp');
        expect(body['conversationId'], 'conv-prev');
        final sc = body['screenContext'] as Map<String, dynamic>;
        expect(sc['route'], '/lessons/abc');
        expect(sc['displayName'], 'Bài học: Chào hỏi');
        expect(sc['barPlaceholder'], 'Hỏi về bài học?');
        expect(sc['data'], {'lessonId': 'abc'});
      },
    );

    test(
      'omits conversationId from the request body when null '
      '(server lazy-creates a new Conversation)',
      () async {
        scheduleMicrotask(() {
          wireController
            ..add(_frame('done', {
              'messageId': 'm',
              'interrupted': false,
            }))
            ..close();
        });

        await api.chatStream(message: 'first message').toList();

        final body = adapter.capturedRequests.single.data
            as Map<String, dynamic>;
        expect(body.containsKey('conversationId'), isFalse);
        expect(body.containsKey('screenContext'), isFalse);
      },
    );

    test(
      'cancelling the CancelToken aborts the stream cleanly without '
      'leaking pending events',
      () async {
        final cancelToken = CancelToken();

        // Push the first two events, then "stall" the server — no more
        // bytes until we cancel.
        scheduleMicrotask(() {
          wireController
            ..add(_frame('conversation_started', {'conversationId': 'c1'}))
            ..add(_frame('text_chunk', {'text': 'partial'}));
        });

        final emitted = <AssistantEvent>[];
        Object? captured;
        final sub = api
            .chatStream(message: 'q', cancelToken: cancelToken)
            .listen(
          emitted.add,
          onError: (Object e) {
            captured = e;
          },
        );

        // Wait for the first two events to make it through the decoder.
        await Future<void>.delayed(const Duration(milliseconds: 50));
        expect(emitted, hasLength(2));

        cancelToken.cancel('user pressed Stop');

        // Give the cancellation a microtask tick to propagate.
        await Future<void>.delayed(const Duration(milliseconds: 50));

        await sub.cancel();

        expect(emitted, hasLength(2),
            reason: 'no further events after cancellation');
        // Cancellation may surface as a DioException (CancelToken kind) on
        // the stream's error channel — that's acceptable; what matters is
        // that the stream stops emitting AssistantEvents.
        if (captured != null) {
          expect(captured, isA<DioException>());
        }
      },
    );

    test(
      'maps a pre-stream HTTP error (e.g. 500) to a DioException so the '
      'caller can surface a pre-token error',
      () async {
        adapter = _FakeStreamingAdapter(
          controller: wireController,
          statusCode: 500,
          contentType: 'application/json',
        );
        dio.httpClientAdapter = adapter;
        // No bytes — server "errored" before sending any.
        scheduleMicrotask(() => wireController.close());

        await expectLater(
          () => api.chatStream(message: 'q').toList(),
          throwsA(isA<DioException>()),
        );
      },
    );
  });
}
