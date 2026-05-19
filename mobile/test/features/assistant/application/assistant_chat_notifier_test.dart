import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/application/assistant_chat_notifier.dart';
import 'package:linvnix/features/assistant/application/assistant_state_machine.dart';
import 'package:linvnix/features/assistant/data/ai_api.dart';
import 'package:linvnix/features/assistant/data/ai_api_provider.dart';
import 'package:linvnix/features/assistant/data/route_match.dart';
import 'package:linvnix/features/assistant/data/screen_context_provider.dart';
import 'package:linvnix/features/assistant/data/screen_ui_snapshot_provider.dart';
import 'package:linvnix/features/assistant/domain/assistant_state.dart';

/// Fake Dio adapter wired to a `StreamController<List<int>>` that the
/// test scripts at will. Lets us drive [AiApi.chatStream] through the
/// real decoder without a live HTTP server.
class _FakeStreamingAdapter implements HttpClientAdapter {
  _FakeStreamingAdapter();

  final int statusCode = 200;
  late StreamController<List<int>> controller;
  final List<RequestOptions> capturedRequests = [];
  Completer<void>? _completer;

  /// Resets to a fresh in-progress stream. Call this before each request
  /// the test expects to issue.
  void prepareNext() {
    controller = StreamController<List<int>>();
    _completer = Completer<void>();
  }

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    capturedRequests.add(options);
    // Capture the per-request controller so rapid-send tests can swap
    // `adapter.controller` to a fresh instance for the next request
    // without cancellation of THIS request accidentally closing it.
    final c = controller;
    final completer = _completer;
    cancelFuture?.then((_) {
      if (!c.isClosed) c.close();
      if (completer != null && !completer.isCompleted) completer.complete();
    });
    return ResponseBody(
      c.stream.map((bytes) => Uint8List.fromList(bytes)),
      statusCode,
      headers: {
        'content-type': ['text/event-stream'],
      },
    );
  }

  @override
  void close({bool force = false}) {
    if (!controller.isClosed) controller.close();
  }
}

List<int> _frame(String type, Map<String, dynamic> data) =>
    utf8.encode('event: $type\ndata: ${jsonEncode(data)}\n\n');

