import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/lesson_providers.dart';
import '../../data/lesson_repository.dart';
import '../../domain/exercise_models.dart';
import '../../domain/exercise_set_models.dart';
import '../../domain/exercise_renderer_registry.dart';

class ExercisePlayScreen extends ConsumerStatefulWidget {
  const ExercisePlayScreen({
    super.key,
    required this.lessonId,
    required this.tierValue,
  });

  final String lessonId;
  final String tierValue;

  @override
  ConsumerState<ExercisePlayScreen> createState() => _ExercisePlayScreenState();
}

class _ExercisePlayScreenState extends ConsumerState<ExercisePlayScreen> {
  List<Exercise> _exercises = [];
  int _currentIndex = 0;
  bool _loading = true;
  String? _error;
  ExerciseSetModel? _exerciseSet;

  dynamic _currentAnswer;
  bool _submitted = false;
  bool _submitting = false;
  ExerciseSubmissionResult? _result;
  String? _submitError;

  final Map<int, dynamic> _answers = {};
  final Map<int, ExerciseSubmissionResult> _results = {};

  @override
  void initState() {
    super.initState();
    _loadExercises();
  }

  Future<void> _loadExercises() async {
    try {
      final repo = ref.read(lessonRepositoryProvider);
      final tierSummary = await repo.getExerciseSetsByLesson(widget.lessonId);
      final tier = ExerciseTier.fromString(widget.tierValue);
      final progress = tierSummary.progressForTier(tier);

      if (progress == null) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = 'No exercises found for this tier';
        });
        return;
      }

      final sets = tierSummary.sets;
      final setId = sets.isNotEmpty ? sets.first : null;
      ExerciseSetModel? setModel;
      if (setId != null) {
        final allSets = await _findSetForTier(repo, widget.lessonId, tier);
        if (allSets != null) {
          setModel = allSets;
        }
      }

      final exercises = await repo.getExercisesByLesson(widget.lessonId);

      if (!mounted) return;
      setState(() {
        _exercises = exercises;
        _exerciseSet = setModel;
        _loading = false;
      });

      _loadCurrentAnswer();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<ExerciseSetModel?> _findSetForTier(
    LessonRepository repo,
    String lessonId,
    ExerciseTier tier,
  ) async {
    try {
      final response =
          await repo.getExerciseSetsByLesson(lessonId);
      for (final s in response.sets) {
        if (s.tier == tier) {
          return ExerciseSetModel(
            id: s.tier.value,
            lessonId: lessonId,
            tier: s.tier,
            title: s.title,
          );
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  void _loadCurrentAnswer() {
    if (_results.containsKey(_currentIndex)) {
      _result = _results[_currentIndex];
      _submitted = true;
    }
    _currentAnswer = _answers[_currentIndex];
    _submitted = _results.containsKey(_currentIndex);
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
      );

      _answers[_currentIndex] = _currentAnswer;
      _results[_currentIndex] = result;

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

  void _nextQuestion() {
    if (_isLastQuestion) return;
    setState(() {
      _currentIndex++;
      _submitted = false;
      _result = null;
      _submitError = null;
    });
    _loadCurrentAnswer();
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
            Icon(Icons.celebration, color: c.primary),
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
              ..._results.entries
                  .where((e) => !e.value.isCorrect)
                  .map((e) {
                final idx = e.key;
                final exercise = idx < _exercises.length ? _exercises[idx] : null;
                if (exercise == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Icon(Icons.close, size: 16, color: c.destructive),
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
            label: 'Return to tier selector',
            isPrimary: true,
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/lessons/${widget.lessonId}/exercises');
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        appBar: const AppAppBar(title: Text('Exercise')),
        body: const Center(child: AppSpinner()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: const AppAppBar(title: Text('Exercise')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!, style: theme.textTheme.bodyLarge),
              const SizedBox(height: 16),
              AppButton(
                label: 'Go back',
                variant: AppButtonVariant.primary,
                onPressed: () => context.go('/lessons/${widget.lessonId}/exercises'),
              ),
            ],
          ),
        ),
      );
    }

    if (_exercises.isEmpty) {
      return Scaffold(
        appBar: const AppAppBar(title: Text('Exercise')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('No exercises available for this tier'),
              const SizedBox(height: 16),
              AppButton(
                label: 'Go back',
                variant: AppButtonVariant.primary,
                onPressed: () => context.go('/lessons/${widget.lessonId}/exercises'),
              ),
            ],
          ),
        ),
      );
    }

    final exercise = _currentExercise!;
    final renderer = getRenderer(exercise.exerciseType);
    final progress = (_currentIndex + 1) / _exercises.length;

    return Scaffold(
      appBar: AppAppBar(
        title: Text(ExerciseTier.fromString(widget.tierValue).displayName),
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
            QuestionHeader(exercise: exercise),
            const SizedBox(height: 16),
            renderer.buildInput(
              exercise,
              context,
              _currentAnswer,
              (answer) {
                setState(() => _currentAnswer = answer);
              },
            ),
            if (_submitError != null) ...[
              const SizedBox(height: 16),
              AppCard(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: c.destructive, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _submitError!,
                        style: theme.textTheme.bodySmall?.copyWith(color: c.destructive),
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
    );
  }
}

class QuestionHeader extends StatelessWidget {
  const QuestionHeader({super.key, required this.exercise});
  final Exercise exercise;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppChip(
          label: exercise.exerciseType.name,
          variant: AppChipVariant.outline,
        ),
        const SizedBox(height: 12),
        Text(
          exercise.question,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
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
                color: isCorrect ? Colors.green : c.destructive,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                isCorrect ? 'Correct!' : 'Incorrect',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: isCorrect ? Colors.green : c.destructive,
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
            Text(
              explanation!,
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ],
      ),
    );
  }
}
