import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/lesson_providers.dart';
import '../../data/lesson_repository.dart';
import '../../domain/lesson_models.dart';
import '../../domain/exercise_models.dart';
import '../../../../core/providers/providers.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../home/data/home_providers.dart';
import '../../../review/data/review_providers.dart';
import '../widgets/content_widgets.dart';
import '../widgets/vocabulary_step.dart';
import '../widgets/grammar_step.dart';
import '../widgets/exercise_step.dart';

class LessonWizardScreen extends ConsumerStatefulWidget {
  const LessonWizardScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  ConsumerState<LessonWizardScreen> createState() => _LessonWizardScreenState();
}

class _LessonWizardScreenState extends ConsumerState<LessonWizardScreen> {
  PageController? _pageController;
  int _currentPage = 0;
  List<_WizardStep> _steps = [];
  bool _loading = true;
  String? _error;
  LessonDetail? _lesson;
  final Map<String, int> _exerciseScores = {};
  final Set<String> _completedExercises = {};
  final Set<String> _learnedVocabIds = {};

  @override
  void initState() {
    super.initState();
    _loadLesson();
  }

  Future<void> _loadLesson() async {
    try {
      final repo = ref.read(lessonRepositoryProvider);
      final lesson = await repo.getLessonDetail(widget.lessonId);
      final vocabs = await repo.getVocabulariesByLesson(widget.lessonId);

      if (!mounted) return;

      final progress = await repo.getLessonProgress(widget.lessonId);
      if (!mounted) return;

      final isInProgress = progress != null &&
          (progress['status'] == 'in_progress' ||
              progress['status'] == 'IN_PROGRESS');

      final steps = <_WizardStep>[];

      for (final content in lesson.contents) {
        steps.add(_WizardStep(
          type: _StepType.content,
          label: _contentLabel(content.contentType),
          content: content,
        ));
      }

      if (vocabs.isNotEmpty) {
        steps.add(_WizardStep(
          type: _StepType.vocabulary,
          label: 'Vocabulary',
          vocabularies: vocabs,
        ));

        try {
          final vocabRepo = ref.read(vocabularyRepositoryProvider);
          final myVocabs = await vocabRepo.getMyVocabularies();
          final lessonVocabIds = vocabs.map((v) => v.id).toSet();
          for (final uv in myVocabs) {
            if (lessonVocabIds.contains(uv.vocabulary.id)) {
              _learnedVocabIds.add(uv.vocabulary.id);
            }
          }
        } catch (_) {}
      }

      if (lesson.grammarRules.isNotEmpty) {
        steps.add(_WizardStep(
          type: _StepType.grammar,
          label: 'Grammar',
          grammarRules: lesson.grammarRules,
        ));
      }

      if (lesson.exercises.isNotEmpty) {
        final exercises = await repo.getExercisesByLesson(widget.lessonId);
        if (!mounted) return;

        for (final exercise in exercises) {
          steps.add(_WizardStep(
            type: _StepType.exercise,
            label: 'Exercise',
            fullExercise: exercise,
          ));
        }
      }

      setState(() {
        _lesson = lesson;
        _steps = steps;
        _loading = false;
      });

      _pageController = PageController();

      await repo.startLesson(widget.lessonId);

      if (isInProgress && mounted && lesson.exercises.isNotEmpty) {
        _showResumeDialog();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _showResumeDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Continue lesson?'),
        content: const Text(
            'You have an in-progress lesson. Would you like to skip to the exercises?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Start from beginning'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _jumpToExercises();
            },
            child: const Text('Continue from exercises'),
          ),
        ],
      ),
    );
  }

  void _jumpToExercises() {
    final exerciseIndex =
        _steps.indexWhere((s) => s.type == _StepType.exercise);
    if (exerciseIndex >= 0 && _pageController != null) {
      _pageController!.animateToPage(
        exerciseIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  int get _totalScore => _exerciseScores.values.fold(0, (a, b) => a + b);

  int get _maxScore {
    return _steps
        .where((s) => s.type == _StepType.exercise && s.fullExercise != null)
        .length *
        10;
  }

  void _onExerciseScoreChanged(String exerciseId, int score) {
    setState(() {
      _exerciseScores[exerciseId] = score;
    });
  }

  void _onExerciseCompleted(String exerciseId) {
    setState(() {
      _completedExercises.add(exerciseId);
    });
  }

  @override
  void dispose() {
    _pageController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Lesson')),
        body: const _LessonLoadingSkeleton(),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Lesson')),
        body: _LessonError(
          message: _error!,
          onRetry: () {
            setState(() {
              _loading = true;
              _error = null;
            });
            _loadLesson();
          },
        ),
      );
    }

    if (_steps.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(_lesson?.title ?? 'Lesson')),
        body: const Center(child: Text('No content available')),
      );
    }

    final isLastStep = _currentPage == _steps.length - 1;
    final currentStep = _steps[_currentPage];
    final isExerciseStep = currentStep.type == _StepType.exercise;
    final isExerciseCompleted = isExerciseStep &&
        currentStep.fullExercise != null &&
        _completedExercises.contains(currentStep.fullExercise!.id);

    return Scaffold(
      appBar: AppBar(
        title: Text(_lesson?.title ?? 'Lesson'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_currentPage + 1) / _steps.length,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
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
                  'Step ${_currentPage + 1} of ${_steps.length}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _steps[_currentPage].label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (_exerciseScores.isNotEmpty) ...[
                  const Spacer(),
                  Text(
                    'Score: $_totalScore',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemCount: _steps.length,
              itemBuilder: (context, index) {
                return _buildStep(_steps[index]);
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
                      label: 'Go to previous step',
                      button: true,
                      child: OutlinedButton(
                        onPressed: () {
                          _pageController?.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: const Text('Back'),
                      ),
                    )
                  else
                    const SizedBox.shrink(),
                  const Spacer(),
                  if (!isLastStep && !isExerciseStep)
                    Semantics(
                      label: 'Go to next step',
                      button: true,
                      child: FilledButton(
                        onPressed: () {
                          _pageController?.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: const Text('Next'),
                      ),
                    )
                  else if (isExerciseStep && isExerciseCompleted && !isLastStep)
                    Semantics(
                      label: 'Go to next step',
                      button: true,
                      child: FilledButton(
                        onPressed: () {
                          _pageController?.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: const Text('Next'),
                      ),
                    )
                  else if (isLastStep && (!isExerciseStep || isExerciseCompleted))
                    Semantics(
                      label: 'Complete lesson',
                      button: true,
                      child: FilledButton(
                        onPressed: _completeLesson,
                        child: const Text('Complete'),
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
        return _buildContentWidget(step.content!);
      case _StepType.vocabulary:
        return VocabularyStepWidget(
          vocabularies: step.vocabularies ?? [],
          lessonId: widget.lessonId,
          learnedVocabIds: _learnedVocabIds,
          onVocabLearned: (id) => setState(() => _learnedVocabIds.add(id)),
        );
      case _StepType.grammar:
        return GrammarStepWidget(grammarRules: step.grammarRules ?? []);
      case _StepType.exercise:
        final exercise = step.fullExercise!;
        return ExerciseStepWidget(
          exercise: exercise,
          onScoreChanged: (score) =>
              _onExerciseScoreChanged(exercise.id, score),
          onCompleted: () => _onExerciseCompleted(exercise.id),
        );
    }
  }

  Widget _buildContentWidget(LessonContent content) {
    switch (content.contentType) {
      case 'text':
        return TextContentWidget(content: content);
      case 'audio':
        return AudioContentWidget(content: content);
      case 'image':
        return ImageContentWidget(content: content);
      case 'video':
        return VideoContentWidget(content: content);
      case 'dialogue':
        return DialogueContentWidget(content: content);
      default:
        return TextContentWidget(content: content);
    }
  }

  Future<void> _completeLesson() async {
    try {
      final repo = ref.read(lessonRepositoryProvider);
      final score = _maxScore > 0
          ? ((_totalScore / _maxScore) * 100).round()
          : 0;
      await repo.completeLesson(widget.lessonId, score: score);

      ref.invalidate(userProgressProvider);
      ref.invalidate(continueLearningProvider);
      ref.invalidate(lessonProgressProvider(widget.lessonId));

      if (mounted) {
        _showCompletionDialog(score);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error completing lesson: $e')),
        );
      }
    }
  }

  void _showCompletionDialog(int score) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.celebration, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            const Text('Lesson Complete!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Your score',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 8),
            Text(
              '$score%',
              style: theme.textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            if (_exerciseScores.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '${_exerciseScores.values.where((s) => s > 0).length} of ${_exerciseScores.length} exercises correct',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop();
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  String _contentLabel(String contentType) {
    return switch (contentType) {
      'text' => 'Reading',
      'audio' => 'Listening',
      'image' => 'Image',
      'video' => 'Video',
      'dialogue' => 'Dialogue',
      _ => 'Content',
    };
  }
}

enum _StepType { content, vocabulary, grammar, exercise }

class _WizardStep {
  const _WizardStep({
    required this.type,
    required this.label,
    this.content,
    this.vocabularies,
    this.grammarRules,
    this.fullExercise,
  });

  final _StepType type;
  final String label;
  final LessonContent? content;
  final List<LessonVocabulary>? vocabularies;
  final List<GrammarRule>? grammarRules;
  final Exercise? fullExercise;
}

class _LessonLoadingSkeleton extends StatelessWidget {
  const _LessonLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Shimmer.fromColors(
            baseColor: colorScheme.surfaceContainerHighest,
            highlightColor: colorScheme.surfaceContainerHigh,
            child: Container(
              height: 16,
              width: 150,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Shimmer.fromColors(
            baseColor: colorScheme.surfaceContainerHighest,
            highlightColor: colorScheme.surfaceContainerHigh,
            child: Container(
              height: 24,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Shimmer.fromColors(
            baseColor: colorScheme.surfaceContainerHighest,
            highlightColor: colorScheme.surfaceContainerHigh,
            child: Container(
              height: 16,
              width: 250,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Shimmer.fromColors(
            baseColor: colorScheme.surfaceContainerHighest,
            highlightColor: colorScheme.surfaceContainerHigh,
            child: Container(
              height: 16,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Shimmer.fromColors(
            baseColor: colorScheme.surfaceContainerHighest,
            highlightColor: colorScheme.surfaceContainerHigh,
            child: Container(
              height: 16,
              width: 200,
              decoration: BoxDecoration(
                color: Colors.white,
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Failed to load lesson'),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
