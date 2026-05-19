import '../domain/screen_context.dart';

/// Returns the [ScreenContext] payload safe to POST to `/ai/chat/stream`.
///
/// Domain-injected routes expose structured facts via `data.screenType` and
/// must not ship the Flutter widget-tree capture — it mostly reflects the
/// assistant chrome, not the underlying screen.
ScreenContext screenContextForApi(ScreenContext context) {
  if (!context.data.containsKey('screenType')) return context;
  if (!context.data.containsKey('uiSnapshot')) return context;

  final data = Map<String, dynamic>.from(context.data)..remove('uiSnapshot');
  return context.copyWithData(data);
}
