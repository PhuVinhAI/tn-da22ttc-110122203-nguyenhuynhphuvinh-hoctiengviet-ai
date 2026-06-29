import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Lightweight description of a single step in `LessonWizardScreen`'s
/// `PageView`. Mirrors the private `_WizardStep` enum so the assistant
/// builder can publish "the learner is on step 3 of 5 (vocabulary)" without
/// reaching into widget-private types.
@immutable
class LessonWizardStep {
  const LessonWizardStep({
    required this.type,
    required this.label,
    this.contentId,
  });

  /// One of `content`, `vocabulary`, `grammar`.
  final String type;

  /// Localised label shown in the step header (e.g. "Đọc", "Từ vựng").
  final String label;

  /// Only set when [type] == 'content'.
  final String? contentId;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'type': type,
        'label': label,
        if (contentId != null) 'contentId': contentId,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LessonWizardStep &&
          type == other.type &&
          label == other.label &&
          contentId == other.contentId;

  @override
  int get hashCode => Object.hash(type, label, contentId);
}

@immutable
class LessonWizardViewState {
  const LessonWizardViewState({
    required this.lessonId,
    required this.currentPage,
    required this.steps,
  });

  final String lessonId;
  final int currentPage;
  final List<LessonWizardStep> steps;

  int get totalSteps => steps.length;

  LessonWizardStep? get currentStep =>
      currentPage >= 0 && currentPage < steps.length
          ? steps[currentPage]
          : null;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LessonWizardViewState &&
          lessonId == other.lessonId &&
          currentPage == other.currentPage &&
          listEquals(steps, other.steps);

  @override
  int get hashCode => Object.hash(lessonId, currentPage, Object.hashAll(steps));
}

class LessonWizardViewStateNotifier extends Notifier<LessonWizardViewState?> {
  @override
  LessonWizardViewState? build() => null;

  void update({
    required String lessonId,
    required int currentPage,
    required List<LessonWizardStep> steps,
  }) {
    final next = LessonWizardViewState(
      lessonId: lessonId,
      currentPage: currentPage,
      steps: steps,
    );
    if (state == next) return;
    state = next;
  }

  void clear() {
    if (state == null) return;
    state = null;
  }
}

final lessonWizardViewStateProvider = NotifierProvider<
    LessonWizardViewStateNotifier, LessonWizardViewState?>(
  LessonWizardViewStateNotifier.new,
);
