import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../question_models.dart';
import '../question_renderer.dart';
import '../question_theme_helper.dart';

class FillBlankRenderer extends QuestionRenderer {
  const FillBlankRenderer();

  @override
  QuestionType get type => QuestionType.fillBlank;

  @override
  bool get showsQuestion => false;

  @override
  bool validateAnswer(Question question, dynamic answer) {
    if (answer is! List<String>) return false;
    final options = question.options as FillBlankOptions;
    final blankCount = _countBlanks(options.sentence, options.blanks);
    if (answer.length != blankCount) return false;
    return answer.every((a) => a.trim().isNotEmpty);
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'answers': answer as List<String>};
  }

  @override
  Widget buildQuestion(Question question, BuildContext context) =>
      const SizedBox.shrink();

  @override
  Widget buildInput(
    Question question,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = question.options as FillBlankOptions;
    final segments = _parseSentence(options.sentence);
    final blankCount = segments.whereType<_BlankSegment>().length;
    final fallbackBlanks =
        blankCount > 0 ? blankCount : (options.blanks > 0 ? options.blanks : 1);
    final answers = (currentAnswer is List<String>)
        ? currentAnswer
        : List<String>.filled(fallbackBlanks, '');

    return _FillBlankInput(
      segments: segments.isEmpty
          ? List<_Segment>.generate(
              fallbackBlanks * 2 + 1,
              (i) => i.isEven ? const _TextSegment('') : const _BlankSegment(),
            )
          : segments,
      answers: answers,
      wordBank: options.wordBank,
      onAnswerChanged: onAnswerChanged,
    );
  }

  static int _countBlanks(String sentence, int fallback) {
    final matches = RegExp(r'_{3,}').allMatches(sentence).length;
    return matches > 0 ? matches : fallback;
  }
}

sealed class _Segment {
  const _Segment();
}

class _TextSegment extends _Segment {
  const _TextSegment(this.text);
  final String text;
}

class _BlankSegment extends _Segment {
  const _BlankSegment();
}

List<_Segment> _parseSentence(String sentence) {
  if (sentence.isEmpty) return const <_Segment>[];
  final result = <_Segment>[];
  final regex = RegExp(r'_{3,}');
  int cursor = 0;
  for (final match in regex.allMatches(sentence)) {
    if (match.start > cursor) {
      result.add(_TextSegment(sentence.substring(cursor, match.start)));
    }
    result.add(const _BlankSegment());
    cursor = match.end;
  }
  if (cursor < sentence.length) {
    result.add(_TextSegment(sentence.substring(cursor)));
  }
  return result;
}

class _FillBlankInput extends StatefulWidget {
  const _FillBlankInput({
    required this.segments,
    required this.answers,
    required this.wordBank,
    required this.onAnswerChanged,
  });

  final List<_Segment> segments;
  final List<String> answers;
  final List<String> wordBank;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_FillBlankInput> createState() => _FillBlankInputState();
}

class _FillBlankInputState extends State<_FillBlankInput> {
  late int _blankCount;
  // Per word-bank slot: how many times this word is currently consumed by
  // blanks. Keyed by index in [_bankWords] so duplicate words behave
  // independently (the same word can sit twice in the bank for two blanks).
  late List<String> _bankWords;
  late List<bool> _bankUsed;
  // For each blank: index into _bankWords (-1 = empty) of the chip placed.
  late List<int> _placement;

  @override
  void initState() {
    super.initState();
    _initState();
  }

  @override
  void didUpdateWidget(covariant _FillBlankInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newCount = widget.segments.whereType<_BlankSegment>().length;
    final wordBankChanged = !_listEq(oldWidget.wordBank, widget.wordBank);
    if (newCount != _blankCount || wordBankChanged) {
      _initState();
    }
  }

  void _initState() {
    _blankCount = widget.segments.whereType<_BlankSegment>().length;
    _bankWords = List<String>.from(widget.wordBank);
    _bankUsed = List<bool>.filled(_bankWords.length, false);
    _placement = List<int>.filled(_blankCount, -1);
    // Restore prior answers if any chip text matches an unused slot in the bank.
    for (int i = 0; i < _blankCount && i < widget.answers.length; i++) {
      final ans = widget.answers[i];
      if (ans.isEmpty) continue;
      final match = _firstUnusedMatch(ans);
      if (match >= 0) {
        _bankUsed[match] = true;
        _placement[i] = match;
      }
    }
  }

  int _firstUnusedMatch(String word) {
    final target = word.trim().toLowerCase();
    for (int i = 0; i < _bankWords.length; i++) {
      if (_bankUsed[i]) continue;
      if (_bankWords[i].trim().toLowerCase() == target) return i;
    }
    return -1;
  }

  bool _listEq(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  void _emit() {
    final out = List<String>.generate(_blankCount, (i) {
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

  void _clearBlank(int blankIndex) {
    final p = _placement[blankIndex];
    if (p < 0) return;
    setState(() {
      _placement[blankIndex] = -1;
      _bankUsed[p] = false;
    });
    _emit();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getQuestionVisuals(context, QuestionType.fillBlank);

    int blankIndex = 0;
    final inlineWidgets = <Widget>[];
    for (final seg in widget.segments) {
      switch (seg) {
        case _TextSegment(:final text):
          final parts = text.split(RegExp(r'(\s+)'));
          for (final part in parts) {
            if (part.isEmpty) continue;
            inlineWidgets.add(
              Text(
                part,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleSmall,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                  height: 1.8,
                ),
              ),
            );
          }
        case _BlankSegment():
          final i = blankIndex;
          final p = _placement[i];
          inlineWidgets.add(
            _BlankSlot(
              filledWord: p >= 0 ? _bankWords[p] : null,
              accent: visuals.accent,
              fillColor: c.muted,
              foreground: c.foreground,
              onTap: () => _clearBlank(i),
            ),
          );
          blankIndex++;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                    _blankCount > 1
                        ? S.of(context).fillBlanksCountParam(_blankCount)
                        : 'Tap a word to fill the blank',
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
        SizedBox(
          width: double.infinity,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Wrap(
              spacing: 6,
              runSpacing: 10,
              alignment: WrapAlignment.start,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: inlineWidgets,
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
              if (_bankWords.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Text(
                    'No words available',
                    style: GoogleFonts.inter(
                      color: c.mutedForeground,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _BlankSlot extends StatelessWidget {
  const _BlankSlot({
    required this.filledWord,
    required this.accent,
    required this.fillColor,
    required this.foreground,
    required this.onTap,
  });

  final String? filledWord;
  final Color accent;
  final Color fillColor;
  final Color foreground;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final filled = filledWord != null && filledWord!.isNotEmpty;
    final label = filled ? filledWord! : '___';
    final paddingH = filled ? 10.0 : 12.0;
    return IntrinsicWidth(
      child: InkWell(
        onTap: filled ? onTap : null,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          constraints: const BoxConstraints(minWidth: 48, minHeight: 36),
          padding: EdgeInsets.symmetric(horizontal: paddingH, vertical: 4),
          decoration: BoxDecoration(
            color: filled ? accent.withValues(alpha: 0.10) : fillColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: filled ? accent : accent.withValues(alpha: 0.40),
              width: filled ? 2 : 1.5,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: AppTypography.titleSmall,
                fontWeight: FontWeight.w700,
                color: filled ? accent : foreground.withValues(alpha: 0.5),
                height: 1.4,
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

// ignore: unused_element
String _typeAnswerHint(BuildContext context) => S.of(context).typeAnswerHint;
