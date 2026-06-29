import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/lesson_providers.dart';
import '../../domain/question_models.dart';
import '../../domain/question_renderer.dart';
import '../../domain/question_renderer_registry.dart';
import 'question_header.dart';
import 'timer_bar.dart';
import 'submit_button.dart';
import 'explanation_panel.dart';

class QuestionStepWidget extends ConsumerStatefulWidget {
  const QuestionStepWidget({
    super.key,
    required this.question,
    required this.onScoreChanged,
    this.onCompleted,
    this.initialAnswer,
    this.initialResult,
    this.onAnswerChanged,
    this.onResultChanged,
  });

  final Question question;
  final ValueChanged<int> onScoreChanged;
  final VoidCallback? onCompleted;
  final dynamic initialAnswer;
  final ExerciseSubmissionResult? initialResult;
  final ValueChanged<dynamic>? onAnswerChanged;
  final ValueChanged<ExerciseSubmissionResult>? onResultChanged;

  @override
  ConsumerState<QuestionStepWidget> createState() => _QuestionStepWidgetState();
}

class _QuestionStepWidgetState extends ConsumerState<QuestionStepWidget> {
  late dynamic _currentAnswer;
  late bool _submitted;
  bool _submitting = false;
  ExerciseSubmissionResult? _result;
  String? _error;
  final Stopwatch _questionTimer = Stopwatch();

  QuestionRenderer get _renderer => getRenderer(widget.question.questionType);

  bool get _isValid =>
      _renderer.validateAnswer(widget.question, _currentAnswer);

  @override
  void initState() {
    super.initState();
    _currentAnswer = widget.initialAnswer;
    _submitted = widget.initialResult != null;
    _result = widget.initialResult;
    _syncQuestionTimer();
  }

  @override
  void didUpdateWidget(covariant QuestionStepWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.question.id != widget.question.id) {
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
      final result = await repo.submitQuestionAnswer(
        widget.question.id,
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
    if (widget.question.questionType == QuestionType.speaking &&
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
              totalSeconds: widget.question.questionType.timerSeconds,
              onTimeout: _onTimeout,
            )
          else
            const SizedBox(height: 8),
          const SizedBox(height: 24),
          QuestionHeader(
            question: widget.question,
            renderer: _renderer,
          ),
          const SizedBox(height: 24),
          if (!_submitted)
            _renderer.buildInput(
              widget.question,
              context,
              _currentAnswer,
              _handleAnswerChanged,
            )
          else ...[
            _renderer.buildInput(
              widget.question,
              context,
              _currentAnswer,
              (_) {},
            ),
          ],
          const SizedBox(height: 24),
          if (_error != null) ...[
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.error_outline, size: 18, color: c.error),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      _error!,
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
              explanation: widget.question.explanation,
              score: _result!.score,
            ),
          ],
        ],
      ),
    );
  }

  String _correctAnswerText() {
    final answer = widget.question.correctAnswer;
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
