import 'package:dio/dio.dart';

import '../domain/assistant_event.dart';
import '../domain/screen_context.dart';
import '../domain/sse_event_decoder.dart';
import 'conversation_model.dart';

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
        connectTimeout: Duration.zero,
        receiveTimeout: Duration.zero,
        sendTimeout: Duration.zero,
      ),
      cancelToken: cancelToken,
    );

    final byteStream = response.data?.stream;
    if (byteStream == null) {
      return;
    }

    yield* _decoder.decode(byteStream);
  }

  /// Lists conversations for the current user, sorted by updatedAt DESC.
  Future<List<ConversationSummary>> listConversations({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/ai/conversations',
      queryParameters: {'page': '$page', 'limit': '$limit'},
    );
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data
        .map((e) =>
            ConversationSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Gets a single conversation with its messages.
  Future<({
    ConversationSummary conversation,
    List<ConversationMessage> messages,
  })> getConversation(String id) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/ai/conversations/$id');
    final data = response.data!;
    final conversation = ConversationSummary.fromJson(data);
    final messages = (data['messages'] as List<dynamic>? ?? [])
        .map((e) =>
            ConversationMessage.fromJson(e as Map<String, dynamic>))
        .toList();
    return (conversation: conversation, messages: messages);
  }

  /// Renames a conversation.
  Future<void> renameConversation(String id, String title) async {
    await _dio.patch<void>(
      '/ai/conversations/$id',
      data: {'title': title},
    );
  }

  /// Deletes a conversation.
  Future<void> deleteConversation(String id) async {
    await _dio.delete<void>('/ai/conversations/$id');
  }

  /// Hard-deletes the most recent user message in a conversation.
  /// Fire-and-forget safe — a 404 or network error is silently ignored
  /// by the caller since the rollback is best-effort.
  Future<void> deleteLastUserMessage(String conversationId) async {
    await _dio.delete<void>(
      '/ai/conversations/$conversationId/messages/last-user',
    );
  }

  /// Deletes [messageId] and all messages after it in the conversation.
  /// Used by regenerate to roll back the AI turn before re-sending.
  Future<void> deleteMessagesFrom(
    String conversationId,
    String messageId,
  ) async {
    await _dio.delete<void>(
      '/ai/conversations/$conversationId/messages/from/$messageId',
    );
  }
}
