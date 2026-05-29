import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
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
    GoalType.exercises => s.exercisesTitle,
    GoalType.simulations => s.scenariosTried,
    GoalType.lessons => s.lessonsTitle,
  };
}

class DailyGoalSection extends ConsumerWidget {
  const DailyGoalSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final goalsAsync = ref.watch(dailyGoalsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.of(context).dailyGoals,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        goalsAsync.when(
          loading: () => const _DailyGoalsLoading(),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.colors(context).error.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.error_outline_rounded,
                      size: 40,
                      color: AppTheme.colors(context).error,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    S.of(context).failedToLoadGoals,
                    style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.colors(context).foreground,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  AppButton(
                    label: S.of(context).retryButton,
                    variant: AppButtonVariant.outline,
                    onPressed: () =>
                        ref.read(dailyGoalsProvider.notifier).refresh(),
                  ),
                ],
              ),
            ),
          ),
          data: (goals) => _GoalsCard(goals: goals),
        ),
      ],
    );
  }
}

class _GoalsCard extends ConsumerWidget {
  const _GoalsCard({required this.goals});
  final List<DailyGoal> goals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          if (goals.isEmpty)
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: c.primary.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.emoji_events_outlined,
                        size: 48,
                        color: c.primary,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      S.of(context).noGoalsSetYet,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: c.foreground,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      S.of(context).addGoalToTrackProgress,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: c.mutedForeground,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            )
          else
            ...goals.map((goal) => _GoalTile(goal: goal)),
          AppDivider(),
          AppListItem(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            leading: Icon(Icons.add, color: c.primary),
            titleWidget: Text(
              S.of(context).addGoalTitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: c.primary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            onTap: () => _showAddGoalDialog(context, ref),
          ),
          AppDivider(),
          const _NotificationSettings(),
        ],
      ),
    );
  }

  void _showAddGoalDialog(BuildContext context, WidgetRef ref) {
    final existingTypes =
        goals.map((g) => g.goalType).toSet();
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

class _GoalTile extends ConsumerWidget {
  const _GoalTile({required this.goal});
  final DailyGoal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppListItem(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      leading: Icon(goal.goalType.icon, color: c.primary, size: 20),
      titleWidget: Text(
        _goalTypeLabel(context, goal.goalType),
        style: theme.textTheme.bodyMedium,
      ),
      subtitleWidget: Text(
        '${goal.targetValue} ${goal.goalType.unit}/day',
        style: theme.textTheme.bodySmall?.copyWith(color: c.mutedForeground),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.edit, size: 18),
            onPressed: () => _showEditDialog(context, ref),
            visualDensity: VisualDensity.compact,
          ),
          IconButton(
            icon: Icon(Icons.delete_outline, size: 18, color: c.error),
            onPressed: () => _showDeleteConfirm(context, ref),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
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
    final theme = Theme.of(context);
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (profile) {
        return Column(
          children: [
            AppListItem(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              leading: Icon(Icons.notifications_outlined,
                  color: c.primary, size: 20),
              titleWidget: Text(
                S.of(context).goalReminders,
                style: theme.textTheme.bodyMedium,
              ),
              trailing: AppSwitch(
                value: profile.notificationEnabled,
                onChanged: (value) => _onToggle(context, ref, value),
              ),
            ),
            if (profile.notificationEnabled) ...[
              AppDivider(),
              AppListItem(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                leading:
                    Icon(Icons.access_time, color: c.primary, size: 20),
                titleWidget: Text(
                  S.of(context).reminderTime,
                  style: theme.textTheme.bodyMedium,
                ),
                subtitleWidget: Text(
                  profile.notificationTime,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showTimePicker(context, ref, profile),
              ),
            ],
          ],
        );
      },
    );
  }

  Future<void> _onToggle(
      BuildContext context, WidgetRef ref, bool value) async {
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
            title: S.of(context).dailyGoals,
            body: S.of(context).greatJobCompletedAllGoals,
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
          title: S.of(context).dailyGoals,
          body: S.of(context).greatJobCompletedAllGoals,
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

    Widget buildTileShimmer() {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 100,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 60,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          buildTileShimmer(),
          AppDivider(),
          buildTileShimmer(),
          AppDivider(),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 120,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
          ],
        ),
      ),
      AppDivider(),
      Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Shimmer.fromColors(
                baseColor: c.muted,
                highlightColor: c.card,
                child: Container(
                  width: 160,
                  height: 14,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  ),
);
  }
}
