import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/lesson_models.dart';
import '../../domain/screen_context.dart';
import '../assistant_localizations_provider.dart';
import '../lesson_wizard_view_state_provider.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';
import 'lesson_context_summaries.dart';
import '../../../profile/data/profile_providers.dart';

/// `ScreenContext` builder for `/lessons/:id`. The screen is `LessonWizard`,
/// a paged step-through of content / vocabulary / grammar. Beside the
/// full vocab + grammar lists used to ground answers, the builder publishes
/// which step the learner is on right now (pushed by the screen into
/// `lessonWizardViewStateProvider`) plus the matching content piece, so
/// the AI knows what "this card" / "this word" refers to.
ScreenContext lessonScreenContextBuilder(Ref ref, RouteMatch match) {
  final s = ref.watch(assistantLocalizationsProvider);
  final lessonId = match.pathParameters['id'] ?? '';
  final detailAsync = lessonId.isEmpty
      ? const AsyncValue<LessonDetail>.loading()
      : ref.watch(lessonDetailProvider(lessonId));
  final status = asyncLoadStatus(detailAsync);
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

  // Wizard step state pushed from `LessonWizardScreen` (lifted from setState
  // so the builder can see "step 3 of 5 — vocabulary").
  final wizardState = ref.watch(lessonWizardViewStateProvider);
  final wizardForThisLesson =
      wizardState != null && wizardState.lessonId == lessonId
          ? wizardState
          : null;

  final progressAsync = lessonId.isEmpty
      ? const AsyncValue<Map<String, dynamic>?>.loading()
      : ref.watch(lessonProgressProvider(lessonId));
  final progressStatusValue =
      progressAsync.value?['status']?.toString();

  final data = <String, dynamic>{
    'screenType': 'lessonDetail',
    'status': status,
    'lessonId': lessonId,
    'title': detail?.title ?? '',
    'description': detail?.description ?? '',
    'vocabularies': vocabularies
        .map((v) => vocabularyContextSummary(v, preferredDialect: preferredDialect))
        .toList(growable: false),
    'grammarRules': detail?.grammarRules
            .map(grammarRuleContextSummary)
            .toList(growable: false) ??
        const <Map<String, dynamic>>[],
    'contentSummary': _summariseContents(detail?.contents),
    'progressStatus': ?progressStatusValue,
  };

  if (wizardForThisLesson != null) {
    data['currentStepIndex'] = wizardForThisLesson.currentPage;
    data['totalSteps'] = wizardForThisLesson.totalSteps;
    final step = wizardForThisLesson.currentStep;
    if (step != null) {
      data['currentStep'] = step.toJson();
      if (step.type == 'content' && step.contentId != null) {
        final pieces = detail?.contents
                .where((c) => c.id == step.contentId)
                .toList(growable: false) ??
            const <LessonContent>[];
        if (pieces.isNotEmpty) {
          data['currentContent'] = _contentPieceSummary(pieces.first);
        }
      }
    }
    if (wizardForThisLesson.totalSteps > 0) {
      final progress =
          (wizardForThisLesson.currentPage + 1) /
              wizardForThisLesson.totalSteps;
      data['wizardProgress'] = double.parse(progress.toStringAsFixed(3));
    }
    data['steps'] = wizardForThisLesson.steps
        .map((s) => s.toJson())
        .toList(growable: false);
  }

  if (status == 'error') {
    data['error'] = detailAsync.error?.toString() ?? 'Unknown error';
  }

  return ScreenContext(
    route: match.location,
    displayName: detail != null
        ? s.assistantLessonTitleParam(detail.title)
        : s.assistantLessonTitle,
    barPlaceholder: s.assistantLessonPlaceholder,
    data: data,
  );
}

Map<String, dynamic> _contentPieceSummary(LessonContent content) {
  return <String, dynamic>{
    'id': content.id,
    if (content.vietnameseText.isNotEmpty)
      'vietnameseText': content.vietnameseText,
    if (content.translation != null && content.translation!.isNotEmpty)
      'translation': content.translation,
    if (content.notes != null && content.notes!.isNotEmpty) 'notes': content.notes,
  };
}

String _summariseContents(List<LessonContent>? contents) {
  if (contents == null || contents.isEmpty) return '';
  // Deliberately compact: a few lines of the Vietnamese text are enough
  // for the AI to ground itself when no wizard step is being broadcast.
  // Once the wizard publishes its current step, `currentContent` carries
  // the canonical card the learner is actually looking at.
  return contents.take(5).map((c) => c.vietnameseText).join(' / ');
}
