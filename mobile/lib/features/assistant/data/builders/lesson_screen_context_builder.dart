import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/lesson_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';

/// `ScreenContext` builder for `/lessons/:id`. Pulls lesson title, content
/// summary, vocab IDs, and grammar-rule IDs from the existing
/// `lessonDetailProvider` so the AI can answer questions like "What's this
/// lesson about?" without an extra `get_lesson_detail` tool call.
ScreenContext lessonScreenContextBuilder(Ref ref, RouteMatch match) {
  final lessonId = match.pathParameters['id'] ?? '';
  final detailAsync = lessonId.isEmpty
      ? const AsyncValue<LessonDetail>.loading()
      : ref.watch(lessonDetailProvider(lessonId));
  final status = detailAsync.when(
    loading: () => 'loading',
    error: (error, stackTrace) => 'error',
    data: (value) => 'data',
  );
  final detail = detailAsync.whenOrNull(data: (d) => d);

  final data = <String, dynamic>{
    'screenType': 'lessonDetail',
    'status': status,
    'lessonId': lessonId,
    'title': detail?.title ?? '',
    'description': detail?.description ?? '',
    'lessonType': detail?.lessonType ?? '',
    'vocabularyIds': detail?.vocabularies.map((v) => v.id).toList() ??
        const <String>[],
    'grammarRuleIds':
        detail?.grammarRules.map((g) => g.id).toList() ?? const <String>[],
    'contentSummary': _summariseContents(detail?.contents),
  };
  if (status == 'error') {
    data['error'] = detailAsync.error?.toString() ?? 'Unknown error';
  }

  return ScreenContext(
    route: match.location,
    displayName:
        detail != null ? 'Bài học · ${detail.title}' : 'Bài học',
    barPlaceholder: 'Hỏi về bài học?',
    data: data,
  );
}

String _summariseContents(List<LessonContent>? contents) {
  if (contents == null || contents.isEmpty) return '';
  // Deliberately compact: a few lines of the Vietnamese text are enough
  // for the AI to ground itself; full content lives behind get_lesson_detail.
  return contents.take(5).map((c) => c.vietnameseText).join(' / ');
}
