import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/providers/providers.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/assistant/domain/assistant_state.dart';
import 'package:linvnix/features/assistant/presentation/widgets/proposal_card.dart';

void main() {
  group('ProposalCard widget', () {
    late _CapturingRestAdapter restAdapter;
    late Dio restDio;

    setUp(() {
      restAdapter = _CapturingRestAdapter();
      restDio = Dio(BaseOptions(baseUrl: 'https://test.local'));
      restDio.httpClientAdapter = restAdapter;
    });

    tearDown(() {
      restDio.close(force: true);
    });

    testWidgets(
      'renders title, description, and buttons; tap Có → POST with '
      'correct path + body → success feedback shown',
      (tester) async {
        final container = ProviderContainer(
          overrides: [
            dioProvider.overrideWithValue(restDio),
          ],
        );

        const proposal = ProposalState(
          kind: 'create_daily_goal',
          title: 'Tạo mục tiêu học 30 phút',
          description: 'Bạn muốn tôi đặt mục tiêu học 30 phút mỗi ngày?',
          endpoint: 'POST /daily-goals',
          payload: {'goalType': 'STUDY_MINUTES', 'targetValue': 30},
          confirmLabel: 'Có',
          declineLabel: 'Không',
        );

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              theme: AppTheme.light(),
              home: Scaffold(
                body: ListView(
                  children: const [
                    ProposalCard(proposal: proposal, index: 0),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pump();

        // Verify the card is rendered.
        expect(find.text('Tạo mục tiêu học 30 phút'), findsOneWidget);
        expect(
          find.text('Bạn muốn tôi đặt mục tiêu học 30 phút mỗi ngày?'),
          findsOneWidget,
        );
        expect(find.text('Có'), findsOneWidget);
        expect(find.text('Không'), findsOneWidget);

        // Tap "Có".
        await tester.tap(find.text('Có'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 50));

        // Verify the REST call was made.
        expect(restAdapter.capturedRequests, hasLength(1));
        final req = restAdapter.capturedRequests.single;
        expect(req.method, 'POST');
        expect(req.path, '/api/v1/daily-goals');
        final body = req.data as Map<String, dynamic>;
        expect(body['goalType'], 'STUDY_MINUTES');
        expect(body['targetValue'], 30);

        // Verify success feedback is shown.
        await tester.pump();
        expect(find.text('Đã tạo mục tiêu!'), findsOneWidget);

        container.dispose();
      },
    );

    testWidgets(
      'decline: tap Không → card dismissed, no REST call',
      (tester) async {
        final container = ProviderContainer(
          overrides: [
            dioProvider.overrideWithValue(restDio),
          ],
        );

        const proposal = ProposalState(
          kind: 'create_daily_goal',
          title: 'Tạo mục tiêu',
          description: 'Mô tả',
          endpoint: 'POST /daily-goals',
          payload: {},
        );

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              theme: AppTheme.light(),
              home: Scaffold(
                body: ListView(
                  children: const [
                    ProposalCard(proposal: proposal, index: 0),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pump();

        // Tap "Không".
        await tester.tap(find.text('Không'));
        await tester.pump();

        // Card should be dismissed — no REST call.
        expect(restAdapter.capturedRequests, isEmpty);

        container.dispose();
      },
    );

    testWidgets(
      'error 422: shows inline error + Thử lại button',
      (tester) async {
        final errorDio = Dio(BaseOptions(baseUrl: 'https://test.local'));
        errorDio.httpClientAdapter = _ErrorRestAdapter(422);

        final container = ProviderContainer(
          overrides: [
            dioProvider.overrideWithValue(errorDio),
          ],
        );

        const proposal = ProposalState(
          kind: 'create_daily_goal',
          title: 'Tạo mục tiêu',
          description: 'Mô tả',
          endpoint: 'POST /daily-goals',
          payload: {},
        );

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              theme: AppTheme.light(),
              home: Scaffold(
                body: ListView(
                  children: const [
                    ProposalCard(proposal: proposal, index: 0),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pump();

        // Tap "Có" to trigger the error.
        await tester.tap(find.text('Có'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 50));

        // Should show error + retry button.
        expect(
          find.text('Lỗi máy chủ (422). Vui lòng thử lại.'),
          findsOneWidget,
        );
        expect(find.text('Thử lại'), findsOneWidget);

        errorDio.close(force: true);
        container.dispose();
      },
    );

    testWidgets(
      'error 403: shows "Không có quyền", no retry button',
      (tester) async {
        final errorDio = Dio(BaseOptions(baseUrl: 'https://test.local'));
        errorDio.httpClientAdapter = _ErrorRestAdapter(403);

        final container = ProviderContainer(
          overrides: [
            dioProvider.overrideWithValue(errorDio),
          ],
        );

        const proposal = ProposalState(
          kind: 'create_daily_goal',
          title: 'Tạo mục tiêu',
          description: 'Mô tả',
          endpoint: 'POST /daily-goals',
          payload: {},
        );

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              theme: AppTheme.light(),
              home: Scaffold(
                body: ListView(
                  children: const [
                    ProposalCard(proposal: proposal, index: 0),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pump();

        await tester.tap(find.text('Có'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 50));

        expect(find.text('Không có quyền'), findsOneWidget);
        expect(find.text('Thử lại'), findsNothing);

        errorDio.close(force: true);
        container.dispose();
      },
    );
  });
}

class _CapturingRestAdapter implements HttpClientAdapter {
  final List<RequestOptions> capturedRequests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    capturedRequests.add(options);
    final body = jsonEncode({'data': {}});
    return ResponseBody(
      Stream.value(utf8.encode(body)),
      200,
      headers: {
        'content-type': ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _ErrorRestAdapter implements HttpClientAdapter {
  _ErrorRestAdapter(this.statusCode);

  final int statusCode;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody(
      Stream.value(utf8.encode(jsonEncode({'message': 'Error'}))),
      statusCode,
      headers: {
        'content-type': ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
