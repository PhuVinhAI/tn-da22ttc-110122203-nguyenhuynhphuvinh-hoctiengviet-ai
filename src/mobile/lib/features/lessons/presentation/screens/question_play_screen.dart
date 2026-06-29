import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/sync/sync.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../assistant/data/current_question_attempt_provider.dart';
import '../../../assistant/data/question_context_sanitizer.dart';
import '../../data/lesson_providers.dart';
import '../../domain/question_models.dart';
import '../../domain/question_session.dart';
import '../../domain/question_renderer.dart';
import '../../domain/question_renderer_registry.dart';
import '../../domain/question_theme_helper.dart';

class QuestionPlayScreen extends ConsumerStatefulWidget {
  const QuestionPlayScreen({
    super.key,
    this.lessonId,
    this.moduleId,
    this.courseId,
    required this.exerciseId,
  });

  final String? lessonId;
  final String? moduleId;
  final String? courseId;
  final String exerciseId;

  @override
  ConsumerState<QuestionPlayScreen> createState() => _QuestionPlayScreenState();
}

class _QuestionPlayScreenState extends ConsumerState<QuestionPlayScreen> {
  List<Question> _questions = [];
  int _currentIndex = 0;

  dynamic _currentAnswer;
  bool _submitted = false;
  bool _submitting = false;
  ExerciseSubmissionResult? _result;
  String? _submitError;

  final Map<int, dynamic> _answers = {};
  final Map<int, ExerciseSubmissionResult> _results = {};
  final Stopwatch _questionTimer = Stopwatch();

  bool _initialResumeFlowScheduled = false;
  bool _resumeGateDone = false;
  bool _sessionDeleted = false;

  LessonExercisesArgs get _args => LessonExercisesArgs(
    lessonId: widget.lessonId ?? widget.moduleId ?? '',
    exerciseId: widget.exerciseId,
  );

