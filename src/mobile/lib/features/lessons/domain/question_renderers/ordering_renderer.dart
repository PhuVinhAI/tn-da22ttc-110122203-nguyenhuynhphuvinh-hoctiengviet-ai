import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../question_models.dart';
import '../question_renderer.dart';
import '../question_theme_helper.dart';

class OrderingRenderer extends QuestionRenderer {
  const OrderingRenderer();

  @override
  QuestionType get type => QuestionType.ordering;

  @override
  bool validateAnswer(Question question, dynamic answer) {
    if (answer is! List<String>) return false;
    final options = question.options as OrderingOptions;
    if (answer.length != options.items.length) return false;
    return answer.every((s) => s.trim().isNotEmpty);
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'orderedItems': answer as List<String>};
  }

  @override
  Widget buildQuestion(Question question, BuildContext context) {
    final c = AppTheme.colors(context);
    return Text(
      question.question ?? '',
      style: GoogleFonts.inter(
        fontSize: AppTypography.headlineSmall,
        fontWeight: FontWeight.w600,
        color: c.foreground,
      ),
    );
  }

  @override
  Widget buildInput(
    Question question,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = question.options as OrderingOptions;
    return _OrderingInput(
      options: options,
      currentAnswer: currentAnswer,
      onAnswerChanged: onAnswerChanged,
    );
  }
}

class _OrderingInput extends StatefulWidget {
  const _OrderingInput({
    required this.options,
    required this.currentAnswer,
    required this.onAnswerChanged,
  });

  final OrderingOptions options;
  final dynamic currentAnswer;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_OrderingInput> createState() => _OrderingInputState();
}

class _OrderingInputState extends State<_OrderingInput> {
  // Shuffled bank words (each index is independent — duplicates are fine).
  late List<String> _bankWords;
  late List<bool> _bankUsed;
  // For each slot in the row: bank index of the chosen chip (-1 = empty).
  late List<int> _placement;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void didUpdateWidget(covariant _OrderingInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.options != oldWidget.options) {
      _init();
    } else if (widget.currentAnswer is List<String> &&
        widget.currentAnswer != oldWidget.currentAnswer) {
      _restoreFromAnswer(widget.currentAnswer as List<String>);
    }
  }

  void _init() {
    _bankWords = List<String>.from(widget.options.items)..shuffle();
    _bankUsed = List<bool>.filled(_bankWords.length, false);
    _placement = List<int>.filled(widget.options.items.length, -1);
    if (widget.currentAnswer is List<String>) {
      final saved = widget.currentAnswer as List<String>;
      if (saved.isNotEmpty) _restoreFromAnswer(saved);
    }
  }

  void _restoreFromAnswer(List<String> saved) {
    _bankUsed = List<bool>.filled(_bankWords.length, false);
    _placement = List<int>.filled(widget.options.items.length, -1);
    for (int i = 0; i < saved.length && i < _placement.length; i++) {
      final word = saved[i];
      if (word.isEmpty) continue;
      final match = _firstUnusedMatch(word);
      if (match >= 0) {
        _bankUsed[match] = true;
        _placement[i] = match;
      }
    }
    setState(() {});
  }

  int _firstUnusedMatch(String word) {
    final target = word.trim().toLowerCase();
    for (int i = 0; i < _bankWords.length; i++) {
      if (_bankUsed[i]) continue;
      if (_bankWords[i].trim().toLowerCase() == target) return i;
    }
    return -1;
  }

  void _emit() {
    final out = List<String>.generate(_placement.length, (i) {
      final p = _placement[i];
      return p >= 0 ? _bankWords[p] : '';
    });
    widget.onAnswerChanged(out);
  }

  void _placeWord(int bankIndex) {
    if (_bankUsed[bankIndex]) return;
    final firstEmpty = _placement.indexOf(-1);
    if (firstEmpty < 0) return;
    setState(() {
      _placement[firstEmpty] = bankIndex;
      _bankUsed[bankIndex] = true;
    });
    _emit();
  }

  void _clearSlot(int slot) {
    final p = _placement[slot];
    if (p < 0) return;
    setState(() {
      _placement[slot] = -1;
      _bankUsed[p] = false;
    });
    _emit();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getQuestionVisuals(context, QuestionType.ordering);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Instruction header
        SizedBox(
          width: double.infinity,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: visuals.surface,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(
                color: visuals.accent.withValues(alpha: 0.20),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.touch_app_rounded,
                  size: 18,
                  color: visuals.accent,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Tap the words below to arrange them in the correct order',
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: visuals.accent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Answer row (horizontal slots wrapping if too wide)
        SizedBox(
          width: double.infinity,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Wrap(
              spacing: 8,
              runSpacing: 10,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                for (int i = 0; i < _placement.length; i++)
                  _AnswerSlot(
                    index: i,
                    filledWord: _placement[i] >= 0
                        ? _bankWords[_placement[i]]
                        : null,
                    accent: visuals.accent,
                    background: c.muted,
                    foreground: c.foreground,
                    onTap: () => _clearSlot(i),
                  ),
              ],
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        // Word bank
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: c.muted.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Wrap(
            spacing: 8,
            runSpacing: 6,
            alignment: WrapAlignment.center,
            children: [
              for (int i = 0; i < _bankWords.length; i++)
                _BankChip(
                  label: _bankWords[i],
                  used: _bankUsed[i],
                  accent: visuals.accent,
                  background: c.card,
                  foreground: c.foreground,
                  onTap: _bankUsed[i] ? null : () => _placeWord(i),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AnswerSlot extends StatelessWidget {
  const _AnswerSlot({
    required this.index,
    required this.filledWord,
    required this.accent,
    required this.background,
    required this.foreground,
    required this.onTap,
  });

  final int index;
  final String? filledWord;
  final Color accent;
  final Color background;
  final Color foreground;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final filled = filledWord != null && filledWord!.isNotEmpty;
    return IntrinsicWidth(
      child: InkWell(
        onTap: filled ? onTap : null,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          constraints: const BoxConstraints(minWidth: 44, minHeight: 36),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: filled ? accent.withValues(alpha: 0.10) : background,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: filled ? accent : accent.withValues(alpha: 0.30),
              width: filled ? 2 : 1.5,
            ),
          ),
          child: Center(
            child: filled
                ? Text(
                    filledWord!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      fontWeight: FontWeight.w700,
                      color: accent,
                    ),
                  )
                : Text(
                    '${index + 1}',
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      fontWeight: FontWeight.w700,
                      color: foreground.withValues(alpha: 0.35),
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _BankChip extends StatelessWidget {
  const _BankChip({
    required this.label,
    required this.used,
    required this.accent,
    required this.background,
    required this.foreground,
    required this.onTap,
  });

  final String label;
  final bool used;
  final Color accent;
  final Color background;
  final Color foreground;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 150),
      opacity: used ? 0.20 : 1.0,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: used
                    ? Colors.transparent
                    : accent.withValues(alpha: 0.30),
                width: 1.5,
              ),
              boxShadow: used
                  ? null
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
            ),
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                fontWeight: FontWeight.w700,
                color: foreground,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