void main() {
  late _FakeStreamingAdapter adapter;
  late Dio dio;
  late AiApi api;
  late ProviderContainer container;
  late AssistantChatNotifier notifier;

  setUp(() {
    adapter = _FakeStreamingAdapter()..prepareNext();
    dio = Dio(BaseOptions(baseUrl: 'https://test.local'));
    dio.httpClientAdapter = adapter;
    api = AiApi(dio);

    container = ProviderContainer(
      overrides: [aiApiProvider.overrideWithValue(api)],
    );
    notifier = container.read(assistantChatNotifierProvider);
  });

  tearDown(() async {
    await notifier.dispose();
    dio.close(force: true);
    container.dispose();
  });

  /// Helper that scripts the typical 4-event happy-path stream then
  /// closes the connection.
  void scriptHappyPath({
    String conversationId = 'conv-1',
    String messageId = 'msg-1',
    String text = 'Bạn đang học rất tốt!',
  }) {
    scheduleMicrotask(() async {
      // Give the request a tick to land on the adapter.
      await Future<void>.delayed(const Duration(milliseconds: 10));
      adapter.controller
        ..add(
          _frame('conversation_started', {'conversationId': conversationId}),
        )
        ..add(_frame('text_chunk', {'text': text}))
        ..add(_frame('done', {'messageId': messageId, 'interrupted': false}));
      await adapter.controller.close();
    });
  }

  Future<void> waitFor(
    bool Function() condition, {
    Duration timeout = const Duration(seconds: 2),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      if (condition()) return;
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    expect(condition(), isTrue);
  }

  test(
    'first send creates a new Conversation (conversationId not sent in body) '
    'and persists the server-assigned id',
    () async {
      scriptHappyPath(conversationId: 'conv-new-1');
      notifier.openBar();
      await notifier.sendMessage('How am I doing?');
      await waitFor(() => notifier.conversationIdForTesting == 'conv-new-1');

      expect(adapter.capturedRequests, hasLength(1));
      final body = adapter.capturedRequests.single.data as Map<String, dynamic>;
      expect(body.containsKey('conversationId'), isFalse);
      expect(body['message'], 'How am I doing?');
      expect(notifier.conversationIdForTesting, 'conv-new-1');
    },
  );

  test(
    'Soạn tiếp keeps the conversationId; the follow-up send reuses it',
    () async {
      scriptHappyPath(conversationId: 'conv-keep');
      notifier.openBar();
      await notifier.sendMessage('first');
      await waitFor(() => notifier.conversationIdForTesting == 'conv-keep');

      notifier.composeAgain();

      adapter.prepareNext();
      scriptHappyPath(conversationId: 'conv-keep', messageId: 'msg-2');
      await notifier.sendMessage('second');
      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidReading && s.messageId == 'msg-2';
      });

      expect(adapter.capturedRequests, hasLength(2));
      final secondBody =
          adapter.capturedRequests[1].data as Map<String, dynamic>;
      expect(secondBody['conversationId'], 'conv-keep');
      expect(notifier.conversationIdForTesting, 'conv-keep');
    },
  );

  test(
    'Full mode sends a follow-up through the active conversation and stays Full',
    () async {
      scriptHappyPath(conversationId: 'conv-full', messageId: 'msg-1');
      notifier.openBar();
      await notifier.sendMessage('first');
      await waitFor(() => notifier.conversationIdForTesting == 'conv-full');

      notifier.enterFull();

      adapter.prepareNext();
      scriptHappyPath(
        conversationId: 'conv-full',
        messageId: 'msg-2',
        text: 'full answer',
      );
      await notifier.sendMessage('second from full');
      await waitFor(() {
        final state = container.read(assistantStateMachineProvider);
        final turn = state is AssistantFull ? state.priorState : null;
        return turn is AssistantMidReading && turn.messageId == 'msg-2';
      });

      expect(adapter.capturedRequests, hasLength(2));
      final secondBody =
          adapter.capturedRequests[1].data as Map<String, dynamic>;
      expect(secondBody['conversationId'], 'conv-full');
      expect(secondBody['message'], 'second from full');
      expect(notifier.conversationIdForTesting, 'conv-full');

      final fullState =
          container.read(assistantStateMachineProvider) as AssistantFull;
      final turn = fullState.priorState as AssistantMidReading;
      expect(turn.partial, 'full answer');
      expect(turn.isDone, isTrue);
      expect(turn.messageId, 'msg-2');
    },
  );

  test(
    'collapse callback from the dismissed Mid sheet is ignored after entering Full',
    () async {
      scriptHappyPath(conversationId: 'conv-full', messageId: 'msg-1');
      notifier.openBar();
      await notifier.sendMessage('first');
      await waitFor(() => notifier.conversationIdForTesting == 'conv-full');

      notifier.enterFull();
      await notifier.collapse();

      expect(notifier.conversationIdForTesting, 'conv-full');
      expect(
        container.read(assistantStateMachineProvider),
        isA<AssistantFull>(),
      );
    },
  );

  test('exitFull collapses and is ignored after the first close request', () {
    notifier.openBar();
    notifier.enterFull();

    expect(notifier.exitFull(), isTrue);
    expect(
      container.read(assistantStateMachineProvider),
      isA<AssistantCollapsed>(),
    );
    expect(notifier.conversationIdForTesting, isNull);

    expect(notifier.exitFull(), isFalse);
    expect(
      container.read(assistantStateMachineProvider),
      isA<AssistantCollapsed>(),
    );
  });

  test('Reset drops the conversationId so the next send creates a new '
      'Conversation with the now-current screenContext', () async {
    scriptHappyPath(conversationId: 'conv-A');
    notifier.openBar();
    await notifier.sendMessage('first on screen A');
    await waitFor(() => notifier.conversationIdForTesting == 'conv-A');

    // Simulate route change → currentScreenContextProvider re-resolves.
    // Because we don't register any builders, the fallback uses
    // location for displayName, which is fine for assertion.
    container
        .read(currentRouteMatchProvider.notifier)
        .update(
          const RouteMatch(
            routePattern: '/lessons/:id',
            location: '/lessons/xyz',
            pathParameters: {'id': 'xyz'},
          ),
        );

    await notifier.reset();
    expect(notifier.conversationIdForTesting, isNull);

    adapter.prepareNext();
    scriptHappyPath(conversationId: 'conv-B');
    await notifier.sendMessage('second on screen B');
    await waitFor(() => notifier.conversationIdForTesting == 'conv-B');

    expect(adapter.capturedRequests, hasLength(2));
    final secondBody = adapter.capturedRequests[1].data as Map<String, dynamic>;
    expect(
      secondBody.containsKey('conversationId'),
      isFalse,
      reason:
          'Reset must drop conversationId so the server creates a '
          'fresh Conversation with the current screenContext',
    );
    final screenContext = secondBody['screenContext'] as Map<String, dynamic>;
    expect(screenContext['route'], '/lessons/xyz');
    expect(notifier.conversationIdForTesting, 'conv-B');
  });

  test('sendMessage omits uiSnapshot from the API payload on domain routes',
      () async {
    container.read(currentRouteMatchProvider.notifier).update(
          const RouteMatch(routePattern: '/', location: '/'),
        );
    container.read(currentScreenUiSnapshotProvider.notifier).update(const {
      'texts': ['Trợ lý AI · Trang chủ'],
      'structure': {'type': 'Column'},
    });

    scriptHappyPath();
    notifier.openBar();
    await notifier.sendMessage('chào');
    await waitFor(() => adapter.capturedRequests.isNotEmpty);

    final body = adapter.capturedRequests.first.data as Map<String, dynamic>;
    final data =
        (body['screenContext'] as Map<String, dynamic>)['data']
            as Map<String, dynamic>;

    expect(data['screenType'], 'home');
    expect(data.containsKey('uiSnapshot'), isFalse);
  });

  test('rapid send: a second sendMessage cancels the in-flight stream without '
      'emitting an error to the state machine', () async {
    // First send — emit conversation_started + first text_chunk, then
    // stall (don't close).
    scheduleMicrotask(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      adapter.controller
        ..add(_frame('conversation_started', {'conversationId': 'c1'}))
        ..add(_frame('text_chunk', {'text': 'in flight'}));
    });

    notifier.openBar();
    final firstSend = notifier.sendMessage('first');
    await waitFor(() {
      final s = container.read(assistantStateMachineProvider);
      return s is AssistantMidReading && s.streaming;
    });

    // We should be in MidReading(streaming) at this point.
    final midStream = container.read(assistantStateMachineProvider);
    expect(midStream, isA<AssistantMidReading>());
    expect((midStream as AssistantMidReading).streaming, isTrue);

    // Now issue a rapid second send.
    adapter.prepareNext();
    scriptHappyPath(conversationId: 'c1', messageId: 'msg-2');
    await notifier.sendMessage('second');
    await waitFor(() {
      final s = container.read(assistantStateMachineProvider);
      return s is AssistantMidReading && s.messageId == 'msg-2';
    });

    // Done with the original send future too.
    await firstSend;

    expect(adapter.capturedRequests, hasLength(2));
    final finalState =
        container.read(assistantStateMachineProvider) as AssistantMidReading;
    expect(
      finalState.streaming,
      isFalse,
      reason: 'second stream must reach done',
    );
    expect(finalState.interrupted, isFalse);
  });

  test('pre-token error transitions to MidError; retry re-issues the same '
      'message', () async {
    // Don't send any events — close the stream after emitting an
    // `error` frame, which decodes to AssistantErrorEvent.
    scheduleMicrotask(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      adapter.controller.add(
        _frame('error', {'code': 'AI_X', 'message': 'Server fell over'}),
      );
      await adapter.controller.close();
    });

    notifier.openBar();
    await notifier.sendMessage('please answer');
    await waitFor(
      () => container.read(assistantStateMachineProvider) is AssistantMidError,
    );

    final errState =
        container.read(assistantStateMachineProvider) as AssistantMidError;
    expect(errState.message, 'Server fell over');
    expect(errState.lastInput, 'please answer');

    adapter.prepareNext();
    scriptHappyPath(conversationId: 'c-retry');
    await notifier.retry();
    await waitFor(
      () =>
          container.read(assistantStateMachineProvider) is AssistantMidReading,
    );

    expect(adapter.capturedRequests, hasLength(2));
    final retryBody = adapter.capturedRequests[1].data as Map<String, dynamic>;
    expect(retryBody['message'], 'please answer');
    final final_ =
        container.read(assistantStateMachineProvider) as AssistantMidReading;
    expect(final_.isDone, isTrue);
  });

  test(
    'tool loading status survives tool_result until the first text chunk',
    () async {
      const displayName = 'Đang tra cứu từ vựng...';

      scheduleMicrotask(() async {
        await Future<void>.delayed(const Duration(milliseconds: 10));
        adapter.controller
          ..add(_frame('conversation_started', {'conversationId': 'c-tool'}))
          ..add(
            _frame('tool_start', {
              'name': 'search_vocabulary',
              'displayName': displayName,
              'args': {'query': 'xin chào'},
            }),
          )
          ..add(
            _frame('tool_result', {'name': 'search_vocabulary', 'ok': true}),
          );
      });

      notifier.openBar();
      await notifier.sendMessage('xin chào nghĩa là gì?');
      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidLoading && s.statusText == displayName;
      });

      final loading =
          container.read(assistantStateMachineProvider) as AssistantMidLoading;
      expect(loading.statusText, displayName);

      adapter.controller
        ..add(_frame('text_chunk', {'text': 'Xin chào means hello.'}))
        ..add(_frame('done', {'messageId': 'msg-tool', 'interrupted': false}));
      await adapter.controller.close();

      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidReading && s.messageId == 'msg-tool';
      });
      await Future<void>.delayed(const Duration(milliseconds: 30));
    },
  );

  test(
    'Stop tapped mid-stream cancels Dio and transitions to interrupted done',
    () async {
      scheduleMicrotask(() async {
        await Future<void>.delayed(const Duration(milliseconds: 10));
        adapter.controller
          ..add(_frame('conversation_started', {'conversationId': 'c1'}))
          ..add(_frame('text_chunk', {'text': 'partial'}));
        // Stall — don't close. The Stop call below should propagate to
        // adapter.controller via cancelFuture.
      });

      notifier.openBar();
      final pending = notifier.sendMessage('q');
      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidReading && s.partial == 'partial';
      });

      notifier.stop();
      await Future<void>.delayed(const Duration(milliseconds: 30));

      final s =
          container.read(assistantStateMachineProvider) as AssistantMidReading;
      expect(s.isDone, isTrue);
      expect(s.interrupted, isTrue);
      expect(s.partial, 'partial');

      await pending;
    },
  );

  test(
    'text before tool streams immediately and tool loading is inline',
    () async {
      scheduleMicrotask(() async {
        await Future<void>.delayed(const Duration(milliseconds: 10));
        adapter.controller
          ..add(_frame('conversation_started', {'conversationId': 'c-inline'}))
          ..add(_frame('text_chunk', {'text': 'Để tôi kiểm tra '}));

        await Future<void>.delayed(const Duration(milliseconds: 10));
        adapter.controller.add(
          _frame('tool_start', {
            'name': 'search_vocabulary',
            'displayName': 'Đang tra cứu từ vựng...',
            'args': {'query': 'xin chào'},
          }),
        );

        await Future<void>.delayed(const Duration(milliseconds: 50));
        adapter.controller
          ..add(
            _frame('tool_result', {'name': 'search_vocabulary', 'ok': true}),
          )
          ..add(_frame('text_chunk', {'text': 'xong rồi.'}))
          ..add(
            _frame('done', {'messageId': 'msg-inline', 'interrupted': false}),
          );
        await adapter.controller.close();
      });

      notifier.openBar();
      await notifier.sendMessage('xin chào nghĩa là gì?');
      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidReading && s.toolStatusText != null;
      });

      var reading =
          container.read(assistantStateMachineProvider) as AssistantMidReading;
      expect(reading.partial, 'Để tôi kiểm tra ');
      expect(reading.toolStatusText, 'Đang tra cứu từ vựng...');

      await waitFor(() {
        final s = container.read(assistantStateMachineProvider);
        return s is AssistantMidReading && s.isDone;
      });
      reading =
          container.read(assistantStateMachineProvider) as AssistantMidReading;
      expect(reading.partial, 'Để tôi kiểm tra xong rồi.');
      expect(reading.toolStatusText, isNull);
      expect(reading.isDone, isTrue);
    },
  );
}
