import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/lesson_providers.dart';
import '../../data/lesson_time_tracker.dart';
import '../../domain/lesson_models.dart';
import '../widgets/content_widgets.dart';
import '../widgets/vocabulary_step.dart';
import '../widgets/grammar_step.dart';
import '../../../assistant/data/lesson_wizard_view_state_provider.dart';

class LessonWizardScreen extends ConsumerStatefulWidget {
  const LessonWizardScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  ConsumerState<LessonWizardScreen> createState() => _LessonWizardScreenState();
}

class _LessonWizardScreenState extends ConsumerState<LessonWizardScreen>
    with WidgetsBindingObserver {
  PageController? _pageController;
  int _currentPage = 0;
  bool _initialProgressHandled = false;
  bool _startExercisesDialogOpen = false;
  LessonTimeTracker? _lessonTimeTracker;

  void _bindLessonTimeTracker() {
    _lessonTimeTracker ??= LessonTimeTracker(
      onFlush: (seconds) => ref
          .read(lessonProgressProvider(widget.lessonId).notifier)
          .addTimeSpent(seconds),
    );
    if (!_lessonTimeTracker!.isRunning) {
      _lessonTimeTracker!.start();
    }
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    WidgetsBinding.instance.addObserver(this);
  }

  static bool _isInProgress(Map<String, dynamic>? progress) {
    if (progress == null) return false;
    final s = progress['status']?.toString().toLowerCase();
    return s == 'in_progress';
  }

  void _showResumeDialog() {
    AppDialog.show(
      context,
      builder: (ctx) => AppDialog(
        title: S.of(context).continueLesson,
        content:
            S.of(context).continueLessonContent,
        actions: [
          AppDialogAction(
            label: S.of(context).startFromBeginningButton,
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          AppDialogAction(
            label: S.of(context).goToExercisesButton,
            isPrimary: true,
            onPressed: () {
              Navigator.of(ctx).pop();
              _navigateToExerciseHub();
            },
          ),
        ],
      ),
    );
  }

  void _navigateToExerciseHub() {
    unawaited(_lessonTimeTracker?.stop());
    context.push('/lessons/${widget.lessonId}/exercises');
  }

  void _showExercisePrompt() {
    if (_startExercisesDialogOpen) return;
    _startExercisesDialogOpen = true;

    ref
        .read(lessonProgressProvider(widget.lessonId).notifier)
        .markContentReviewed();

    AppDialog.show<void>(
      context,
      barrierDismissible: false,
      builder: (ctx) => AppDialog(
        title: S.of(context).startExercisesQuestion,
        content: S.of(context).finishedContentPracticeQuestion,
        actions: [
          AppDialogAction(
            label: S.of(context).notNow,
            onPressed: () {
              Navigator.of(ctx).pop();
              if (mounted) context.pop();
            },
          ),
          AppDialogAction(
            label: S.of(context).letsPractice,
            isPrimary: true,
            onPressed: () {
              Navigator.of(ctx).pop();
              _navigateToExerciseHub();
            },
          ),
        ],
      ),
    ).whenComplete(() {
      if (mounted) {
        setState(() => _startExercisesDialogOpen = false);
      }
    });
  }

  bool _canGoForwardFrom(int index, int stepCount) {
    if (index >= stepCount - 1) return false;
    return true;
  }

  @override
  void didUpdateWidget(covariant LessonWizardScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lessonId != widget.lessonId) {
      unawaited(_lessonTimeTracker?.stop());
      _lessonTimeTracker = null;
      _initialProgressHandled = false;
      _startExercisesDialogOpen = false;
      _currentPage = 0;
      _pageController?.dispose();
      _pageController = PageController();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        unawaited(_lessonTimeTracker?.pauseAndFlush());
      case AppLifecycleState.resumed:
        _lessonTimeTracker?.resume();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    unawaited(_lessonTimeTracker?.stop());
    try {
      ref.read(lessonWizardViewStateProvider.notifier).clear();
    } catch (_) {}
    _pageController?.dispose();
    super.dispose();
  }

  void _publishWizardState({
    required List<_WizardStep> steps,
    required int currentPage,
  }) {
    final mapped = steps
        .map(
          (s) => LessonWizardStep(
            type: switch (s.type) {
              _StepType.content => 'content',
              _StepType.vocabulary => 'vocabulary',
              _StepType.grammar => 'grammar',
            },
            label: s.label,
            contentId: s.content?.id,
          ),
        )
        .toList(growable: false);
    ref.read(lessonWizardViewStateProvider.notifier).update(
          lessonId: widget.lessonId,
          currentPage: currentPage,
          steps: mapped,
        );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    final lessonAsync = ref.watch(lessonDetailProvider(widget.lessonId));
    final vocabAsync = ref.watch(lessonVocabulariesProvider(widget.lessonId));
    final progressAsync = ref.watch(lessonProgressProvider(widget.lessonId));

    final isInitialLoading = (lessonAsync.isLoading && lessonAsync.value == null) ||
                             (vocabAsync.isLoading && vocabAsync.value == null);
    if (isInitialLoading) {
      return Scaffold(
        appBar: AppAppBar(title: Text(S.of(context).lessonTitle)),
        body: const _LessonLoadingSkeleton(),
      );
    }

    if (lessonAsync.hasError || vocabAsync.hasError) {
      return Scaffold(
        appBar: AppAppBar(title: Text(S.of(context).lessonTitle)),
        body: _LessonError(
          message: (lessonAsync.error ?? vocabAsync.error!).toString(),
          onRetry: () {
            ref.invalidate(lessonDetailProvider(widget.lessonId));
            ref.invalidate(lessonVocabulariesProvider(widget.lessonId));
          },
        ),
      );
    }

    final lesson = lessonAsync.value!;
    final vocabs = vocabAsync.value ?? [];
    final progress = progressAsync.value;

    if (!_initialProgressHandled && !progressAsync.isLoading) {
      if (progressAsync.hasError) {
        _initialProgressHandled = true;
        Future.microtask(() async {
          await ref
              .read(lessonProgressProvider(widget.lessonId).notifier)
              .startLesson();
          if (mounted) _bindLessonTimeTracker();
        });
      } else if (progressAsync.hasValue) {
        _initialProgressHandled = true;
        final hadExistingProgress = progress != null;
        final showResume = hadExistingProgress && _isInProgress(progress);
        Future.microtask(() async {
          final notifier =
              ref.read(lessonProgressProvider(widget.lessonId).notifier);
          if (showResume) {
            if (mounted) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) _showResumeDialog();
              });
            }
          }
          await notifier.startLesson();
          if (mounted) _bindLessonTimeTracker();
        });
      }
    }

    final steps = <_WizardStep>[];

    for (final content in lesson.contents) {
      steps.add(_WizardStep(
        type: _StepType.content,
        label: S.of(context).readingStepLabel,
        content: content,
      ));
    }

    if (vocabs.isNotEmpty) {
      steps.add(_WizardStep(
        type: _StepType.vocabulary,
        label: S.of(context).vocabularyTitle,
        vocabularies: vocabs,
      ));
    }

    if (lesson.grammarRules.isNotEmpty) {
      steps.add(_WizardStep(
        type: _StepType.grammar,
        label: S.of(context).grammarTitle,
        grammarRules: lesson.grammarRules,
      ));
    }

    if (steps.isEmpty) {
      return Scaffold(
        appBar: AppAppBar(title: Text(lesson.title)),
        body: Center(child: Text(S.of(context).noContentAvailable)),
      );
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _publishWizardState(steps: steps, currentPage: _currentPage);
    });

    final isLastStep = _currentPage == steps.length - 1;
    final canGoForward = _canGoForwardFrom(_currentPage, steps.length);

    return Scaffold(
      appBar: AppAppBar(
        title: Text(lesson.title),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: AppProgress(
            value: (_currentPage + 1) / steps.length,
            trackColor: c.muted,
            height: 4,
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  S.of(context).stepProgressParam(
                    _currentPage + 1,
                    steps.length,
                  ),
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  steps[_currentPage].label,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemCount: steps.length,
              itemBuilder: (context, index) {
                return _buildStep(steps[index]);
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentPage > 0)
                    Semantics(
                      label: S.of(context).goToPreviousStep,
                      button: true,
                      child: AppButton(
                        label: S.of(context).backButton,
                        variant: AppButtonVariant.outline,
                        onPressed: () {
                          _pageController?.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                      ),
                    )
                  else
                    const SizedBox.shrink(),
                  const Spacer(),
                  if (!isLastStep && canGoForward)
                    Semantics(
                      label: S.of(context).goToNextStep,
                      button: true,
                      child: AppButton(
                        label: S.of(context).nextButton,
                        variant: AppButtonVariant.primary,
                        onPressed: () {
                          _pageController?.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                      ),
                    )
                  else if (isLastStep)
                    Semantics(
                      label: S.of(context).continueToExercises,
                      button: true,
                      child: AppButton(
                        label: S.of(context).authContinueHome,
                        variant: AppButtonVariant.primary,
                        onPressed: _showExercisePrompt,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(_WizardStep step) {
    switch (step.type) {
      case _StepType.content:
        return TextContentWidget(content: step.content!);
      case _StepType.vocabulary:
        return VocabularyStepWidget(
          vocabularies: step.vocabularies ?? [],
          lessonId: widget.lessonId,
        );
      case _StepType.grammar:
        return GrammarStepWidget(grammarRules: step.grammarRules ?? []);
    }
  }
}

enum _StepType { content, vocabulary, grammar }

class _WizardStep {
  const _WizardStep({
    required this.type,
    required this.label,
    this.content,
    this.vocabularies,
    this.grammarRules,
  });

  final _StepType type;
  final String label;
  final LessonContent? content;
  final List<LessonVocabulary>? vocabularies;
  final List<GrammarRule>? grammarRules;
}

class _LessonLoadingSkeleton extends StatelessWidget {
  const _LessonLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 16,
              width: 150,
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 24,
              width: double.infinity,
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 16,
              width: 250,
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 16,
              width: double.infinity,
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 16,
              width: 200,
              decoration: BoxDecoration(
                color: c.card,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LessonError extends StatelessWidget {
  const _LessonError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: c.mutedForeground),
            const SizedBox(height: 16),
            Text(S.of(context).failedToLoadLesson, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            AppButton(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: S.of(context).retryButton,
              variant: AppButtonVariant.primary,
            ),
          ],
        ),
      ),
    );
  }
}
