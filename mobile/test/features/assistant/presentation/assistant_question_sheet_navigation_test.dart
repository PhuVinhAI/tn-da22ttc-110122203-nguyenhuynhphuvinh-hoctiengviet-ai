import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/assistant/application/assistant_state_machine.dart';
import 'package:linvnix/features/assistant/data/ai_api.dart';
import 'package:linvnix/features/assistant/data/ai_api_provider.dart';
import 'package:linvnix/features/assistant/domain/assistant_state.dart';
import 'package:linvnix/features/assistant/presentation/widgets/assistant_full_screen.dart';
import 'package:linvnix/features/assistant/presentation/widgets/assistant_question_sheet.dart';
import 'package:linvnix/features/assistant/presentation/widgets/conversation_drawer.dart';

void main() {
  testWidgets('sheet pushes FullScreen only on the transition into Full', (
    tester,
  ) async {
    final container = ProviderContainer();
    final observer = _CountingNavigatorObserver();
    final stateMachine = container.read(assistantStateMachineProvider.notifier);

    stateMachine.openBar();

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          navigatorObservers: [observer],
          home: const Scaffold(body: AssistantQuestionSheet()),
        ),
      ),
    );

    stateMachine.enterFull();
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.byType(AssistantFullScreen), findsOneWidget);
    final pushesAfterEnteringFull = observer.pushCount;

    stateMachine.send('hello from full');
    await tester.pump();
    stateMachine.onTextChunk('answer');
    await tester.pump();
    stateMachine.onDone(messageId: 'msg-1', interrupted: false);
    await tester.pump();

    expect(observer.pushCount, pushesAfterEnteringFull);
    expect(
      find.byType(AssistantFullScreen, skipOffstage: false),
      findsOneWidget,
    );

    container.dispose();
  });

  testWidgets('full-screen composer shows Stop while a turn is loading', (
    tester,
  ) async {
    final container = ProviderContainer();
    final stateMachine = container.read(assistantStateMachineProvider.notifier);

    stateMachine.openBar();
    stateMachine.enterFull();
    stateMachine.send('hello from full');

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const AssistantFullScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.byIcon(Icons.stop_rounded), findsOneWidget);
    expect(find.byIcon(Icons.send), findsNothing);

    container.dispose();
  });

  testWidgets('full-screen menu opens the conversation drawer', (tester) async {
    final fixture = _FullScreenFixture();
    await fixture.pump(tester);

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();

    expect(find.byType(ConversationDrawer), findsOneWidget);
    expect(find.text('Xin chao'), findsOneWidget);
    expect(tester.takeException(), isNull);

    fixture.dispose();
  });

  testWidgets('full-screen drawer can close without exiting Full', (
    tester,
  ) async {
    final fixture = _FullScreenFixture();
    await fixture.pump(tester);

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    expect(find.byType(ConversationDrawer), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.byType(ConversationDrawer), findsNothing);
    expect(find.byType(AssistantFullScreen), findsOneWidget);
    expect(
      fixture.container.read(assistantStateMachineProvider),
      isA<AssistantFull>(),
    );
    expect(tester.takeException(), isNull);

    fixture.dispose();
  });

  testWidgets('full-screen stop keeps the local turn visible until reload', (
    tester,
  ) async {
    final fixture = _FullScreenStopFixture();
    await fixture.pump(tester);

    await tester.enterText(find.byType(TextField).last, 'Hello');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump();
    fixture.adapter.startStreaming();

    expect(find.text('Hello'), findsOneWidget);
    expect(find.byIcon(Icons.stop_rounded), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 30));
    expect(find.text('partial answer'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.stop_rounded));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Hello'), findsOneWidget);
    expect(find.text('partial answer'), findsOneWidget);
    expect(find.text('Stopped'), findsOneWidget);

    fixture.dispose();
  });

  testWidgets('full-screen stop from loading does not show empty fallback', (
    tester,
  ) async {
    final fixture = _FullScreenStopFixture();
    await fixture.pump(tester);

    await tester.enterText(find.byType(TextField).last, 'Hello');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump();
    fixture.adapter.startLoadingOnly();

    await tester.pump(const Duration(milliseconds: 30));
    await tester.tap(find.byIcon(Icons.stop_rounded));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Hello'), findsOneWidget);
    expect(find.text('Stopped'), findsOneWidget);
    expect(find.text('_(no response)_'), findsNothing);

    fixture.dispose();
  });
}