  @override
  void didUpdateWidget(covariant QuestionPlayScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lessonId != widget.lessonId ||
        oldWidget.moduleId != widget.moduleId ||
        oldWidget.exerciseId != widget.exerciseId) {
      _initialResumeFlowScheduled = false;
      _resumeGateDone = false;
      _sessionDeleted = false;
      _questions = [];
      _currentIndex = 0;
      _answers.clear();
      _results.clear();
      _currentAnswer = null;
      _submitted = false;
      _result = null;
      _submitting = false;
      _submitError = null;
    }
  }

  @override
  void dispose() {
    // Clear the in-flight attempt snapshot so the assistant bar stops
    // exposing a stale exercise context after the learner navigates away.
    try {
      ref.read(currentQuestionAttemptProvider.notifier).clear();
    } catch (_) {
      // Provider container may already be disposed (e.g. on app exit).
    }
    super.dispose();
  }

  /// Syncs `_currentAnswer`, `_submitted`, `_result` from `_answers` / `_results`.
  /// Call only inside [setState].
  void _applyLocalStateForCurrentQuestion() {
    _currentAnswer = _answers[_currentIndex];
    if (_results.containsKey(_currentIndex)) {
      _result = _results[_currentIndex];
      _submitted = true;
      _questionTimer.stop();
    } else {
      _result = null;
      _submitted = false;
      _questionTimer
        ..reset()
        ..start();
    }
  }

  void _applySessionFromHive(QuestionSession session) {
    if (!mounted) return;
    setState(() {
      _currentIndex = session.currentIndex.clamp(0, _questions.length - 1);
      _answers.clear();
      _answers.addAll(session.answers);
      _results.clear();
      for (final entry in session.results.entries) {
        _results[entry.key] = ExerciseSubmissionResult.fromJson(entry.value);
      }
      _applyLocalStateForCurrentQuestion();
    });
  }

  Future<void> _runInitialResumeFlow() async {
    try {
      final exerciseId = widget.exerciseId;
      if (_questions.isEmpty) return;

      final service = ref.read(questionSessionServiceProvider);
      final session = await service.load(exerciseId);
      if (!mounted) return;

      if (session == null) return;

      final meaningful =
          session.currentIndex > 0 ||
          session.results.isNotEmpty ||
          session.answers.isNotEmpty;

      if (!meaningful) return;

      final choice = await AppDialog.show<bool>(
        context,
        barrierDismissible: false,
        builder: (ctx) => AppDialog(
          title: S.of(context).resumeExerciseQuestion,
          content: S
              .of(context)
              .unfinishedProgressQuestionParam(
                session.currentIndex + 1,
                _questions.length,
              ),
          actions: [
            AppDialogAction(
              label: S.of(context).startOver,
              onPressed: () => Navigator.of(ctx).pop(false),
            ),
            AppDialogAction(
              label: S.of(context).authContinueHome,
              isPrimary: true,
              onPressed: () => Navigator.of(ctx).pop(true),
            ),
          ],
        ),
      );

      if (!mounted) return;

      if (choice == true) {
        _applySessionFromHive(session);
      } else if (choice == false) {
        await service.delete(exerciseId);
        try {
          final repo = ref.read(lessonRepositoryProvider);
          await repo.resetExerciseProgress(exerciseId);
        } catch (_) {
          // best-effort: don't block UI if backend reset fails
        }
        if (!mounted) return;
        setState(() {
          _currentIndex = 0;
          _answers.clear();
          _results.clear();
          _submitError = null;
          _applyLocalStateForCurrentQuestion();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _resumeGateDone = true;
          if (!_submitted && !_questionTimer.isRunning) {
            _questionTimer
              ..reset()
              ..start();
          }
        });
      }
    }
  }

  Map<int, dynamic> _answersSnapshotForPersistence() {
    final out = Map<int, dynamic>.from(_answers);
    if (!_submitted && _currentAnswer != null) {
      out[_currentIndex] = _currentAnswer;
    }
    return out;
  }

  Future<void> _saveSession() async {
    final exerciseId = widget.exerciseId;
    if (_questions.isEmpty) return;
    if (_sessionDeleted) return;

    final service = ref.read(questionSessionServiceProvider);
    final session = QuestionSession(
      exerciseId: exerciseId,
      lessonId: widget.lessonId ?? widget.moduleId ?? '',
      currentIndex: _currentIndex,
      answers: _answersSnapshotForPersistence(),
      results: _results.map(
        (k, v) => MapEntry<int, Map<String, dynamic>>(k, v.toJson()),
      ),
      questions: _questions.map((e) => e.toJson()).toList(),
    );

    try {
      await service.save(session);
    } catch (_) {
      // Hive / IO — avoid crashing the UI; a later save may succeed
    }
  }

  Future<void> _deleteSession() async {
    final exerciseId = widget.exerciseId;
    final service = ref.read(questionSessionServiceProvider);
    await service.delete(exerciseId);
    _sessionDeleted = true;
  }

  bool get _isValid {
    if (_currentQuestion == null) return false;
    final renderer = getRenderer(_currentQuestion!.questionType);
    return renderer.validateAnswer(_currentQuestion!, _currentAnswer);
  }

  Question? get _currentQuestion {
    if (_currentIndex >= _questions.length) return null;
    return _questions[_currentIndex];
  }

  bool get _isLastQuestion => _currentIndex >= _questions.length - 1;

  int get _totalCorrect => _results.values.where((r) => r.isCorrect).length;

  void _handleAnswerChanged(dynamic answer) {
    setState(() => _currentAnswer = answer);
    if (_currentQuestion?.questionType == QuestionType.speaking &&
        answer is String &&
        answer.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_submitted && !_submitting && _isValid) {
          _submit();
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_isValid || _submitted || _submitting) return;

    setState(() {
      _submitting = true;
      _submitError = null;
    });

    try {
      final repo = ref.read(lessonRepositoryProvider);
      final renderer = getRenderer(_currentQuestion!.questionType);
      final payload = renderer.buildAnswerPayload(_currentAnswer);
      final result = await repo.submitQuestionAnswer(
        _currentQuestion!.id,
        payload,
        timeSpent: _questionTimer.elapsed.inSeconds,
      );

      _answers[_currentIndex] = _currentAnswer;
      _results[_currentIndex] = result;

      await _saveSession();

      ref.read(dataChangeBusProvider.notifier).emit({'question'});

      setState(() {
        _result = result;
        _submitted = true;
        _submitting = false;
      });
    } catch (e) {
      setState(() {
        _submitError = e.toString();
        _submitting = false;
      });
    }
  }

  Future<void> _nextQuestion() async {
    if (_isLastQuestion) return;
    setState(() {
      _currentIndex++;
      _submitError = null;
      _applyLocalStateForCurrentQuestion();
    });
    await _saveSession();
  }

  void _showSummary() {
    final c = AppTheme.colors(context);
    final total = _questions.length;
    final correct = _totalCorrect;
    final percent = total > 0 ? ((correct / total) * 100).round() : 0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AppDialog(
        icon: Icons.emoji_events_outlined,
        title: S.of(context).exerciseComplete,
        contentWidget: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              S.of(context).yourScoreLabel,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '$percent%',
              style: GoogleFonts.inter(
                fontSize: 40,
                fontWeight: FontWeight.w800,
                color: c.primary,
                height: 1.1,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '$correct of $total exercises correct',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
              ),
            ),
            if (correct < total) ...[
              const SizedBox(height: AppSpacing.md),
              ..._results.entries.where((e) => !e.value.isCorrect).map((e) {
                final idx = e.key;
                final question = idx < _questions.length
                    ? _questions[idx]
                    : null;
                if (question == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                  child: Row(
                    children: [
                      Icon(Icons.close, size: 16, color: c.error),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _summaryLabel(question),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            color: c.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
        actions: [
          AppDialogAction(
            label: S.of(context).returnToPractice,
            isPrimary: true,
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _deleteSession();
              if (widget.lessonId != null) {
                try {
                  final repo = ref.read(lessonRepositoryProvider);
                  await repo.markContentReviewed(widget.lessonId!);
                  final totalScore = _results.values.fold<int>(
                    0,
                    (sum, r) => sum + r.score,
                  );
                  final avgScore = _results.isEmpty
                      ? 0
                      : (totalScore / _results.length).round();
                  await repo.completeLesson(widget.lessonId!, score: avgScore);
                } catch (_) {}
              }
              ref.read(dataChangeBusProvider.notifier).emit({
                'progress',
                'question',
              });
              if (mounted) context.pop();
            },
          ),
        ],
      ),
    );
  }

  String _summaryLabel(Question question) {
    if (question.question != null && question.question!.isNotEmpty) {
      return question.question!;
    }
    final options = question.options;
    if (options is FillBlankOptions && options.sentence.isNotEmpty) {
      return options.sentence;
    }
    if (options is TranslationOptions && options.sourceText.isNotEmpty) {
      return options.sourceText;
    }
    if (options is MatchingOptions && options.pairs.isNotEmpty) {
      return options.pairs
          .map((p) => '${p.left} ↔ ${p.right}')
          .take(2)
          .join(' · ');
    }
    return question.questionType.value;
  }

  void _syncAssistantContext() {
    if (!mounted) return;
    final question = _currentQuestion;
    final notifier = ref.read(currentQuestionAttemptProvider.notifier);
    if (question == null || _questions.isEmpty) {
      notifier.clear();
      return;
    }
    final result = _result;
    final submitted = _submitted;
    notifier.update(
      CurrentQuestionAttempt(
        exerciseId: widget.exerciseId,
        lessonId: widget.lessonId,
        moduleId: widget.moduleId,
        courseId: widget.courseId,
        questionId: question.id,
        questionType: question.questionType.value,
        question: question.question,
        questionAudioUrl: question.questionAudioUrl,
        acceptsWithoutDiacritics: question.acceptsWithoutDiacritics,
        userAnswer: userAnswerForAssistantContext(
          question.questionType,
          _currentAnswer,
        ),
        exerciseIndex: _currentIndex,
        totalQuestions: _questions.length,
        correctCount: _totalCorrect,
        options: optionsForAssistantContext(question, revealAnswers: submitted),
        submitted: submitted,
        submitting: _submitting,
        submitError: _submitError,
        correctAnswer: submitted ? question.correctAnswer.toJson() : null,
        explanation: submitted ? question.explanation : null,
        isCorrect: result?.isCorrect,
        score: result?.score,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _syncAssistantContext(),
    );

    final questionsAsync = ref.watch(lessonExercisesProvider(_args));

    return questionsAsync.when(
      loading: () => const _QuestionPlayLoading(),
      error: (error, _) => Scaffold(
        appBar: AppAppBar(title: Text(S.of(context).questionsTitle)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: c.error.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                  ),
                  child: Icon(Icons.error_outline, size: 30, color: c.error),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  S.of(context).failedToLoadLesson,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyLarge,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  error.toString(),
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.lg),
                AppButton(
                  label: S.of(context).goBack,
                  variant: AppButtonVariant.primary,
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (questions) {
        if (questions.isEmpty) {
          return Scaffold(
            appBar: AppAppBar(title: Text(S.of(context).questionsTitle)),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: c.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                      ),
                      child: Icon(
                        Icons.edit_note_rounded,
                        size: 30,
                        color: c.primary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      S.of(context).noExercisesAvailable,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyLarge,
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: S.of(context).retryButton,
                      variant: AppButtonVariant.primary,
                      onPressed: () => context.pop(),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        _questions = questions;

        if (!_initialResumeFlowScheduled) {
          _initialResumeFlowScheduled = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _runInitialResumeFlow();
          });
        }

        if (!_resumeGateDone) {
          return const _QuestionPlayLoading();
        }

        final question = _currentQuestion!;
        final renderer = getRenderer(question.questionType);
        final progress = (_currentIndex + 1) / _questions.length;

        return PopScope(
          onPopInvokedWithResult: (_, _) {
            unawaited(_saveSession());
          },
          child: Scaffold(
            appBar: AppAppBar(
              title: Text(S.of(context).questionsTitle),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(4),
                child: AppProgress(
                  value: progress,
                  trackColor: c.muted,
                  height: 4,
                ),
              ),
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    S
                        .of(context)
                        .questionProgressParam(
                          _currentIndex + 1,
                          _questions.length,
                        ),
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      fontWeight: FontWeight.w600,
                      color: c.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  QuestionHeader(question: question, renderer: renderer),
                  const SizedBox(height: AppSpacing.lg),
                  renderer.buildInput(
                    question,
                    context,
                    _currentAnswer,
                    _handleAnswerChanged,
                  ),
                  if (_submitError != null) ...[
                    const SizedBox(height: AppSpacing.lg),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: c.error.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(
                          color: c.error.withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: c.error, size: 20),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              _submitError!,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodySmall,
                                color: c.error,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  if (!_submitted)
                    AppButton(
                      label: _submitting
                          ? S.of(context).submittingStatus
                          : S.of(context).submitLabel,
                      variant: AppButtonVariant.primary,
                      onPressed: _isValid && !_submitting ? _submit : null,
                    ),
                  if (_submitted && _result != null) ...[
                    ExplanationPanel(
                      isCorrect: _result!.isCorrect,
                      correctAnswer: question.correctAnswer,
                      explanation: question.explanation,
                      score: _result!.score,
                    ),
                    const SizedBox(height: 16),
                    if (_isLastQuestion)
                      AppButton(
                        label: S.of(context).seeSummary,
                        variant: AppButtonVariant.primary,
                        onPressed: _showSummary,
                      )
                    else
                      AppButton(
                        label: S.of(context).nextQuestion,
                        variant: AppButtonVariant.primary,
                        onPressed: _nextQuestion,
                      ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class QuestionHeader extends StatelessWidget {
  const QuestionHeader({
    super.key,
    required this.question,
    required this.renderer,
  });
  final Question question;
  final QuestionRenderer renderer;

  void _showDiacriticsInfo(BuildContext context) {
    final c = AppTheme.colors(context);
    final s = S.of(context);
    AppBottomSheet.show(
      context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.md,
              AppSpacing.sm,
              AppSpacing.sm,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(Icons.info_outline, color: c.primary, size: 24),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    s.vietnameseWithoutDiacriticsTitle,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleMedium,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: s.closeButton,
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close, color: c.mutedForeground),
                  style: IconButton.styleFrom(
                    foregroundColor: c.mutedForeground,
                    minimumSize: const Size(48, 48),
                    fixedSize: const Size(48, 48),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: c.border),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.md,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.vietnameseWithoutDiacriticsAccepted,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.foreground,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: c.muted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Row(
                    children: [
                      Text(
                        '${s.vietnameseWithoutDiacriticsExample}:',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyMedium,
                          fontWeight: FontWeight.w600,
                          color: c.mutedForeground,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        '"${s.vietnameseWithoutDiacriticsExampleBefore}"',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyMedium,
                          fontWeight: FontWeight.w600,
                          color: c.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Icon(
                        Icons.arrow_forward,
                        size: 16,
                        color: c.mutedForeground,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '"${s.vietnameseWithoutDiacriticsExampleAfter}"',
                        style: AppTheme.vnStyle(
                          fontSize: AppTypography.bodyMedium,
                          fontWeight: FontWeight.w600,
                          color: c.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                AppButton(
                  label: s.understoodButton,
                  variant: AppButtonVariant.primary,
                  onPressed: () => Navigator.pop(context),
                  isFullWidth: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getQuestionVisuals(context, question.questionType);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xs + 2,
              ),
              decoration: BoxDecoration(
                color: visuals.accent.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(AppRadius.full),
                border: Border.all(
                  color: visuals.accent.withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(visuals.icon, size: 14, color: visuals.accent),
                  const SizedBox(width: AppSpacing.xs + 2),
                  Text(
                    visuals.label,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.caption,
                      color: visuals.accent,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
            if (question.acceptsWithoutDiacritics && question.questionType != QuestionType.fillBlank) ...[
              const SizedBox(width: AppSpacing.sm),
              InkWell(
                onTap: () => _showDiacriticsInfo(context),
                borderRadius: BorderRadius.circular(AppRadius.full),
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.xs),
                  child: Icon(
                    Icons.info_outline,
                    size: 18,
                    color: visuals.accent.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ],
        ),
        if (renderer.showsQuestion && (question.question?.isNotEmpty ?? false)) ...[
          const SizedBox(height: AppSpacing.md),
          Text(
            question.question!,
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleSmall,
              fontWeight: FontWeight.w600,
              color: c.foreground,
              height: 1.35,
            ),
          ),
        ],
      ],
    );
  }
}

class ExplanationPanel extends StatelessWidget {
  const ExplanationPanel({
    super.key,
    required this.isCorrect,
    required this.correctAnswer,
    this.explanation,
    this.score,
  });

  final bool isCorrect;
  final QuestionAnswer correctAnswer;
  final String? explanation;
  final int? score;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = isCorrect ? c.success : c.error;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: accent.withValues(alpha: 0.3), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle : Icons.cancel,
                color: accent,
                size: 22,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                isCorrect
                    ? S.of(context).correctLabel
                    : S.of(context).incorrectLabel,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyLarge,
                  fontWeight: FontWeight.w700,
                  color: accent,
                ),
              ),
              const Spacer(),
              if (score != null)
                Text(
                  '+$score',
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyLarge,
                    fontWeight: FontWeight.w800,
                    color: accent,
                  ),
                ),
            ],
          ),
          if (!isCorrect) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              S.of(context).correctAnswerLabel,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                fontWeight: FontWeight.w600,
                color: c.mutedForeground,
              ),
            ),
          ],
          if (explanation != null && explanation!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              explanation!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.foreground,
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuestionPlayLoading extends StatelessWidget {
  const _QuestionPlayLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget buildOptionShimmer() {
      return Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.md),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md + 2),
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Row(
            children: [
              Shimmer.fromColors(
                baseColor: c.muted,
                highlightColor: c.card,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    width: 180,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppAppBar(
        title: Text(S.of(context).questionsTitle),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              width: double.infinity,
              height: 4,
              color: Colors.white,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 100,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 80,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: double.infinity,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 200,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
            const SizedBox(height: 24),
            buildOptionShimmer(),
            buildOptionShimmer(),
            buildOptionShimmer(),
            const SizedBox(height: 24),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
