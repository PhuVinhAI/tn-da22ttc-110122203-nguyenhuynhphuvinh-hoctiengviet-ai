import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class FillBlankRenderer extends ExerciseRenderer {
  const FillBlankRenderer();

  @override
  ExerciseType get type => ExerciseType.fillBlank;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    if (answer is! List<String>) return false;
    final options = exercise.options as FillBlankOptions;
    if (answer.length != options.blanks) return false;
    return answer.every((a) => a.trim().isNotEmpty);
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'answers': answer as List<String>};
  }

  @override
  Widget buildQuestion(Exercise exercise, BuildContext context) {
    return Text(
      exercise.question,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }

  @override
  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = exercise.options as FillBlankOptions;
    final answers = (currentAnswer is List<String>)
        ? currentAnswer
        : List<String>.filled(options.blanks, '');

    return _FillBlankInput(
      blanks: options.blanks,
      answers: answers,
      question: exercise.question,
      onAnswerChanged: onAnswerChanged,
    );
  }
}

class _FillBlankInput extends StatefulWidget {
  const _FillBlankInput({
    required this.blanks,
    required this.answers,
    required this.question,
    required this.onAnswerChanged,
  });

  final int blanks;
  final List<String> answers;
  final String question;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_FillBlankInput> createState() => _FillBlankInputState();
}

class _FillBlankInputState extends State<_FillBlankInput> {
  late List<TextEditingController> _controllers;
  late List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      widget.blanks,
      (i) => TextEditingController(text: widget.answers[i]),
    );
    _focusNodes = List.generate(widget.blanks, (_) => FocusNode());
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _onChanged() {
    final updated = _controllers.map((c) => c.text).toList();
    widget.onAnswerChanged(updated);
  }

  static const _circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getExerciseVisuals(context, ExerciseType.fillBlank);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Sentence context card
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: visuals.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.20),
              width: 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.text_fields_rounded,
                size: 20,
                color: visuals.accent,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  widget.blanks == 1
                      ? 'Fill in the missing word'
                      : 'Fill in the ${widget.blanks} missing words',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: visuals.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // Blank fields
        ...List.generate(widget.blanks, (index) {
          final isFilled = _controllers[index].text.trim().isNotEmpty;
          final numberLabel = index < _circledNumbers.length
              ? _circledNumbers[index]
              : '${index + 1}';

          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.lg),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Number badge
                Container(
                  width: 32,
                  height: 32,
                  margin: const EdgeInsets.only(top: 10),
                  decoration: BoxDecoration(
                    color: isFilled
                        ? visuals.accent
                        : visuals.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                  ),
                  child: Center(
                    child: Text(
                      numberLabel,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        fontWeight: FontWeight.w700,
                        color: isFilled
                            ? Colors.white
                            : visuals.accent,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Input field
                Expanded(
                  child: TextFormField(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    onChanged: (_) => _onChanged(),
                    textInputAction: index < widget.blanks - 1
                        ? TextInputAction.next
                        : TextInputAction.done,
                    onFieldSubmitted: (_) {
                      if (index < widget.blanks - 1) {
                        _focusNodes[index + 1].requestFocus();
                      }
                    },
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyLarge,
                      fontWeight: FontWeight.w500,
                      color: c.foreground,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Type answer here...',
                      hintStyle: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        color: c.mutedForeground,
                        fontStyle: FontStyle.italic,
                      ),
                      filled: true,
                      fillColor: c.muted,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        borderSide: BorderSide(
                          color: visuals.accent.withValues(alpha: 0.50),
                          width: 1.5,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        borderSide: BorderSide(
                          color: visuals.accent.withValues(alpha: 0.50),
                          width: 1.5,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        borderSide: BorderSide(
                          color: visuals.accent,
                          width: 2,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.md,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