class _CountingNavigatorObserver extends NavigatorObserver {
  int pushCount = 0;

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    pushCount++;
    super.didPush(route, previousRoute);
  }
}

class _FullScreenFixture {
  _FullScreenFixture() {
    dio.httpClientAdapter = _JsonAdapter((options) {
      if (options.path == '/ai/conversations') {
        return {
          'data': [
            {
              'id': 'conv-1',
              'title': 'Xin chao',
              'updatedAt': '2026-05-19T03:00:00.000Z',
            },
          ],
          'total': 1,
        };
      }
      return <String, dynamic>{};
    });
    container = ProviderContainer(
      overrides: [aiApiProvider.overrideWithValue(AiApi(dio))],
    );

    final stateMachine = container.read(assistantStateMachineProvider.notifier);
    stateMachine.openBar();
    stateMachine.enterFull();
  }

  final dio = Dio(BaseOptions(baseUrl: 'https://test.local'));
  late final ProviderContainer container;

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const AssistantFullScreen(),
        ),
      ),
    );
  }

  void dispose() {
    dio.close(force: true);
    container.dispose();
  }
}

class _FullScreenStopFixture {
  _FullScreenStopFixture() {
    adapter = _FullScreenStreamAdapter();
    dio.httpClientAdapter = adapter;
    container = ProviderContainer(
      overrides: [aiApiProvider.overrideWithValue(AiApi(dio))],
    );

    final stateMachine = container.read(assistantStateMachineProvider.notifier);
    stateMachine.openBar();
    stateMachine.enterFull();
  }

  final dio = Dio(BaseOptions(baseUrl: 'https://test.local'));
  late final ProviderContainer container;
  late final _FullScreenStreamAdapter adapter;

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          theme: AppTheme.light(),
          home: const AssistantFullScreen(),
        ),
      ),
    );
    await tester.pump();

    adapter.prepare();
  }

  void dispose() {
    dio.close(force: true);
    container.dispose();
  }
}

class _JsonAdapter implements HttpClientAdapter {
  _JsonAdapter(this._handler);

  final Map<String, dynamic> Function(RequestOptions options) _handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final json = jsonEncode(_handler(options));
    return ResponseBody.fromString(
      json,
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _FullScreenStreamAdapter implements HttpClientAdapter {
  late StreamController<List<int>> controller;
  final List<RequestOptions> capturedRequests = [];

  void prepare() {
    controller = StreamController<List<int>>();
  }

  void startStreaming() {
    scheduleMicrotask(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      controller
        ..add(
          utf8.encode(
            'event: conversation_started\ndata: {"conversationId":"conv-stop"}\n\n',
          ),
        )
        ..add(
          utf8.encode('event: text_chunk\ndata: {"text":"partial answer"}\n\n'),
        );
    });
  }

  void startLoadingOnly() {
    scheduleMicrotask(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
      controller.add(
        utf8.encode(
          'event: conversation_started\ndata: {"conversationId":"conv-stop"}\n\n',
        ),
      );
    });
  }

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    capturedRequests.add(options);
    cancelFuture?.then((_) {
      if (!controller.isClosed) controller.close();
    });
    return ResponseBody(
      controller.stream.map((bytes) => Uint8List.fromList(bytes)),
      200,
      headers: {
        Headers.contentTypeHeader: ['text/event-stream'],
      },
    );
  }

  @override
  void close({bool force = false}) {
    if (!controller.isClosed) controller.close();
  }
}
