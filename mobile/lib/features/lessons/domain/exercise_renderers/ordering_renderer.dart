import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class OrderingRenderer extends ExerciseRenderer {
  const OrderingRenderer();

  @override
  ExerciseType get type => ExerciseType.ordering;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    if (answer is! List<String>) return false;
    final options = exercise.options as OrderingOptions;
    return answer.length == options.items.length;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'orderedItems': answer as List<String>};
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
    final options = exercise.options as OrderingOptions;
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
  late List<String> _items;

  @override
  void initState() {
    super.initState();
    _initItems();
  }

  @override
  void didUpdateWidget(covariant _OrderingInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentAnswer is List<String> &&
        (widget.currentAnswer as List<String>).isNotEmpty &&
        widget.currentAnswer != oldWidget.currentAnswer) {
      _items = List<String>.from(widget.currentAnswer as List<String>);
    }
  }

  void _initItems() {
    if (widget.currentAnswer is List<String> &&
        (widget.currentAnswer as List<String>).isNotEmpty) {
      _items = List<String>.from(widget.currentAnswer as List<String>);
    } else {
      _items = List<String>.from(widget.options.items)..shuffle();
    }
  }

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final item = _items.removeAt(oldIndex);
      _items.insert(newIndex, item);
    });
    widget.onAnswerChanged(List<String>.from(_items));
  }

  static const _circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getExerciseVisuals(context, ExerciseType.ordering);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Instruction header
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
                Icons.swap_vert_rounded,
                size: 18,
                color: visuals.accent,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Drag the handle to arrange in the correct order',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: visuals.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Reorderable list
        ReorderableListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _items.length,
          onReorder: _onReorder,

          proxyDecorator: (child, index, animation) {
            // No elevation/shadow — just render the child as-is
            return Material(
              color: Colors.transparent,
              elevation: 0,
              child: child,
            );
          },
          itemBuilder: (context, index) {
            final isLast = index == _items.length - 1;
            final numberLabel = index < _circledNumbers.length
                ? _circledNumbers[index]
                : '${index + 1}';

            return Column(
              key: ValueKey(_items[index]),
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: c.card,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: c.border, width: 1),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.md,
                    ),
                    child: Row(
                      children: [
                        // Position number
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: visuals.accent.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                          ),
                          child: Center(
                            child: Text(
                              numberLabel,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodyMedium,
                                fontWeight: FontWeight.w700,
                                color: visuals.accent,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        // Item text
                        Expanded(
                          child: Text(
                            _items[index],
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w500,
                              color: c.foreground,
                            ),
                          ),
                        ),
                        // Drag handle (visual indicator)
                        Padding(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _GripDot(color: c.mutedForeground),
                                  const SizedBox(width: 4),
                                  _GripDot(color: c.mutedForeground),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _GripDot(color: c.mutedForeground),
                                  const SizedBox(width: 4),
                                  _GripDot(color: c.mutedForeground),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _GripDot(color: c.mutedForeground),
                                  const SizedBox(width: 4),
                                  _GripDot(color: c.mutedForeground),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Down arrow between items (except last)
                if (!isLast)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 20,
                      color: visuals.accent.withValues(alpha: 0.40),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _GripDot extends StatelessWidget {
  const _GripDot({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 4,
      height: 4,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.40),
        shape: BoxShape.circle,
      ),
    );
  }
}
