import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/home_providers.dart';

class ContinueCard extends ConsumerWidget {
  const ContinueCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final continueAsync = ref.watch(continueLearningProvider);
    final accent = Theme.of(context).extension<VietnameseAccentTokens>()!;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: continueAsync.when(
        loading: () => const _ShimmerCard(),
        error: (error, _) => _ErrorCard(
          onRetry: () => ref.invalidate(continueLearningProvider),
        ),
        data: (continueLearning) {
          if (continueLearning == null) {
            return _EmptyCard(accent: accent);
          }
          return _DataCard(
            continueLearning: continueLearning,
            accent: accent,
          );
        },
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      highlightColor: Theme.of(context).colorScheme.surfaceContainerLow,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 140,
              height: 14,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: 200,
              height: 20,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: 160,
              height: 14,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: 100,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Continue Learning',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Unable to load progress',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.error,
                ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.accent});
  final VietnameseAccentTokens accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Continue Learning',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Start a course to begin learning',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Semantics(
            label: 'Browse available courses',
            button: true,
            child: FilledButton.icon(
              onPressed: () => context.go('/courses'),
              icon: const Icon(Icons.school),
              label: const Text('Browse Courses'),
              style: FilledButton.styleFrom(
                backgroundColor: accent.accentPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DataCard extends StatelessWidget {
  const _DataCard({
    required this.continueLearning,
    required this.accent,
  });

  final ContinueLearning continueLearning;
  final VietnameseAccentTokens accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isInProgress =
        continueLearning.status == ContinueLearningStatus.inProgress;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isInProgress ? Icons.play_circle : Icons.check_circle,
                size: 16,
                color: isInProgress
                    ? accent.accentPrimary
                    : colorScheme.outline,
              ),
              const SizedBox(width: 4),
              Text(
                isInProgress ? 'In Progress' : 'Completed',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: isInProgress
                      ? accent.accentPrimary
                      : colorScheme.outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            continueLearning.lessonTitle,
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Semantics(
            label: isInProgress
                ? 'Resume lesson: ${continueLearning.lessonTitle}'
                : 'Review lesson: ${continueLearning.lessonTitle}',
            button: true,
            child: FilledButton.icon(
              onPressed: () =>
                  context.go('/lessons/${continueLearning.lessonId}'),
              icon: Icon(isInProgress ? Icons.play_arrow : Icons.replay),
              label: Text(isInProgress ? 'Resume' : 'Review'),
              style: FilledButton.styleFrom(
                backgroundColor: accent.accentPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
