import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/lesson_providers.dart';
import '../../domain/exercise_set_models.dart';

class ExerciseTierScreen extends ConsumerStatefulWidget {
  const ExerciseTierScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  ConsumerState<ExerciseTierScreen> createState() => _ExerciseTierScreenState();
}

class _ExerciseTierScreenState extends ConsumerState<ExerciseTierScreen> {
  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final tierAsync = ref.watch(exerciseSetsProvider(widget.lessonId));

    return Scaffold(
      appBar: AppAppBar(title: const Text('Exercise Tiers')),
      body: tierAsync.when(
        loading: () => const Center(child: AppSpinner()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Failed to load exercises', style: theme.textTheme.bodyLarge),
              const SizedBox(height: 8),
              AppButton(
                label: 'Retry',
                variant: AppButtonVariant.primary,
                onPressed: () => ref.invalidate(exerciseSetsProvider(widget.lessonId)),
              ),
            ],
          ),
        ),
        data: (summary) {
          final allTiers = ExerciseTier.values;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Choose your level',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Complete each tier to unlock the next one',
                style: theme.textTheme.bodyMedium?.copyWith(color: c.mutedForeground),
              ),
              const SizedBox(height: 24),
              ...allTiers.map((tier) => _TierCard(
                tier: tier,
                progress: summary.progressForTier(tier),
                isUnlocked: summary.isTierUnlocked(tier),
                onTap: summary.isTierUnlocked(tier) && summary.progressForTier(tier) != null
                    ? () => context.go('/lessons/${widget.lessonId}/exercises/play/${summary.progressForTier(tier)!.tier.value}')
                    : null,
              )),
            ],
          );
        },
      ),
    );
  }
}

class _TierCard extends StatelessWidget {
  const _TierCard({
    required this.tier,
    this.progress,
    required this.isUnlocked,
    this.onTap,
  });

  final ExerciseTier tier;
  final TierProgress? progress;
  final bool isUnlocked;
  final VoidCallback? onTap;

  Color _tierColor(AppColors c) {
    if (!isUnlocked) return c.muted;
    return switch (tier) {
      ExerciseTier.basic => c.primary,
      ExerciseTier.easy => const Color(0xFF4CAF50),
      ExerciseTier.medium => const Color(0xFFFF9800),
      ExerciseTier.hard => const Color(0xFFF44336),
      ExerciseTier.expert => const Color(0xFF9C27B0),
    };
  }

  IconData _tierIcon() {
    return switch (tier) {
      ExerciseTier.basic => Icons.looks_one,
      ExerciseTier.easy => Icons.looks_two,
      ExerciseTier.medium => Icons.looks_3,
      ExerciseTier.hard => Icons.looks_4,
      ExerciseTier.expert => Icons.looks_5,
    };
  }

  String _statusText() {
    if (!isUnlocked) return 'Locked';
    if (progress == null) return 'Not available';
    if (progress!.isCompleted) return 'Completed';
    if (progress!.isInProgress) return '${progress!.percentComplete.round()}% complete';
    return 'Not started';
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final color = _tierColor(c);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: isUnlocked
                  ? Icon(_tierIcon(), color: color, size: 24)
                  : Icon(Icons.lock, color: c.mutedForeground, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tier.displayName,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isUnlocked ? c.foreground : c.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _statusText(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isUnlocked ? c.mutedForeground : c.muted,
                    ),
                  ),
                ],
              ),
            ),
            if (isUnlocked && progress != null && progress!.isInProgress)
              SizedBox(
                width: 32,
                height: 32,
                child: AppProgress(
                  value: progress!.percentComplete / 100,
                  color: color,
                ),
              ),
            if (isUnlocked && progress != null && progress!.isCompleted)
              Icon(Icons.check_circle, color: color, size: 28),
          ],
        ),
      ),
    );
  }
}
