import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/profile_providers.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/domain/bookmark_models.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../../user/domain/user_profile.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppAppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Settings',
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(userProfileProvider.notifier).refresh();
          await ref.read(exerciseStatsProvider.notifier).refresh();
          await ref.read(bookmarkStatsProvider.notifier).refresh();
          await ref.read(simulationStatsProvider.notifier).refresh();
        },
        child: ListView(
          padding: AppNavBar.scrollPadding(
            context,
            base: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
          ),
          children: [
            profileAsync.when(
              loading: () => const _ProfileHeaderLoading(),
              error: (_, __) => const SizedBox.shrink(),
              data: (profile) => _ProfileHeader(profile: profile),
            ),
            const SizedBox(height: AppSpacing.lg),
            const _StatsSection(),
            const SizedBox(height: AppSpacing.md),
            const _SimulationStatsSection(),
            const SizedBox(height: AppSpacing.md),
            const _VocabStatsSection(),
            const SizedBox(height: AppSpacing.md),
            const _SavedWordsSection(),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Column(
        children: [
          Semantics(
            label: profile.avatarUrl != null
                ? 'Profile picture of ${profile.fullName}'
                : 'Default profile picture',
            child: AppAvatar(
              radius: 50,
              backgroundColor: c.primary.withValues(alpha: 0.08),
              backgroundImage: profile.avatarUrl != null
                  ? NetworkImage(profile.avatarUrl!)
                  : null,
              child: profile.avatarUrl == null
                  ? Icon(Icons.person, size: 50, color: c.primary)
                  : null,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            profile.fullName,
            style: theme.textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ProfileHeaderLoading extends StatelessWidget {
  const _ProfileHeaderLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Column(
        children: [
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              width: 140,
              height: 22,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsSection extends ConsumerWidget {
  const _StatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final accent = AppTheme.accents(context);
    final theme = Theme.of(context);
    final statsAsync = ref.watch(exerciseStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Statistics',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        statsAsync.when(
          loading: () => const _StatsSectionLoading(),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Column(
              children: [
                Semantics(
                  label: 'Error loading statistics',
                  child: Icon(Icons.error_outline, color: c.error),
                ),
                const SizedBox(height: 8),
                const Text('Failed to load statistics', textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Semantics(
                  label: 'Retry loading statistics',
                  button: true,
                  child: AppButton(
                    label: 'Retry',
                    variant: AppButtonVariant.outline,
                    onPressed: () => ref.read(exerciseStatsProvider.notifier).refresh(),
                  ),
                ),
              ],
            ),
          ),
          data: (stats) => Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.check_circle,
                      label: 'Lessons Completed',
                      value: '${stats.completedExercises}',
                      color: c.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.task_alt,
                      label: 'Correct Answers',
                      value: '${stats.correctAnswers}',
                      color: c.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.quiz,
                      label: 'Exercises Done',
                      value: '${stats.totalExercises}',
                      color: accent.toneLow,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.timer,
                      label: 'Total Time',
                      value: _formatTime(stats.totalTimeSpent),
                      color: accent.diacriticColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Semantics(
                label: 'Accuracy: ${stats.accuracy.toStringAsFixed(1)} percent',
                child: AppCard(
                  variant: AppCardVariant.outlined,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.speed, color: c.primary),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Accuracy',
                              style: theme.textTheme.bodySmall,
                            ),
                            Text(
                              '${stats.accuracy.toStringAsFixed(1)}%',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: c.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppProgress(
                        value: stats.accuracy / 100,
                        isCircular: true,
                        color: c.primary,
                        trackColor: c.muted,
                        radius: 28,
                        strokeWidth: 5,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatTime(int seconds) {
    if (seconds < 60) return '${seconds}s';
    if (seconds < 3600) return '${(seconds / 60).floor()}m';
    final hours = (seconds / 3600).floor();
    final minutes = ((seconds % 3600) / 60).floor();
    return '${hours}h ${minutes}m';
  }
}

class _SimulationStatsSection extends ConsumerWidget {
  const _SimulationStatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final accent = AppTheme.accents(context);
    final theme = Theme.of(context);
    final statsAsync = ref.watch(simulationStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Simulation',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        statsAsync.when(
          loading: () => const _SimulationStatsSectionLoading(),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Column(
              children: [
                Semantics(
                  label: 'Error loading simulation statistics',
                  child: Icon(Icons.error_outline, color: c.error),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Failed to load simulation statistics',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Semantics(
                  label: 'Retry loading simulation statistics',
                  button: true,
                  child: AppButton(
                    label: 'Retry',
                    variant: AppButtonVariant.outline,
                    onPressed: () =>
                        ref.read(simulationStatsProvider.notifier).refresh(),
                  ),
                ),
              ],
            ),
          ),
          data: (stats) => Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.forum_outlined,
                  label: 'Scenarios Tried',
                  value: '${stats.scenariosAttempted}',
                  color: accent.toneHigh,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _StatCard(
                  icon: Icons.star_outline,
                  label: 'Avg. Score',
                  value: stats.averageScore.toStringAsFixed(1),
                  color: accent.toneMid,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SimulationStatsSectionLoading extends StatelessWidget {
  const _SimulationStatsSectionLoading();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: _StatCardSkeleton()),
        const SizedBox(width: AppSpacing.md),
        Expanded(child: _StatCardSkeleton()),
      ],
    );
  }
}

class _StatsSectionLoading extends StatelessWidget {
  const _StatsSectionLoading();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _StatCardSkeleton()),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _StatCardSkeleton()),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: _StatCardSkeleton()),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _StatCardSkeleton()),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        const _AccuracyCardSkeleton(),
      ],
    );
  }
}

class _StatCardSkeleton extends StatelessWidget {
  const _StatCardSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Container(
                  width: 48,
                  height: 24,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              width: 90,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AccuracyCardSkeleton extends StatelessWidget {
  const _AccuracyCardSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return AppCard(
      variant: AppCardVariant.outlined,
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
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
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
                    width: 64,
                    height: 12,
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
                    width: 56,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              width: 56,
              height: 56,
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
}

class _VocabStatsSectionLoading extends StatelessWidget {
  const _VocabStatsSectionLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Shimmer.fromColors(
        baseColor: c.muted,
        highlightColor: c.card,
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Container(
              width: 32,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
            const Spacer(),
            Container(
              width: 80,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Semantics(
      label: '$label: $value',
      child: AppCard(
        variant: AppCardVariant.outlined,
        borderRadius: AppRadius.lg,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  value,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VocabStatsSection extends ConsumerWidget {
  const _VocabStatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final statsAsync = ref.watch(bookmarkStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Bookmarked',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        statsAsync.when(
          loading: () => const _VocabStatsSectionLoading(),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Row(
              children: [
                Icon(Icons.error_outline, color: c.error),
                const SizedBox(width: AppSpacing.md),
                const Expanded(child: Text('Unable to load bookmark stats')),
              ],
            ),
          ),
          data: (stats) => _VocabStatsCard(stats: stats),
        ),
      ],
    );
  }
}

class _VocabStatsCard extends StatelessWidget {
  const _VocabStatsCard({required this.stats});
  final BookmarkStats stats;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    if (stats.total == 0) {
      return AppCard(
        variant: AppCardVariant.outlined,
        borderRadius: AppRadius.lg,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.bookmark_border, color: c.primary, size: 20),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  '0',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Saved words',
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
        ),
      );
    }

    final breakdownItems = stats.byPartOfSpeech.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bookmark, color: c.primary, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Text(
                '${stats.total}',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: c.primary,
                ),
              ),
              const Spacer(),
              Text(
                'Saved words',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
              ),
            ],
          ),
          if (breakdownItems.isNotEmpty) ...[
            AppDivider(),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: breakdownItems.map((entry) {
                final viLabel = kPartOfSpeechViLabels[entry.key] ?? entry.key;
                return AppChip(
                  label: '$viLabel: ${entry.value}',
                  fontSize: AppTypography.caption,
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _SavedWordsSection extends StatelessWidget {
  const _SavedWordsSection();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      child: AppListItem(
        leading: Icon(Icons.bookmark, color: c.primary),
        titleWidget: Text(
          'View saved words',
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/bookmarks'),
      ),
    );
  }
}
