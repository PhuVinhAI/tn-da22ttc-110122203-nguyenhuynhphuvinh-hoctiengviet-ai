import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../core/network/media_url.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/profile_providers.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/domain/bookmark_models.dart';
import '../../../daily_goals/data/daily_goal_progress_providers.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../../user/domain/user_profile.dart';
import '../../domain/exercise_stats.dart';
import 'settings_screen.dart' show formatDialect;

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppAppBar(
        title: Text(S.of(context).profileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: S.of(context).settingsButton,
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
          await ref.read(dailyGoalProgressProvider.notifier).refresh();
        },
        child: ListView(
          padding: AppNavBar.scrollPadding(
            context,
            base: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
            ),
          ),
          children: const [
            _ProfileHero(),
            SizedBox(height: AppSpacing.xl),
            _LearningProgressSection(),
            SizedBox(height: AppSpacing.xl),
            _VocabularySection(),
          ],
        ),
      ),
    );
  }
}

// ─── Section header ──────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: AppSpacing.md),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: AppTypography.titleMedium,
          fontWeight: FontWeight.w700,
          color: c.foreground,
          height: 1.2,
        ),
      ),
    );
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────

class _ProfileHero extends ConsumerWidget {
  const _ProfileHero();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final progressAsync = ref.watch(dailyGoalProgressProvider);
    final simStatsAsync = ref.watch(simulationStatsProvider);

    return profileAsync.when(
      loading: () => const _HeroShimmer(),
      error: (_, _) => const SizedBox.shrink(),
      data: (profile) {
        final currentStreak = progressAsync.when(
          data: (p) => p.currentStreak,
          loading: () => 0,
          error: (_, _) => 0,
        );
        final longestStreak = progressAsync.when(
          data: (p) => p.longestStreak,
          loading: () => 0,
          error: (_, _) => 0,
        );
        final avgScore = simStatsAsync.when(
          data: (s) => s.averageScore,
          loading: () => 0.0,
          error: (_, _) => 0.0,
        );
        return _HeroCard(
          profile: profile,
          currentStreak: currentStreak,
          longestStreak: longestStreak,
          avgScore: avgScore,
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.profile,
    required this.currentStreak,
    required this.longestStreak,
    required this.avgScore,
  });

  final UserProfile profile;
  final int currentStreak;
  final int longestStreak;
  final double avgScore;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    final subtitleParts = <String>[];
    if (profile.currentLevel != null && profile.currentLevel!.isNotEmpty) {
      subtitleParts.add(profile.currentLevel!);
    }
    if (profile.preferredDialect != null &&
        profile.preferredDialect!.isNotEmpty) {
      subtitleParts.add(formatDialect(context, profile.preferredDialect!));
    }
    final subtitle = subtitleParts.isEmpty
        ? profile.email
        : subtitleParts.join(' · ');

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Avatar(profile: profile),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.fullName,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleMedium,
                        fontWeight: FontWeight.w700,
                        color: c.foreground,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        color: c.mutedForeground,
                        height: 1.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(height: 1, color: c.border),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _MiniStat(
                  icon: Icons.local_fire_department,
                  value: '$currentStreak',
                  label: S.of(context).dailyGoals,
                ),
              ),
              _MiniDivider(),
              Expanded(
                child: _MiniStat(
                  icon: Icons.emoji_events_outlined,
                  value: '$longestStreak',
                  label: S.of(context).longestStreak,
                ),
              ),
              _MiniDivider(),
              Expanded(
                child: _MiniStat(
                  icon: Icons.star_outline,
                  value: avgScore > 0 ? avgScore.toStringAsFixed(1) : '–',
                  label: S.of(context).avgScore,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final hasAvatar =
        profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty;
    final initial = profile.fullName.isNotEmpty
        ? profile.fullName[0].toUpperCase()
        : '?';

    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hasAvatar ? null : c.primary.withValues(alpha: 0.12),
        border: Border.all(
          color: c.primary.withValues(alpha: 0.2),
          width: 2,
        ),
        image: hasAvatar
            ? DecorationImage(
                image: NetworkImage(resolveMediaUrl(profile.avatarUrl!)),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: hasAvatar
          ? null
          : Center(
              child: Text(
                initial,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleLarge,
                  fontWeight: FontWeight.w700,
                  color: c.primary,
                ),
              ),
            ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Column(
      children: [
        Icon(icon, color: c.primary, size: 18),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: AppTypography.titleSmall,
            fontWeight: FontWeight.w700,
            color: c.foreground,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
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

class _MiniDivider extends StatelessWidget {
  const _MiniDivider();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      width: 1,
      height: 36,
      color: c.border,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
    );
  }
}

class _HeroShimmer extends StatelessWidget {
  const _HeroShimmer();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    Widget bar(double w, double h) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        );

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: c.muted,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    bar(160, 18),
                    const SizedBox(height: AppSpacing.xs),
                    bar(120, 12),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(height: 1, color: c.border),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              3,
              (i) => Column(
                children: [
                  Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: c.muted,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(height: 4),
                  bar(28, 16),
                  const SizedBox(height: 4),
                  bar(40, 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Learning Progress ───────────────────────────────────────────────────

class _LearningProgressSection extends ConsumerWidget {
  const _LearningProgressSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(exerciseStatsProvider);
    final simStatsAsync = ref.watch(simulationStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: S.of(context).statisticsLabel),
        statsAsync.when(
          loading: () => const _ProgressLoading(),
          error: (_, _) => _ProgressError(
            onRetry: () => ref.read(exerciseStatsProvider.notifier).refresh(),
          ),
          data: (stats) {
            final scenarios = simStatsAsync.when(
              data: (s) => s.scenariosAttempted,
              loading: () => 0,
              error: (_, _) => 0,
            );
            return Column(
              children: [
                _AccuracyCard(accuracy: stats.accuracy),
                const SizedBox(height: AppSpacing.md),
                _StatGrid(stats: stats, scenarios: scenarios),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _AccuracyCard extends StatelessWidget {
  const _AccuracyCard({required this.accuracy});
  final double accuracy;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: c.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(Icons.speed_rounded, color: c.primary, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  S.of(context).accuracyLabel,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                    height: 1.2,
                  ),
                ),
              ),
              Text(
                '${accuracy.toStringAsFixed(1)}%',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleMedium,
                  fontWeight: FontWeight.w800,
                  color: c.primary,
                  height: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppProgress(
            value: accuracy / 100,
            height: 8,
            color: c.primary,
          ),
        ],
      ),
    );
  }
}

class _StatGrid extends StatelessWidget {
  const _StatGrid({required this.stats, required this.scenarios});
  final ExerciseStats stats;
  final int scenarios;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.check_circle_outline,
                value: '${stats.completedExercises}',
                label: S.of(context).lessonsCompleted,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _StatTile(
                icon: Icons.fitness_center,
                value: '${stats.totalQuestions}',
                label: S.of(context).exercisesDone,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.forum_outlined,
                value: '$scenarios',
                label: S.of(context).scenariosTried,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _StatTile(
                icon: Icons.schedule_outlined,
                value: _formatTime(stats.totalTimeSpent),
                label: S.of(context).totalTime,
              ),
            ),
          ],
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

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: c.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: c.primary, size: 18),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleMedium,
              fontWeight: FontWeight.w800,
              color: c.foreground,
              height: 1.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
              height: 1.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ProgressLoading extends StatelessWidget {
  const _ProgressLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    Widget box({double h = 96}) => Container(
          height: h,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
        );

    return Column(
      children: [
        box(h: 80),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: box()),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: box()),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: box()),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: box()),
          ],
        ),
      ],
    );
  }
}

