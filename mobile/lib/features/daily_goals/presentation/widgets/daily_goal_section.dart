import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../profile/data/profile_providers.dart';
import '../../data/daily_goals_providers.dart';
import '../../data/daily_goal_progress_providers.dart';
import '../../data/notification_service.dart';
import '../../domain/daily_goal_models.dart';

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
          'Mục tiêu hàng ngày',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        goalsAsync.when(
          loading: () => const AppCard(
            variant: AppCardVariant.outlined,
            child: Center(child: AppSpinner(size: 20)),
          ),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Column(
              children: [
                Icon(Icons.error_outline,
                    color: AppTheme.colors(context).error),
                const SizedBox(height: 8),
                const Text('Không tải được mục tiêu',
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                AppButton(
                  label: 'Thử lại',
                  variant: AppButtonVariant.outline,
                  onPressed: () =>
                      ref.read(dailyGoalsProvider.notifier).refresh(),
                ),
              ],
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
    final progressAsync = ref.watch(dailyGoalProgressProvider);

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          if (goals.isEmpty)
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Center(
                child: Text(
                  'Chưa có mục tiêu nào. Thêm mục tiêu để theo dõi tiến trình!',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else
            ...goals.map((goal) => _GoalTile(goal: goal)),
          progressAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (progress) {
              if (progress.longestStreak <= 0) return const SizedBox.shrink();
              return Column(
                children: [
                  AppDivider(),
                  AppListItem(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    leading: Icon(
                      Icons.emoji_events,
                      color: c.primary,
                      size: 20,
                    ),
                    titleWidget: Text(
                      'Kỷ lục chuỗi',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    subtitleWidget: Text(
                      '${progress.longestStreak} ngày liên tiếp',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              );
            },
          ),
          AppDivider(),
          AppListItem(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            leading: Icon(Icons.add, color: c.primary),
            titleWidget: Text(
              'Thêm mục tiêu',
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
          message: 'Đã có đủ 3 loại mục tiêu', type: AppToastType.info);
      return;
    }

    _showGoalPickerDialog(context, ref, availableTypes);
  }

  void _showGoalPickerDialog(
    BuildContext context,
    WidgetRef ref,
    List<GoalType> availableTypes,
  ) {
    GoalType? selectedType = availableTypes.first;
    int targetValue = selectedType.defaultTarget;

    AppDialog.show(
      context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setState) => AppDialog(
          title: 'Thêm mục tiêu',
          contentWidget: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppDropdownField<GoalType>(
                label: 'Loại mục tiêu',
                value: selectedType,
                items: availableTypes,
                itemLabelBuilder: (t) => t.viLabel,
                onChanged: (type) {
                  setState(() {
                    selectedType = type;
                    targetValue = type!.defaultTarget;
                  });
                },
              ),
              const SizedBox(height: 16),
              if (selectedType != null) ...[
                _TargetSlider(
                  goalType: selectedType!,
                  value: targetValue,
                  onChanged: (v) => setState(() => targetValue = v),
                ),
              ],
            ],
          ),
          actions: [
            AppDialogAction(
              label: 'Huỷ',
              onPressed: () => Navigator.pop(context),
            ),
            AppDialogAction(
              label: 'Thêm',
              isPrimary: true,
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ref
                      .read(dailyGoalsProvider.notifier)
                      .createGoal(selectedType!, targetValue);
                  if (context.mounted) {
                    AppToast.show(context,
                        message: 'Đã thêm mục tiêu',
                        type: AppToastType.success);
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(context,
                        message: 'Lỗi: $e',
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
        goal.goalType.viLabel,
        style: theme.textTheme.bodyMedium,
      ),
      subtitleWidget: Text(
        '${goal.targetValue} ${goal.goalType.unit}/ngày',
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
          title: 'Sửa ${goal.goalType.viLabel}',
          contentWidget: _TargetSlider(
            goalType: goal.goalType,
            value: targetValue,
            onChanged: (v) => setState(() => targetValue = v),
          ),
          actions: [
            AppDialogAction(
              label: 'Huỷ',
              onPressed: () => Navigator.pop(context),
            ),
            AppDialogAction(
              label: 'Lưu',
              isPrimary: true,
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ref
                      .read(dailyGoalsProvider.notifier)
                      .updateGoal(goal.id, targetValue);
                  if (context.mounted) {
                    AppToast.show(context,
                        message: 'Đã cập nhật',
                        type: AppToastType.success);
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(context,
                        message: 'Lỗi: $e',
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
        title: 'Xoá mục tiêu',
        content: 'Xoá mục tiêu "${goal.goalType.viLabel}" vĩnh viễn?',
        actions: [
          AppDialogAction(
            label: 'Huỷ',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Xoá',
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(dialogCtx);
              try {
                await ref
                    .read(dailyGoalsProvider.notifier)
                    .deleteGoal(goal.id);
                if (dialogCtx.mounted) {
                  AppToast.show(dialogCtx,
                      message: 'Đã xoá', type: AppToastType.success);
                }
              } catch (e) {
                if (dialogCtx.mounted) {
                  AppToast.show(dialogCtx,
                      message: 'Lỗi: $e',
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
                '${goalType.unit}/ngày',
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
          divisions: (max - min).clamp(1, 50),
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
                'Nhắc mục tiêu',
                style: theme.textTheme.bodyMedium,
              ),
              trailing: Switch(
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
                  'Giờ nhắc',
                  style: theme.textTheme.bodyMedium,
                ),
                subtitleWidget: Text(
                  profile.notificationTime,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
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
            message: 'Cần cho phép thông báo trong cài đặt thiết bị',
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
      if (!value) {
        await NotificationService.cancelDailyReminder();
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.show(context,
            message: 'Lỗi: $e', type: AppToastType.error);
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
    } catch (e) {
      if (context.mounted) {
        AppToast.show(context,
            message: 'Lỗi: $e', type: AppToastType.error);
      }
    }
  }
}
