import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/exercise_models.dart';
import '../../domain/exercise_set_models.dart';

enum CustomPracticeSheetMode { creation, info }

class CustomPracticeBottomSheet extends StatelessWidget {
  const CustomPracticeBottomSheet.creation({
    super.key,
    this.initialUserPrompt,
    required this.onSubmit,
  })  : mode = CustomPracticeSheetMode.creation,
        progress = null,
        onPlay = null,
        onRegenerate = null,
        onReset = null,
        onDelete = null,
        onCancel = null;

  const CustomPracticeBottomSheet.info({
    super.key,
    required this.progress,
    required this.onPlay,
    required this.onRegenerate,
    required this.onReset,
    required this.onDelete,
    this.onCancel,
  })  : mode = CustomPracticeSheetMode.info,
        initialUserPrompt = null,
        onSubmit = null;

  final CustomPracticeSheetMode mode;
  final String? initialUserPrompt;
  final Future<void> Function(CustomSetConfig config)? onSubmit;
  final SetProgress? progress;
  final VoidCallback? onPlay;
  final VoidCallback? onRegenerate;
  final VoidCallback? onReset;
  final VoidCallback? onDelete;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    return switch (mode) {
      CustomPracticeSheetMode.creation => _CreationForm(
          initialUserPrompt: initialUserPrompt,
          onSubmit: onSubmit!,
        ),
      CustomPracticeSheetMode.info => _InfoView(
          progress: progress!,
          onPlay: onPlay!,
          onRegenerate: onRegenerate!,
          onReset: onReset!,
          onDelete: onDelete!,
          onCancel: onCancel,
        ),
    };
  }
}

class _CreationForm extends StatefulWidget {
  const _CreationForm({
    this.initialUserPrompt,
    required this.onSubmit,
  });

  final String? initialUserPrompt;
  final Future<void> Function(CustomSetConfig config) onSubmit;

  @override
  State<_CreationForm> createState() => _CreationFormState();
}

class _CreationFormState extends State<_CreationForm> {
  double _questionCount = 10;
  final Set<String> _selectedTypes = {
    ExerciseType.multipleChoice.value,
    ExerciseType.matching.value,
  };
  FocusArea _focusArea = FocusArea.both;
  late final TextEditingController _userPromptController;
  bool _isSubmitting = false;

  static const _allExerciseTypes = ExerciseType.values;
  static const _maxUserPromptLength = 500;

  @override
  void initState() {
    super.initState();
    _userPromptController = TextEditingController(text: widget.initialUserPrompt ?? '');
  }

