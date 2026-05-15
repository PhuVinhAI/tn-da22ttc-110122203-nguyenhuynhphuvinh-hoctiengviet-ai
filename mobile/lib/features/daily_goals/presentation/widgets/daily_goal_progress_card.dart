import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/daily_goal_progress_models.dart';
import '../../data/daily_goal_progress_providers.dart';

class DailyGoalProgressCard extends ConsumerWidget {
  const DailyGoalProgressCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(dailyGoalProgressProvider);

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      clipBehavior: Clip.antiAlias,
      padding: EdgeInsets.zero,
      child: progressAsync.when(
        loading: () => const _ProgressShimmer(),
        error: (_, __) => const SizedBox.shrink(),
        data: (progress) {
          if (progress.goals.isEmpty) return const SizedBox.shrink();
          return _ProgressData(progress: progress);
        },
      ),
    );
  }
}

class _ProgressShimmer extends StatelessWidget {
  const _ProgressShimmer();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 120,
            height: 18,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            width: double.infinity,
            height: 8,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.xs),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            width: double.infinity,
            height: 8,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.xs),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressData extends StatelessWidget {
  const _ProgressData({required this.progress});
  final DailyGoalProgress progress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    if (progress.allGoalsMet) {
      return _CelebratoryState(progress: progress);
    }

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Tiến trình hôm nay',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (progress.currentStreak > 0)
                AppBadge(
                  label: '${progress.currentStreak} ngày liên tiếp',
                  color: c.primary,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ...progress.goals.map((goal) => _GoalProgressRow(goal: goal)),
        ],
      ),
    );
  }
}

class _CelebratoryState extends StatelessWidget {
  const _CelebratoryState({required this.progress});
  final DailyGoalProgress progress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            children: [
              Text(
                'Tiến trình hôm nay',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              AppBadge(
                label: 'Hoàn thành!',
                color: c.success,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Icon(Icons.celebration, size: 48, color: c.success),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Tuyệt vời! Bạn đã hoàn thành tất cả mục tiêu hôm nay!',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: c.success,
            ),
            textAlign: TextAlign.center,
          ),
          if (progress.currentStreak > 0) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_fire_department, color: c.primary, size: 20),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '${progress.currentStreak} ngày liên tiếp',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: c.primary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _GoalProgressRow extends StatelessWidget {
  const _GoalProgressRow({required this.goal});
  final GoalProgress goal;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(goal.goalType.icon, size: 18, color: c.primary),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  goal.goalType.viLabel,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Text(
                goal.label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: goal.met ? c.success : c.mutedForeground,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          AppProgress(
            value: goal.progress,
            height: 6,
            color: goal.met ? c.success : c.primary,
          ),
        ],
      ),
    );
  }
}
