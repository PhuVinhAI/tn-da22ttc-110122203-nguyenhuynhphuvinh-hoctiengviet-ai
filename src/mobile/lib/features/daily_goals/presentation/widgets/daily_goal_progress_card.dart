import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../../domain/daily_goal_progress_models.dart';
import '../../domain/daily_goal_models.dart';
import '../../data/daily_goal_progress_providers.dart';

String _goalTypeLabel(BuildContext context, GoalType type) {
  final s = S.of(context);
  return switch (type) {
    GoalType.questions => s.questionsTitle,
    GoalType.simulations => s.scenariosTried,
    GoalType.lessons => s.lessonsTitle,
  };
}

class DailyGoalProgressCard extends ConsumerWidget {
  const DailyGoalProgressCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(dailyGoalProgressProvider);

    return progressAsync.when(
      loading: () => const _ProgressShimmer(),
      error: (_, _) => const SizedBox.shrink(),
      data: (progress) {
        if (progress.goals.isEmpty) return const SizedBox.shrink();
        return _ProgressData(progress: progress);
      },
    );
  }
}

class _ShellCard extends StatelessWidget {
  const _ShellCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: child,
    );
  }
}

class _ProgressData extends StatelessWidget {
  const _ProgressData({required this.progress});
  final DailyGoalProgress progress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return _ShellCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  S.of(context).todaysProgress,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyLarge,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              if (progress.allGoalsMet)
                const _CompleteBadge()
              else
                _StreakBadge(streak: progress.currentStreak),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (int i = 0; i < progress.goals.length; i++) ...[
                if (i > 0) const SizedBox(width: AppSpacing.sm),
                Expanded(child: _GoalTile(goal: progress.goals[i])),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _GoalTile extends StatelessWidget {
  const _GoalTile({required this.goal});
  final GoalProgress goal;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = goal.met ? c.success : c.primary;

    return Column(
      children: [
        SizedBox(
          width: 56,
          height: 56,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox.expand(
                child: CircularProgressIndicator(
                  value: goal.progress,
                  strokeWidth: 4,
                  color: accent,
                  backgroundColor: c.muted,
                ),
              ),
              Icon(
                goal.met ? Icons.check_rounded : goal.goalType.icon,
                color: accent,
                size: 22,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          '${goal.currentValue}/${goal.targetValue}',
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            fontWeight: FontWeight.w700,
            color: c.foreground,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          _goalTypeLabel(context, goal.goalType),
          style: GoogleFonts.inter(
            fontSize: AppTypography.caption,
            color: c.mutedForeground,
            height: 1.2,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _StreakBadge extends StatelessWidget {
  const _StreakBadge({required this.streak});
  final int streak;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: c.primary.withValues(alpha: 0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.local_fire_department, color: c.primary, size: 14),
          const SizedBox(width: 4),
          Text(
            '$streak',
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w700,
              color: c.primary,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _CompleteBadge extends StatelessWidget {
  const _CompleteBadge();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: c.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: c.success.withValues(alpha: 0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, color: c.success, size: 14),
          const SizedBox(width: 4),
          Text(
            S.of(context).completeLabel,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w700,
              color: c.success,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressShimmer extends StatelessWidget {
  const _ProgressShimmer();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return _ShellCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 120,
                height: 18,
                decoration: BoxDecoration(
                  color: c.muted,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
              const Spacer(),
              Container(
                width: 48,
                height: 22,
                decoration: BoxDecoration(
                  color: c.muted,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              for (int i = 0; i < 3; i++) ...[
                if (i > 0) const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: c.muted,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Container(
                        width: 40,
                        height: 14,
                        decoration: BoxDecoration(
                          color: c.muted,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: 56,
                        height: 10,
                        decoration: BoxDecoration(
                          color: c.muted,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
