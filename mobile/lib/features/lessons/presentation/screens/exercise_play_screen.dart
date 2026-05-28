import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/sync/sync.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../assistant/data/current_exercise_attempt_provider.dart';
import '../../../assistant/data/exercise_context_sanitizer.dart';
import '../../data/lesson_providers.dart';
import '../../domain/exercise_models.dart';
import '../../domain/exercise_session.dart';
import '../../domain/exercise_renderer.dart';
import '../../domain/exercise_renderer_registry.dart';
import '../../domain/exercise_theme_helper.dart';

class ExercisePlayScreen extends ConsumerStatefulWidget {
  const ExercisePlayScreen({
    super.key,
    this.lessonId,
    this.moduleId,
    this.courseId,
    required this.setId,
  });

  final String? lessonId;
  final String? moduleId;
  final String? courseId;
  final String setId;

  @override
  ConsumerState<ExercisePlayScreen> createState() => _ExercisePlayScreenState();
}

class _ExercisePlayScreenState extends ConsumerState<ExercisePlayScreen> {
  List<Exercise> _exercises = [];
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
    setId: widget.setId,
  );

  @override
  void didUpdateWidget(covariant ExercisePlayScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lessonId != widget.lessonId ||
        oldWidget.moduleId != widget.moduleId ||
        oldWidget.setId != widget.setId) {
      _initialResumeFlowScheduled = false;
      _resumeGateDone = false;
      _sessionDeleted = false;
      _exercises = [];
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
      ref.read(currentExerciseAttemptProvider.notifier).clear();
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

  void _applySessionFromHive(ExerciseSession session) {
    if (!mounted) return;
    setState(() {
      _currentIndex = session.currentIndex.clamp(0, _exercises.length - 1);
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
      final setId = widget.setId;
      if (_exercises.isEmpty) return;

      final service = ref.read(exerciseSessionServiceProvider);
      final session = await service.load(setId);
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
          title: 'Resume exercise?',
          content:
              'You have unfinished progress at question ${session.currentIndex + 1} of ${_exercises.length}. Continue from there or start over?',
          actions: [
            AppDialogAction(
              label: 'Start over',
              onPressed: () => Navigator.of(ctx).pop(false),
            ),
            AppDialogAction(
              label: 'Continue',
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
        await service.delete(setId);
        try {
          final repo = ref.read(lessonRepositoryProvider);
          await repo.resetExerciseSetProgress(setId);
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
    final setId = widget.setId;
    if (_exercises.isEmpty) return;
    if (_sessionDeleted) return;

    final service = ref.read(exerciseSessionServiceProvider);
    final session = ExerciseSession(
      setId: setId,
      lessonId: widget.lessonId ?? widget.moduleId ?? '',
      currentIndex: _currentIndex,
      answers: _answersSnapshotForPersistence(),
      results: _results.map(
        (k, v) => MapEntry<int, Map<String, dynamic>>(k, v.toJson()),
      ),
      exercises: _exercises.map((e) => e.toJson()).toList(),
    );

    try {
      await service.save(session);
    } catch (_) {
      // Hive / IO — avoid crashing the UI; a later save may succeed
    }
  }

  Future<void> _deleteSession() async {
    final setId = widget.setId;
    final service = ref.read(exerciseSessionServiceProvider);
    await service.delete(setId);
    _sessionDeleted = true;
  }

  bool get _isValid {
    if (_currentExercise == null) return false;
    final renderer = getRenderer(_currentExercise!.exerciseType);
    return renderer.validateAnswer(_currentExercise!, _currentAnswer);
  }

  Exercise? get _currentExercise {
    if (_currentIndex >= _exercises.length) return null;
    return _exercises[_currentIndex];
  }

  bool get _isLastQuestion => _currentIndex >= _exercises.length - 1;

  int get _totalCorrect => _results.values.where((r) => r.isCorrect).length;

  void _handleAnswerChanged(dynamic answer) {
    setState(() => _currentAnswer = answer);
    if (_currentExercise?.exerciseType == ExerciseType.speaking &&
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
      final renderer = getRenderer(_currentExercise!.exerciseType);
      final payload = renderer.buildAnswerPayload(_currentAnswer);
      final result = await repo.submitExerciseAnswer(
        _currentExercise!.id,
        payload,
        timeSpent: _questionTimer.elapsed.inSeconds,
      );

      _answers[_currentIndex] = _currentAnswer;
      _results[_currentIndex] = result;

      await _saveSession();

      ref.read(dataChangeBusProvider.notifier).emit({
        'exercise',
        'exercise-set',
      });

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
    final theme = Theme.of(context);
    final total = _exercises.length;
    final correct = _totalCorrect;
    final percent = total > 0 ? ((correct / total) * 100).round() : 0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AppDialog(
        titleWidget: Row(
          children: [
            Icon(Icons.check_circle, color: c.primary),
            const SizedBox(width: 8),
            const Text('Exercise Complete!'),
          ],
        ),
        contentWidget: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Your score', style: theme.textTheme.bodyLarge),
            const SizedBox(height: 8),
            Text(
              '$percent%',
              style: theme.textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: c.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$correct of $total exercises correct',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: c.mutedForeground,
              ),
            ),
            if (correct < total) ...[
              const SizedBox(height: 12),
              ..._results.entries.where((e) => !e.value.isCorrect).map((e) {
                final idx = e.key;
                final exercise = idx < _exercises.length
                    ? _exercises[idx]
                    : null;
                if (exercise == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Icon(Icons.close, size: 16, color: c.error),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          exercise.question,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall,
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
            label: 'Return to practice',
            isPrimary: true,
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _deleteSession();
              if (widget.lessonId != null) {
                try {
                  final repo = ref.read(lessonRepositoryProvider);
                  await repo.markContentReviewed(widget.lessonId!);
                  await repo.completeLesson(widget.lessonId!);
                } catch (_) {}
              }
              ref.read(dataChangeBusProvider.notifier).emit({
                'progress',
                'exercise',
                'exercise-set',
              });
              if (mounted) context.pop();
            },
          ),
        ],
      ),
    );
  }

  void _syncAssistantContext() {
    if (!mounted) return;
    final exercise = _currentExercise;
    final notifier = ref.read(currentExerciseAttemptProvider.notifier);
    if (exercise == null || _exercises.isEmpty) {
      notifier.clear();
      return;
    }
    final result = _result;
    final submitted = _submitted;
    notifier.update(
      CurrentExerciseAttempt(
        setId: widget.setId,
        lessonId: widget.lessonId,
        moduleId: widget.moduleId,
        courseId: widget.courseId,
        exerciseId: exercise.id,
        exerciseType: exercise.exerciseType.value,
        question: exercise.question,
        userAnswer: userAnswerForAssistantContext(
          exercise.exerciseType,
          _currentAnswer,
        ),
        exerciseIndex: _currentIndex,
        totalExercises: _exercises.length,
        options: optionsForAssistantContext(
          exercise,
          revealAnswers: submitted,
        ),
        submitted: submitted,
        correctAnswer: submitted ? exercise.correctAnswer.toJson() : null,
        explanation: submitted ? exercise.explanation : null,
        isCorrect: result?.isCorrect,
        score: result?.score,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _syncAssistantContext(),
    );

    final exercisesAsync = ref.watch(lessonExercisesProvider(_args));

    return exercisesAsync.when(
      loading: () => const _ExercisePlayLoading(),
      error: (error, _) => Scaffold(
        appBar: const AppAppBar(title: Text('Exercise')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: c.error.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.error_outline_rounded,
                    size: 80,
                    color: c.error,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Failed to load exercises',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: c.foreground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  error.toString(),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: c.mutedForeground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.lg),
                AppButton(
                  label: 'Go back',
                  variant: AppButtonVariant.primary,
                  onPressed: () => context.pop(),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (exercises) {
        if (exercises.isEmpty) {
          return Scaffold(
            appBar: const AppAppBar(title: Text('Exercise')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: c.primary.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.edit_note_rounded,
                        size: 80,
                        color: c.primary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'No exercises available',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: c.foreground,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Go back',
                      variant: AppButtonVariant.primary,
                      onPressed: () => context.pop(),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        _exercises = exercises;

        if (!_initialResumeFlowScheduled) {
          _initialResumeFlowScheduled = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _runInitialResumeFlow();
          });
        }

        if (!_resumeGateDone) {
          return const _ExercisePlayLoading();
        }

        final exercise = _currentExercise!;
        final renderer = getRenderer(exercise.exerciseType);
        final progress = (_currentIndex + 1) / _exercises.length;

        return PopScope(
          onPopInvokedWithResult: (_, _) {
            unawaited(_saveSession());
          },
          child: Scaffold(
            appBar: AppAppBar(
              title: const Text('Exercise'),
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
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Question ${_currentIndex + 1} of ${_exercises.length}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 16),
                  QuestionHeader(exercise: exercise, renderer: renderer),
                  const SizedBox(height: 16),
                  renderer.buildInput(
                    exercise,
                    context,
                    _currentAnswer,
                    _handleAnswerChanged,
                  ),
                  if (_submitError != null) ...[
                    const SizedBox(height: 16),
                    AppCard(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: c.error, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _submitError!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: c.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  if (!_submitted)
                    AppButton(
                      label: _submitting ? 'Submitting...' : 'Submit',
                      variant: AppButtonVariant.primary,
                      onPressed: _isValid && !_submitting ? _submit : null,
                    ),
                  if (_submitted && _result != null) ...[
                    ExplanationPanel(
                      isCorrect: _result!.isCorrect,
                      correctAnswer: exercise.correctAnswer,
                      explanation: exercise.explanation,
                      score: _result!.score,
                    ),
                    const SizedBox(height: 16),
                    if (_isLastQuestion)
                      AppButton(
                        label: 'See Summary',
                        variant: AppButtonVariant.primary,
                        onPressed: _showSummary,
                      )
                    else
                      AppButton(
                        label: 'Next Question',
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
  const QuestionHeader({super.key, required this.exercise, required this.renderer});
  final Exercise exercise;
  final ExerciseRenderer renderer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final visuals = getExerciseVisuals(context, exercise.exerciseType);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
                style: theme.textTheme.labelSmall?.copyWith(
                  color: visuals.accent,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
        if (renderer.showsQuestion) ...[
          const SizedBox(height: 12),
          Text(
            exercise.question,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
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
  final ExerciseAnswer correctAnswer;
  final String? explanation;
  final int? score;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle : Icons.cancel,
                color: isCorrect ? Colors.green : c.error,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                isCorrect ? 'Correct!' : 'Incorrect',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: isCorrect ? Colors.green : c.error,
                ),
              ),
              const Spacer(),
              if (score != null)
                Text(
                  '+$score',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: c.primary,
                  ),
                ),
            ],
          ),
          if (!isCorrect) ...[
            const SizedBox(height: 8),
            Text(
              'Correct answer',
              style: theme.textTheme.labelMedium?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
          if (explanation != null && explanation!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(explanation!, style: theme.textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

class _ExercisePlayLoading extends StatelessWidget {
  const _ExercisePlayLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget buildOptionShimmer() {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: AppCard(
          padding: const EdgeInsets.all(16),
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
        title: const Text('Exercise'),
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
