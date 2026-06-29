import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../profile/data/profile_providers.dart';
import '../../data/daily_goals_providers.dart';
import '../../data/notification_service.dart';
import '../../domain/daily_goal_models.dart';

String _goalTypeLabel(BuildContext context, GoalType type) {
  final s = S.of(context);
  return switch (type) {
    GoalType.questions => s.questionsTitle,
    GoalType.simulations => s.scenariosTried,
    GoalType.lessons => s.lessonsTitle,
  };
}

// ─── Shared building blocks ──────────────────────────────────────────────

/// A flat card that wraps rows, inserting full-width dividers between them.
class _GoalsShellCard extends StatelessWidget {
  const _GoalsShellCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Container(height: 1, color: c.border),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _GoalRow extends StatelessWidget {
  const _GoalRow({
    required this.icon,
    required this.title,
    this.subtitle,
    this.titleColor,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? titleColor;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = c.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, color: accent, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        fontWeight: FontWeight.w600,
                        color: titleColor ?? c.foreground,
                        height: 1.2,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          color: c.mutedForeground,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: AppSpacing.sm),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Section ─────────────────────────────────────────────────────────────

class DailyGoalSection extends ConsumerWidget {
  const DailyGoalSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final goalsAsync = ref.watch(dailyGoalsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: AppSpacing.md),
          child: Text(
            S.of(context).dailyGoals,
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleSmall,
              fontWeight: FontWeight.w700,
              color: c.foreground,
              height: 1.2,
            ),
          ),
        ),
        goalsAsync.when(
          loading: () => const _DailyGoalsLoading(),
          error: (error, stack) => _GoalsError(
            onRetry: () => ref.read(dailyGoalsProvider.notifier).refresh(),
          ),
          data: (goals) => _GoalsCard(goals: goals),
        ),
      ],
    );
  }
}

class _GoalsError extends StatelessWidget {
  const _GoalsError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.error.withValues(alpha: 0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.error_outline_rounded, color: c.error, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  S.of(context).failedToLoadGoals,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: S.of(context).retryButton,
            variant: AppButtonVariant.outline,
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

class _GoalsCard extends ConsumerWidget {
  const _GoalsCard({required this.goals});
  final List<DailyGoal> goals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);

    return _GoalsShellCard(
      children: [
        if (goals.isEmpty)
          _EmptyGoals(onAdd: () => _showAddGoalDialog(context, ref))
        else
          ...goals.map((goal) => _GoalTile(goal: goal)),
        if (goals.isNotEmpty)
          _GoalRow(
            icon: Icons.add,
            title: S.of(context).addGoalTitle,
            titleColor: c.primary,
            onTap: () => _showAddGoalDialog(context, ref),
          ),
        const _NotificationSettings(),
      ],
    );
  }

  void _showAddGoalDialog(BuildContext context, WidgetRef ref) {
    final existingTypes = goals.map((g) => g.goalType).toSet();
    final availableTypes = GoalType.values
        .where((t) => !existingTypes.contains(t))
        .toList();

    if (availableTypes.isEmpty) {
      AppToast.show(context,
          message: S.of(context).alreadyHaveAll3GoalTypes, type: AppToastType.info);
      return;
    }

    _showGoalPickerDialog(context, ref, availableTypes);
  }

