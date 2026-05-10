import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/lesson_providers.dart';
import '../../data/lesson_repository.dart';
import '../../domain/lesson_models.dart';
import '../../../../core/providers/providers.dart';
import '../widgets/content_widgets.dart';
import '../widgets/vocabulary_step.dart';
import '../widgets/grammar_step.dart';

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

      // Check for smart resume
      final progress = await repo.getLessonProgress(widget.lessonId);
      if (!mounted) return;

      final isInProgress = progress != null &&
          (progress['status'] == 'in_progress' ||
              progress['status'] == 'IN_PROGRESS');

      // Build steps
      final steps = <_WizardStep>[];

      // Content steps
      for (final content in lesson.contents) {
        steps.add(_WizardStep(
          type: _StepType.content,
          label: _contentLabel(content.contentType),
          content: content,
        ));
      }

      // Vocabulary step
      if (vocabs.isNotEmpty) {
        steps.add(_WizardStep(
          type: _StepType.vocabulary,
          label: 'Vocabulary',
          vocabularies: vocabs,
        ));
      }

      // Grammar step
      if (lesson.grammarRules.isNotEmpty) {
        steps.add(_WizardStep(
          type: _StepType.grammar,
          label: 'Grammar',
          grammarRules: lesson.grammarRules,
        ));
      }

      // Exercise placeholder steps
      if (lesson.exercises.isNotEmpty) {
        for (final exercise in lesson.exercises) {
          steps.add(_WizardStep(
            type: _StepType.exercise,
            label: 'Exercise',
            exercise: exercise,
          ));
        }
      }

      setState(() {
        _lesson = lesson;
        _steps = steps;
        _loading = false;
      });

      _pageController = PageController();

      // Start progress tracking
      await repo.startLesson(widget.lessonId);

      // Smart resume dialog
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
          // Step indicator
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
              ],
            ),
          ),
          // Page view
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
          // Navigation
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentPage > 0)
                    OutlinedButton(
                      onPressed: () {
                        _pageController?.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: const Text('Back'),
                    )
                  else
                    const SizedBox.shrink(),
                  const Spacer(),
                  if (_currentPage < _steps.length - 1)
                    FilledButton(
                      onPressed: () {
                        _pageController?.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: const Text('Next'),
                    )
                  else
                    FilledButton(
                      onPressed: _completeLesson,
                      child: const Text('Complete'),
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
        );
      case _StepType.grammar:
        return GrammarStepWidget(grammarRules: step.grammarRules ?? []);
      case _StepType.exercise:
        return _ExercisePlaceholder(exercise: step.exercise!);
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
      await repo.completeLesson(widget.lessonId, score: 0);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lesson completed!')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error completing lesson: $e')),
        );
      }
    }
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
    this.exercise,
  });

  final _StepType type;
  final String label;
  final LessonContent? content;
  final List<LessonVocabulary>? vocabularies;
  final List<GrammarRule>? grammarRules;
  final ExerciseStub? exercise;
}

class _ExercisePlaceholder extends StatelessWidget {
  const _ExercisePlaceholder({required this.exercise});
  final ExerciseStub exercise;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.quiz,
              size: 64,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'Exercise',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              exercise.exerciseType,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (exercise.question != null) ...[
              const SizedBox(height: 16),
              Text(
                exercise.question!,
                style: theme.textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 24),
            Text(
              'Exercise rendering coming soon',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }
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
