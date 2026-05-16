import 'package:dio/dio.dart';

import '../domain/assistant_event.dart';
import '../domain/screen_context.dart';
import '../domain/sse_event_decoder.dart';

/// Thin wrapper around the backend's `POST /api/v1/ai/chat/stream`
/// SSE endpoint. Uses Dio's `ResponseType.stream` so the response body
/// is exposed as a byte stream that the [SseEventDecoder] can consume
/// incrementally.
///
/// Auth is attached by the existing `AuthInterceptor` on the shared
/// Dio instance — this class never touches tokens directly.
class AiApi {
  AiApi(this._dio, {SseEventDecoder? decoder})
      : _decoder = decoder ?? SseEventDecoder();

  final Dio _dio;
  final SseEventDecoder _decoder;

  /// Opens a streaming chat turn. Yields typed [AssistantEvent]s as the
  /// server emits SSE frames; the stream completes when the server
  /// closes the connection (typically after the `done` event).
  ///
  /// When [cancelToken] is cancelled, the underlying Dio request is
  /// aborted and the returned stream stops emitting. The server-side
  /// behavior (saving the partial assistant message with
  /// `interrupted=true`) is contracted by issue #02.
  Stream<AssistantEvent> chatStream({
    required String message,
    String? conversationId,
    ScreenContext? screenContext,
    CancelToken? cancelToken,
  }) async* {
    final body = <String, dynamic>{
      'message': message,
      'conversationId': ?conversationId,
      'screenContext': ?(screenContext == null
          ? null
          : <String, dynamic>{
              'route': screenContext.route,
              'displayName': screenContext.displayName,
              'barPlaceholder': screenContext.barPlaceholder,
              'data': screenContext.data,
            }),
    };

    final response = await _dio.post<ResponseBody>(
      '/ai/chat/stream',
      data: body,
      options: Options(
        responseType: ResponseType.stream,
        headers: const {
          'Accept': 'text/event-stream',
        },
      ),
      cancelToken: cancelToken,
    );

    final byteStream = response.data?.stream;
    if (byteStream == null) {
      return;
    }

    yield* _decoder.decode(byteStream);
  }
}
