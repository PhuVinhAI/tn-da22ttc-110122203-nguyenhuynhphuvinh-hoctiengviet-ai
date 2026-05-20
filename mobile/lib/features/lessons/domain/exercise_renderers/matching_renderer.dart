import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class MatchingRenderer extends ExerciseRenderer {
  const MatchingRenderer();

  @override
  ExerciseType get type => ExerciseType.matching;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    if (answer is! List<MatchPair>) return false;
    final options = exercise.options as MatchingOptions;
    return answer.length == options.pairs.length;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    final matches = answer as List<MatchPair>;
    return {
      'matches': matches.map((m) => {'left': m.left, 'right': m.right}).toList(),
    };
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
    final options = exercise.options as MatchingOptions;
    final matches = (currentAnswer is List<MatchPair>) ? currentAnswer : <MatchPair>[];
    final matchedLeft = matches.map((m) => m.left).toSet();
    final matchedRight = matches.map((m) => m.right).toSet();
    final shuffledRight = List<String>.from(
      options.pairs.map((p) => p.right).toList(),
    )..shuffle();

    return _MatchingInput(
      leftItems: options.pairs.map((p) => p.left).toList(),
      rightItems: shuffledRight,
      matches: matches,
      matchedLeft: matchedLeft,
      matchedRight: matchedRight,
      onMatchAdded: (left, right) {
        final updated = List<MatchPair>.from(matches)
          ..add(MatchPair(left: left, right: right));
        onAnswerChanged(updated);
      },
      onMatchRemoved: (pair) {
        final updated = List<MatchPair>.from(matches)
          ..removeWhere((m) => m.left == pair.left && m.right == pair.right);
        onAnswerChanged(updated);
      },
    );
  }
}

class _MatchingInput extends StatefulWidget {
  const _MatchingInput({
    required this.leftItems,
    required this.rightItems,
    required this.matches,
    required this.matchedLeft,
    required this.matchedRight,
    required this.onMatchAdded,
    required this.onMatchRemoved,
  });

  final List<String> leftItems;
  final List<String> rightItems;
  final List<MatchPair> matches;
  final Set<String> matchedLeft;
  final Set<String> matchedRight;
  final void Function(String left, String right) onMatchAdded;
  final ValueChanged<MatchPair> onMatchRemoved;

  @override
  State<_MatchingInput> createState() => _MatchingInputState();
}

class _MatchingInputState extends State<_MatchingInput> {
  String? _selectedLeft;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getExerciseVisuals(context, ExerciseType.matching);
    final theme = Theme.of(context);

    return Column(
      children: [
        // Instruction bar
        Container(
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
                Icons.compare_arrows_rounded,
                size: 18,
                color: visuals.accent,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  _selectedLeft != null
                      ? 'Now tap the matching item on the right'
                      : 'Tap an item on the left to start matching',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: visuals.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              // Progress
              Text(
                '${widget.matches.length}/${widget.leftItems.length}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: visuals.accent,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Two columns
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left column
            Expanded(
              child: Column(
                children: widget.leftItems.map((item) {
                  final isMatched = widget.matchedLeft.contains(item);
                  final isSelected = _selectedLeft == item;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: GestureDetector(
                      onTap: isMatched
                          ? null
                          : () => setState(() => _selectedLeft = item),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.md,
                        ),
                        decoration: BoxDecoration(
                          color: isMatched
                              ? visuals.accent.withValues(alpha: 0.08)
                              : isSelected
                                  ? visuals.surface
                                  : c.card,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(
                            color: isMatched
                                ? visuals.accent.withValues(alpha: 0.30)
                                : isSelected
                                    ? visuals.accent
                                    : c.border,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            // Left accent strip
                            Container(
                              width: 4,
                              height: 24,
                              decoration: BoxDecoration(
                                color: isMatched || isSelected
                                    ? visuals.accent
                                    : c.border,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                item,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: isSelected || isMatched
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  color: isMatched
                                      ? visuals.accent
                                      : isSelected
                                          ? visuals.accent
                                          : c.foreground,
                                  decoration: isMatched
                                      ? TextDecoration.none
                                      : null,
                                ),
                              ),
                            ),
                            if (isMatched)
                              Icon(
                                Icons.check_circle_rounded,
                                size: 18,
                                color: visuals.accent,
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            // Center connector
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
              child: Column(
                children: List.generate(
                  widget.leftItems.length,
                  (index) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: SizedBox(
                      height: 50,
                      child: Center(
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          size: 16,
                          color: c.mutedForeground.withValues(alpha: 0.4),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Right column
            Expanded(
              child: Column(
                children: widget.rightItems.map((item) {
                  final isMatched = widget.matchedRight.contains(item);
                  final canSelect = _selectedLeft != null && !isMatched;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: GestureDetector(
                      onTap: canSelect
                          ? () {
                              widget.onMatchAdded(_selectedLeft!, item);
                              setState(() => _selectedLeft = null);
                            }
                          : null,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.md,
                        ),
                        decoration: BoxDecoration(
                          color: isMatched
                              ? visuals.accent.withValues(alpha: 0.08)
                              : canSelect
                                  ? visuals.surface
                                  : c.card,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(
                            color: isMatched
                                ? visuals.accent.withValues(alpha: 0.30)
                                : canSelect
                                    ? visuals.accent.withValues(alpha: 0.50)
                                    : c.border,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                item,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: isMatched
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  color: isMatched
                                      ? visuals.accent
                                      : canSelect
                                          ? c.foreground
                                          : c.foreground,
                                ),
                              ),
                            ),
                            if (isMatched)
                              Icon(
                                Icons.check_circle_rounded,
                                size: 18,
                                color: visuals.accent,
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),

        // Matched pairs display
        if (widget.matches.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.lg),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(
                  left: AppSpacing.xs,
                  bottom: AppSpacing.sm,
                ),
                child: Text(
                  'Matched Pairs',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: visuals.accent,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              ...widget.matches.map((pair) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: GestureDetector(
                    onTap: () => widget.onMatchRemoved(pair),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.md,
                      ),
                      decoration: BoxDecoration(
                        color: visuals.accent.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(
                          color: visuals.accent.withValues(alpha: 0.20),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              pair.left,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodySmall,
                                fontWeight: FontWeight.w600,
                                color: visuals.accent,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                            child: Icon(
                              Icons.arrow_forward_rounded,
                              size: 14,
                              color: visuals.accent.withValues(alpha: 0.6),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              pair.right,
                              textAlign: TextAlign.end,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodySmall,
                                fontWeight: FontWeight.w600,
                                color: visuals.accent,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: visuals.accent.withValues(alpha: 0.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ],
      ],
    );
  }
}
