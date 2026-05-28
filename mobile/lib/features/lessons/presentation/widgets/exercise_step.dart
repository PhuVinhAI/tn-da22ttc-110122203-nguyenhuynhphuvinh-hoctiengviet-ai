import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/lesson_providers.dart';
import '../../domain/exercise_models.dart';
import '../../domain/exercise_renderer.dart';
import '../../domain/exercise_renderer_registry.dart';
import 'question_header.dart';
import 'timer_bar.dart';
import 'submit_button.dart';
import 'explanation_panel.dart';

class ExerciseStepWidget extends ConsumerStatefulWidget {
  const ExerciseStepWidget({
    super.key,
    required this.exercise,
    required this.onScoreChanged,
    this.onCompleted,
    this.initialAnswer,
    this.initialResult,
    this.onAnswerChanged,
    this.onResultChanged,
  });

  final Exercise exercise;
  final ValueChanged<int> onScoreChanged;
  final VoidCallback? onCompleted;
  final dynamic initialAnswer;
  final ExerciseSubmissionResult? initialResult;
  final ValueChanged<dynamic>? onAnswerChanged;
  final ValueChanged<ExerciseSubmissionResult>? onResultChanged;

  @override
  ConsumerState<ExerciseStepWidget> createState() => _ExerciseStepWidgetState();
}

class _ExerciseStepWidgetState extends ConsumerState<ExerciseStepWidget> {
  late dynamic _currentAnswer;
  late bool _submitted;
  bool _submitting = false;
  ExerciseSubmissionResult? _result;
  String? _error;
  final Stopwatch _questionTimer = Stopwatch();

  ExerciseRenderer get _renderer => getRenderer(widget.exercise.exerciseType);

  bool get _isValid =>
      _renderer.validateAnswer(widget.exercise, _currentAnswer);

  @override
  void initState() {
    super.initState();
    _currentAnswer = widget.initialAnswer;
    _submitted = widget.initialResult != null;
    _result = widget.initialResult;
    _syncQuestionTimer();
  }

  @override
  void didUpdateWidget(covariant ExerciseStepWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.exercise.id != widget.exercise.id) {
      _currentAnswer = widget.initialAnswer;
      _submitted = widget.initialResult != null;
      _result = widget.initialResult;
      _syncQuestionTimer();
    }
  }

  void _syncQuestionTimer() {
    if (_submitted) {
      _questionTimer.stop();
      return;
    }
    _questionTimer
      ..reset()
      ..start();
  }

  Future<void> _submit() async {
    if (!_isValid || _submitted || _submitting) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final repo = ref.read(lessonRepositoryProvider);
      final payload = _renderer.buildAnswerPayload(_currentAnswer);
      final result = await repo.submitExerciseAnswer(
        widget.exercise.id,
        payload,
        timeSpent: _questionTimer.elapsed.inSeconds,
      );

      if (!mounted) return;

      setState(() {
        _result = result;
        _submitted = true;
        _submitting = false;
      });

      widget.onResultChanged?.call(result);

      if (result.isCorrect) {
        widget.onScoreChanged(result.score);
      }

      widget.onCompleted?.call();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _submitting = false;
      });
    }
  }

  void _onTimeout() {
    if (_submitted) return;
    if (_isValid) {
      _submit();
    } else {
      setState(() {
        _submitted = true;
        _submitting = false;
      });
      widget.onCompleted?.call();
    }
  }

  void _handleAnswerChanged(dynamic answer) {
    setState(() => _currentAnswer = answer);
    widget.onAnswerChanged?.call(answer);
    if (widget.exercise.exerciseType == ExerciseType.speaking &&
        answer is String &&
        answer.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !_submitted && !_submitting && _isValid) {
          _submit();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!_submitted)
            TimerBar(
              totalSeconds: widget.exercise.exerciseType.timerSeconds,
              onTimeout: _onTimeout,
            )
          else
            const SizedBox(height: 8),
          const SizedBox(height: 24),
          QuestionHeader(
            exercise: widget.exercise,
            exerciseRenderer: _renderer,
          ),
          const SizedBox(height: 24),
          if (!_submitted)
            _renderer.buildInput(
              widget.exercise,
              context,
              _currentAnswer,
              _handleAnswerChanged,
            )
          else ...[
            _renderer.buildInput(
              widget.exercise,
              context,
              _currentAnswer,
              (_) {},
            ),
          ],
          const SizedBox(height: 24),
          if (_error != null) ...[
            AppCard(
              variant: AppCardVariant.filled,
              color: c.error,
              borderRadius: AppRadius.md,
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Text(_error!, style: TextStyle(color: c.errorForeground)),
            ),
            const SizedBox(height: 16),
          ],
          if (!_submitted)
            SubmitButton(
              isEnabled: _isValid,
              isLoading: _submitting,
              onPressed: _submit,
            ),
          if (_submitted && _result != null) ...[
            ExplanationPanel(
              isCorrect: _result!.isCorrect,
              correctAnswer: _correctAnswerText(),
              explanation: widget.exercise.explanation,
              score: _result!.score,
            ),
          ],
        ],
      ),
    );
  }

  String _correctAnswerText() {
    final answer = widget.exercise.correctAnswer;
    return switch (answer) {
      MultipleChoiceAnswer(:final selectedChoice) => selectedChoice,
      FillBlankAnswer(:final answers) => answers.join(', '),
      MatchingAnswer(:final matches) =>
        matches.map((m) => '${m.left} → ${m.right}').join(', '),
      OrderingAnswer(:final orderedItems) => orderedItems.join(' → '),
      TranslationAnswer(:final translation) => translation,
      ListeningAnswer(:final transcript) => transcript,
      SpeakingAnswer(:final transcript) => transcript,
    };
  }
}
