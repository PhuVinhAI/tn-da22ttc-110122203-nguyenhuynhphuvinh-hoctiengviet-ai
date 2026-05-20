import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/lesson_models.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'lesson_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/lessons/:id`. Pulls lesson title, content
/// summary, vocabulary, and grammar rules from the existing
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

  // Lesson UI loads vocab via GET /vocabularies/lesson/:id; lesson detail may
  // not include the full vocabulary list — prefer the dedicated provider.
  final vocabAsync = lessonId.isEmpty
      ? const AsyncValue<List<LessonVocabulary>>.loading()
      : ref.watch(lessonVocabulariesProvider(lessonId));
  final vocabularies = vocabAsync.whenOrNull(data: (list) => list) ??
      detail?.vocabularies ??
      const <LessonVocabulary>[];

  final profileAsync = ref.watch(userProfileProvider);
  final preferredDialect = profileAsync.value?.preferredDialect;

  final data = <String, dynamic>{
    'screenType': 'lessonDetail',
    'status': status,
    'lessonId': lessonId,
    'title': detail?.title ?? '',
    'description': detail?.description ?? '',
    'lessonType': detail?.lessonType ?? '',
    'vocabularies': vocabularies
        .map((v) => vocabularyContextSummary(v, preferredDialect: preferredDialect))
        .toList(growable: false),
    'grammarRules': detail?.grammarRules
            .map(grammarRuleContextSummary)
            .toList(growable: false) ??
        const <Map<String, dynamic>>[],
    'contentSummary': _summariseContents(detail?.contents),
  };
  if (status == 'error') {
    data['error'] = detailAsync.error?.toString() ?? 'Unknown error';
  }

  return ScreenContext(
    route: match.location,
    displayName:
        detail != null ? 'Lesson · ${detail.title}' : 'Lesson',
    barPlaceholder: 'Ask about this lesson?',
    data: data,
  );
}

String _summariseContents(List<LessonContent>? contents) {
  if (contents == null || contents.isEmpty) return '';
  // Deliberately compact: a few lines of the Vietnamese text are enough
  // for the AI to ground itself; full content lives behind get_lesson_detail.
  return contents.take(5).map((c) => c.vietnameseText).join(' / ');
}