  void _showGoalPickerDialog(
    BuildContext context,
    WidgetRef ref,
    List<GoalType> availableTypes,
  ) {
    final onlyType =
        availableTypes.length == 1 ? availableTypes.first : null;
    GoalType? selectedType = availableTypes.first;
    int targetValue = selectedType.defaultTarget;

    AppDialog.show(
      context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setState) => AppDialog(
          title: S.of(context).addGoalTitle,
          contentWidget: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (onlyType == null) ...[
                AppDropdownField<GoalType>(
                  label: S.of(context).goalTypeLabel,
                  value: selectedType,
                  items: availableTypes,
                  itemLabelBuilder: (t) => _goalTypeLabel(context, t),
                  onChanged: (type) {
                    setState(() {
                      selectedType = type;
                      targetValue = type!.defaultTarget;
                    });
                  },
                ),
                const SizedBox(height: 16),
              ] else ...[
                Row(
                  children: [
                    Icon(onlyType.icon, color: AppTheme.colors(context).primary),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      _goalTypeLabel(context, onlyType),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              _TargetSlider(
                goalType: onlyType ?? selectedType!,
                value: targetValue,
                onChanged: (v) => setState(() => targetValue = v),
              ),
            ],
          ),
          actions: [
            AppDialogAction(
              label: S.of(context).cancelButton,
              onPressed: () => Navigator.pop(context),
            ),
            AppDialogAction(
              label: S.of(context).addLabel,
              isPrimary: true,
              onPressed: () async {
                final goalType = onlyType ?? selectedType!;
                Navigator.pop(context);
                try {
                  await ref
                      .read(dailyGoalsProvider.notifier)
                      .createGoal(goalType, targetValue);
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(context,
                        message: S.of(context).errorParam(e.toString()),
                        type: AppToastType.error);
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyGoals extends StatelessWidget {
  const _EmptyGoals({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: c.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.emoji_events_outlined, size: 28, color: c.primary),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            S.of(context).noGoalsSetYet,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              fontWeight: FontWeight.w700,
              color: c.foreground,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            S.of(context).addGoalToTrackProgress,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: S.of(context).addGoalTitle,
            variant: AppButtonVariant.primary,
            icon: const Icon(Icons.add),
            onPressed: onAdd,
          ),
        ],
      ),
    );
  }
}

class _GoalTile extends ConsumerWidget {
  const _GoalTile({required this.goal});
  final DailyGoal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);

    return _GoalRow(
      icon: goal.goalType.icon,
      title: _goalTypeLabel(context, goal.goalType),
      subtitle: '${goal.targetValue} ${goal.goalType.unit}/day',
      onTap: () => _showActions(context, ref),
      trailing: Icon(Icons.more_vert, size: 20, color: c.mutedForeground),
    );
  }

  void _showActions(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    AppMenuBottomSheet.show(
      context,
      title: _goalTypeLabel(context, goal.goalType),
      items: [
        AppMenuBottomSheetItem(
          label: S.of(context).editGoalTitle(_goalTypeLabel(context, goal.goalType)),
          icon: Icons.edit_outlined,
          onTap: () => _showEditDialog(context, ref),
        ),
        AppMenuBottomSheetItem(
          label: S.of(context).deleteLabel,
          icon: Icons.delete_outline,
          foregroundColor: c.error,
          onTap: () => _showDeleteConfirm(context, ref),
        ),
      ],
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref) {
    int targetValue = goal.targetValue;

    AppDialog.show(
      context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setState) => AppDialog(
          title: S.of(context).editGoalTitle(_goalTypeLabel(context, goal.goalType)),
          contentWidget: _TargetSlider(
            goalType: goal.goalType,
            value: targetValue,
            onChanged: (v) => setState(() => targetValue = v),
          ),
          actions: [
            AppDialogAction(
              label: S.of(context).cancelButton,
              onPressed: () => Navigator.pop(context),
            ),
            AppDialogAction(
              label: S.of(context).saveLabel,
              isPrimary: true,
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ref
                      .read(dailyGoalsProvider.notifier)
                      .updateGoal(goal.id, targetValue);
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(context,
                        message: S.of(context).errorParam(e.toString()),
                        type: AppToastType.error);
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, WidgetRef ref) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        icon: Icons.delete_outline,
        iconColor: AppTheme.colors(dialogCtx).error,
        title: S.of(dialogCtx).deleteGoal,
        content: S.of(dialogCtx).deleteGoalPermanentlyQuestion(_goalTypeLabel(dialogCtx, goal.goalType)),
        actions: [
          AppDialogAction(
            label: S.of(dialogCtx).cancelButton,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(dialogCtx).deleteLabel,
            isPrimary: true,
            isDestructive: true,
            onPressed: () async {
              Navigator.pop(dialogCtx);
              try {
                await ref
                    .read(dailyGoalsProvider.notifier)
                    .deleteGoal(goal.id);
              } catch (e) {
                if (dialogCtx.mounted) {
                  AppToast.show(dialogCtx,
                      message: S.of(dialogCtx).errorParam(e.toString()),
                      type: AppToastType.error);
                }
              }
            },
          ),
        ],
      ),
    );
  }
}

class _TargetSlider extends StatelessWidget {
  const _TargetSlider({
    required this.goalType,
    required this.value,
    required this.onChanged,
  });

  final GoalType goalType;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final (min, max) = goalType.range;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Center(
          child: Column(
            children: [
              Text(
                '$value',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: c.primary,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                '${goalType.unit}/day',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: c.mutedForeground,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AppSlider(
          value: value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: (max - min) ~/ goalType.step,
          label: '$value',
          onChanged: (v) => onChanged(v.round()),
        ),
        const SizedBox(height: AppSpacing.xs),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$min',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: c.mutedForeground)),
            Text('$max',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: c.mutedForeground)),
          ],
        ),
      ],
    );
  }
}

class _NotificationSettings extends ConsumerWidget {
  const _NotificationSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (profile) {
        return Column(
          children: [
            _GoalRow(
              icon: Icons.notifications_outlined,
              title: S.of(context).goalReminders,
              trailing: AppSwitch(
                value: profile.notificationEnabled,
                onChanged: (value) => _onToggle(context, ref, value),
              ),
            ),
            if (profile.notificationEnabled)
              Container(
                height: 1,
                color: c.border,
              ),
            if (profile.notificationEnabled)
              _GoalRow(
                icon: Icons.access_time,
                title: S.of(context).reminderTime,
                subtitle: profile.notificationTime,
                trailing: Icon(Icons.chevron_right,
                    color: c.mutedForeground, size: 20),
                onTap: () => _showTimePicker(context, ref, profile),
              ),
          ],
        );
      },
    );
  }

  Future<void> _onToggle(
      BuildContext context, WidgetRef ref, bool value) async {
    final reminderTitle = S.of(context).dailyGoals;
    final reminderBody = S.of(context).greatJobCompletedAllGoals;
    if (value) {
      final granted = await NotificationService.requestPermissions();
      if (!granted) {
        if (context.mounted) {
          AppToast.show(
            context,
            message: S.of(context).pleaseEnableNotificationsSettings,
            type: AppToastType.error,
          );
        }
        return;
      }
    }
    try {
      await ref.read(userProfileProvider.notifier).updateProfile(
            notificationEnabled: value,
          );
      final prefs = await ref.read(preferencesProvider.future);
      await prefs.setNotificationEnabled(value);
      if (value) {
        final profile = ref.read(userProfileProvider).value;
        if (profile != null) {
          await NotificationService.scheduleDailyReminder(
            notificationTime: profile.notificationTime,
            title: reminderTitle,
            body: reminderBody,
          );
        }
      } else {
        await NotificationService.cancelDailyReminder();
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.show(context,
            message: S.of(context).errorParam(e.toString()), type: AppToastType.error);
      }
    }
  }

  Future<void> _showTimePicker(
      BuildContext context, WidgetRef ref, profile) async {
    final parts = profile.notificationTime.split(':');
    final initial = TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked == null) return;

    final hour = picked.hour.toString().padLeft(2, '0');
    final minute = picked.minute.toString().padLeft(2, '0');
    final time = '$hour:$minute';

    if (!context.mounted) return;
    final reminderTitle = S.of(context).dailyGoals;
    final reminderBody = S.of(context).greatJobCompletedAllGoals;
    try {
      await ref.read(userProfileProvider.notifier).updateProfile(
            notificationTime: time,
          );
      final prefs = await ref.read(preferencesProvider.future);
      await prefs.setNotificationTime(time);
      final profile = ref.read(userProfileProvider).value;
      if (profile != null && profile.notificationEnabled) {
        await NotificationService.scheduleDailyReminder(
          notificationTime: time,
          title: reminderTitle,
          body: reminderBody,
        );
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.show(context,
            message: S.of(context).errorParam(e.toString()), type: AppToastType.error);
      }
    }
  }
}

class _DailyGoalsLoading extends StatelessWidget {
  const _DailyGoalsLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget rowShimmer({Widget? trailing}) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: c.muted,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 100,
                    height: 14,
                    decoration: BoxDecoration(
                      color: c.muted,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 64,
                    height: 10,
                    decoration: BoxDecoration(
                      color: c.muted,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ],
              ),
            ),
            ?trailing,
          ],
        ),
      );
    }

    return _GoalsShellCard(
      children: [
        rowShimmer(),
        rowShimmer(),
        rowShimmer(
          trailing: Container(
            width: 40,
            height: 24,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
          ),
        ),
      ],
    );
  }
}