class _ProgressError extends StatelessWidget {
  const _ProgressError({required this.onRetry});
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
              Icon(Icons.error_outline, color: c.error, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  S.of(context).failedToLoadSettings,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.foreground,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            variant: AppButtonVariant.outline,
            label: S.of(context).retryButton,
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

// ─── Vocabulary ──────────────────────────────────────────────────────────

class _VocabularySection extends ConsumerWidget {
  const _VocabularySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(bookmarkStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: S.of(context).bookmarkedLabel),
        statsAsync.when(
          loading: () => const _VocabLoading(),
          error: (_, _) => const _VocabError(),
          data: (stats) => _VocabCard(stats: stats),
        ),
      ],
    );
  }
}

class _VocabCard extends StatelessWidget {
  const _VocabCard({required this.stats});
  final BookmarkStats stats;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final breakdownItems = stats.byPartOfSpeech.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/bookmarks'),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: c.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Icon(Icons.bookmark_outline,
                          color: c.primary, size: 20),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${stats.total}',
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.titleMedium,
                              fontWeight: FontWeight.w800,
                              color: c.foreground,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            S.of(context).savedWordsTitle,
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.bodySmall,
                              color: c.mutedForeground,
                              height: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.arrow_forward,
                        color: c.mutedForeground, size: 20),
                  ],
                ),
                if (breakdownItems.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Container(height: 1, color: c.border),
                  const SizedBox(height: AppSpacing.md),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: breakdownItems.take(6).map((entry) {
                      final viLabel =
                          kPartOfSpeechViLabels[entry.key] ?? entry.key;
                      return _PosChip(
                        label: viLabel,
                        count: entry.value,
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PosChip extends StatelessWidget {
  const _PosChip({required this.label, required this.count});
  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs + 2,
      ),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              color: c.mutedForeground,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              color: c.foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _VocabLoading extends StatelessWidget {
  const _VocabLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
    );
  }
}

class _VocabError extends StatelessWidget {
  const _VocabError();

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
      child: Row(
        children: [
          Icon(Icons.error_outline, color: c.error, size: 20),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              S.of(context).unableToLoadBookmarkStats,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