  @override
  void dispose() {
    _userPromptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.sm,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      'Configure custom practice',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: c.mutedForeground),
                    style: IconButton.styleFrom(
                      foregroundColor: c.mutedForeground,
                      minimumSize: const Size(48, 48),
                      fixedSize: const Size(48, 48),
                    ),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Number of questions: ${_questionCount.round()}',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  AppSlider(
                    value: _questionCount,
                    min: 1,
                    max: 30,
                    divisions: 29,
                    label: _questionCount.round().toString(),
                    onChanged: (v) => setState(() => _questionCount = v),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Exercise types',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: _allExerciseTypes.map((type) {
                      final selected = _selectedTypes.contains(type.value);
                      return AppChip(
                        label: _typeDisplayName(type),
                        isSelected: selected,
                        onTap: () {
                          setState(() {
                            if (!selected) {
                              _selectedTypes.add(type.value);
                            } else if (_selectedTypes.length > 1) {
                              _selectedTypes.remove(type.value);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Focus',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: FocusArea.values.map((fa) {
                      final selected = _focusArea == fa;
                      return AppChip(
                        label: fa.displayName,
                        isSelected: selected,
                        color: c.accent,
                        onTap: () => setState(() => _focusArea = fa),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Prompt (optional)',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  AppInput(
                    controller: _userPromptController,
                    hint: 'Describe what you want to focus on...',
                    maxLines: 3,
                    maxLength: _maxUserPromptLength,
                    keyboardType: TextInputType.multiline,
                    textCapitalization: TextCapitalization.sentences,
                    counterText: '',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  AppButton(
                    label: _isSubmitting ? 'Creating...' : 'Create exercises',
                    variant: AppButtonVariant.primary,
                    onPressed: _selectedTypes.isEmpty || _isSubmitting ? null : _handleSubmit,
                    icon: const Icon(Icons.auto_awesome),
                    isFullWidth: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _typeDisplayName(ExerciseType type) {
    return switch (type) {
      ExerciseType.multipleChoice => 'Multiple choice',
      ExerciseType.fillBlank => 'Fill in the blank',
      ExerciseType.matching => 'Matching',
      ExerciseType.ordering => 'Ordering',
      ExerciseType.translation => 'Translation',
      ExerciseType.listening => 'Listening',
    };
  }

  Future<void> _handleSubmit() async {
    setState(() => _isSubmitting = true);
    final userPrompt = _userPromptController.text.trim();
    final config = CustomSetConfig(
      questionCount: _questionCount.round(),
      exerciseTypes: _selectedTypes.toList(),
      focusArea: _focusArea,
      userPrompt: userPrompt.isEmpty ? null : userPrompt,
    );
    await widget.onSubmit(config);
    if (mounted) setState(() => _isSubmitting = false);
  }
}

class _InfoView extends StatelessWidget {
  const _InfoView({
    required this.progress,
    required this.onPlay,
    required this.onRegenerate,
    required this.onReset,
    required this.onDelete,
    this.onCancel,
  });

  final SetProgress progress;
  final VoidCallback onPlay;
  final VoidCallback onRegenerate;
  final VoidCallback onReset;
  final VoidCallback onDelete;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.sm,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      progress.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: c.mutedForeground),
                    style: IconButton.styleFrom(
                      foregroundColor: c.mutedForeground,
                      minimumSize: const Size(48, 48),
                      fixedSize: const Size(48, 48),
                    ),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (progress.description != null &&
                      progress.description!.isNotEmpty) ...[
                    Text(
                      progress.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                  ],
                  _ConfigSummary(progress: progress),
                  const SizedBox(height: AppSpacing.lg),
                  _ProgressStats(progress: progress),
                  const SizedBox(height: AppSpacing.xl),
                  AppButton(
                    label: progress.isNotStarted
                        ? 'Start practice'
                        : progress.isInProgress
                            ? 'Continue practice'
                            : 'Practice again',
                    variant: AppButtonVariant.primary,
                    onPressed: onPlay,
                    icon: Icon(progress.isNotStarted
                        ? Icons.play_arrow
                        : Icons.arrow_forward),
                    isFullWidth: true,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  AppButton(
                    label: 'Regenerate exercises',
                    variant: AppButtonVariant.secondary,
                    onPressed: onRegenerate,
                    icon: const Icon(Icons.auto_awesome),
                    isFullWidth: true,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: 'Reset progress',
                          variant: AppButtonVariant.outline,
                          onPressed: onReset,
                          icon: const Icon(Icons.replay),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: AppButton(
                          label: 'Delete',
                          variant: AppButtonVariant.danger,
                          onPressed: onDelete,
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ),
                    ],
                  ),
                  if (onCancel != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    AppButton(
                      label: 'Cancel',
                      variant: AppButtonVariant.outline,
                      onPressed: onCancel,
                      isFullWidth: true,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConfigSummary extends StatelessWidget {
  const _ConfigSummary({required this.progress});

  final SetProgress progress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.muted.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Icon(Icons.settings_outlined, size: 18, color: c.mutedForeground),
          const SizedBox(width: AppSpacing.sm),
          Text(
            '${progress.totalExercises} questions',
            style: theme.textTheme.bodySmall?.copyWith(
              color: c.mutedForeground,
            ),
          ),
          if (progress.userPrompt != null &&
              progress.userPrompt!.isNotEmpty) ...[
            const SizedBox(width: AppSpacing.sm),
            Container(
              width: 1,
              height: 14,
              color: c.border,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                progress.userPrompt!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProgressStats extends StatelessWidget {
  const _ProgressStats({required this.progress});

  final SetProgress progress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Row(
      children: [
        Expanded(
          child: _StatItem(
            label: 'Progress',
            value: '${progress.percentComplete.round()}%',
            color: c.primary,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _StatItem(
            label: 'Accuracy',
            value: '${progress.percentCorrect.round()}%',
            color: c.accent,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _StatItem(
            label: 'Completed',
            value: '${progress.attempted}/${progress.totalExercises}',
            color: progress.isCompleted ? c.success : c.mutedForeground,
          ),
        ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}
