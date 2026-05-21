import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/simulation_providers.dart';
import '../../domain/simulation_result_summary.dart';

class ResultsHistoryScreen extends ConsumerStatefulWidget {
  const ResultsHistoryScreen({super.key, this.scenarioId});
  final String? scenarioId;

  @override
  ConsumerState<ResultsHistoryScreen> createState() =>
      _ResultsHistoryScreenState();
}

class _ResultsHistoryScreenState extends ConsumerState<ResultsHistoryScreen> {
  String? _selectedScenarioId;

  @override
  void initState() {
    super.initState();
    _selectedScenarioId = widget.scenarioId;
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync =
        ref.watch(simulationResultsProvider(_selectedScenarioId));

    return Scaffold(
      appBar: AppAppBar(title: const Text('Conversation history')),
      body: resultsAsync.when(
        loading: () => const _ResultsLoading(),
        error: (error, stack) => _ResultsError(
          onRetry: () =>
              ref.invalidate(simulationResultsProvider(_selectedScenarioId)),
        ),
        data: (results) => _ResultsContent(
          results: results,
          selectedScenarioId: _selectedScenarioId,
          onFilterChanged: (scenarioId) {
            setState(() => _selectedScenarioId = scenarioId);
          },
        ),
      ),
    );
  }
}

class _ResultsContent extends StatelessWidget {
  const _ResultsContent({
    required this.results,
    this.selectedScenarioId,
    required this.onFilterChanged,
  });

  final List<SimulationResultSummary> results;
  final String? selectedScenarioId;
  final void Function(String?) onFilterChanged;

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) {
      return const _ResultsEmpty();
    }

    return RefreshIndicator(
      onRefresh: () async {
        // RefreshIndicator requires a Future - the provider will auto-refresh
        // when invalidated, but since we're using FutureProvider.family,
        // we just return a completed future here as the data is already fresh.
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _FilterRow(
            selectedScenarioId: selectedScenarioId,
            onFilterChanged: onFilterChanged,
          ),
          const SizedBox(height: AppSpacing.md),
          ...results.map((r) => _ResultCard(result: r)),
        ],
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    this.selectedScenarioId,
    required this.onFilterChanged,
  });

  final String? selectedScenarioId;
  final void Function(String?) onFilterChanged;

  @override
  Widget build(BuildContext context) {
    if (selectedScenarioId == null) return const SizedBox.shrink();

    final c = AppTheme.colors(context);

    return Row(
      children: [
        Icon(Icons.filter_list, size: 16, color: c.mutedForeground),
        const SizedBox(width: AppSpacing.xs),
        Text(
          'Filtering by scenario',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => onFilterChanged(null),
          child: Text(
            'Clear filter',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: c.primary,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
      ],
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});
  final SimulationResultSummary result;

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  String _endReasonLabel(String reason) {
    return switch (reason) {
      'COMPLETED' => 'Completed',
      'TOO_MANY_ERRORS' => 'Too many errors',
      'INAPPROPRIATE' => 'Inappropriate content',
      'ABUSIVE' => 'Abusive content',
      _ => reason,
    };
  }

  Color _scoreColor(double score, AppColors c) {
    if (score >= 71) return c.success;
    if (score >= 41) return c.warning;
    return c.error;
  }

  Color _endReasonColor(String reason, AppColors c) {
    return switch (reason) {
      'COMPLETED' => c.success,
      'TOO_MANY_ERRORS' => c.warning,
      _ => c.error,
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final scoreColor = _scoreColor(result.totalScore, c);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: AppCard(
        variant: AppCardVariant.outlined,
        borderRadius: AppRadius.lg,
        padding: const EdgeInsets.all(AppSpacing.md),
        onTap: () => context.push('/practice/results/${result.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  result.totalScore.round().toString(),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: scoreColor,
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '/100',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
                const Spacer(),
                AppBadge(
                  label: _endReasonLabel(result.endReason),
                  color: _endReasonColor(result.endReason, c),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            if (result.scenarioTitle != null)
              Text(
                result.scenarioTitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                if (result.characterName != null) ...[
                  Icon(
                    Icons.person_outline,
                    size: 14,
                    color: c.mutedForeground,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    result.characterName!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                ],
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: c.mutedForeground,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  _formatDate(result.createdAt),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultsEmpty extends StatelessWidget {
  const _ResultsEmpty();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: c.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.history_outlined,
                size: 80,
                color: c.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'No results yet',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: c.foreground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Complete a simulation conversation to see results here',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: c.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultsLoading extends StatelessWidget {
  const _ResultsLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: List.generate(
        5,
        (_) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: AppCard(
            variant: AppCardVariant.outlined,
            borderRadius: AppRadius.lg,
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 48,
                        height: 24,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 80,
                        height: 20,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 16,
                    width: 200,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 14,
                    width: 160,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ResultsError extends StatelessWidget {
  const _ResultsError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: c.error.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 80,
                color: c.error,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Unable to load history',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: c.foreground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            AppButton(
              variant: AppButtonVariant.primary,
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: 'Retry',
            ),
          ],
        ),
      ),
    );
  }
}
