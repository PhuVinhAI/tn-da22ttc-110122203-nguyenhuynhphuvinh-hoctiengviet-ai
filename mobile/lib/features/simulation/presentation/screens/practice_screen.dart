import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/simulation_providers.dart';
import '../../domain/active_session.dart';
import '../../domain/scenario_category.dart';
import '../../domain/scenario_summary.dart';

Color _getLevelColor(String level, AppColors c) {
  return switch (level) {
    'A1' => const Color(0xFF22C55E),
    'A2' => const Color(0xFF84CC16),
    'B1' => const Color(0xFFF59E0B),
    'B2' => const Color(0xFFf97316),
    'C1' => const Color(0xFFEF4444),
    'C2' => const Color(0xFFDC2626),
    _ => c.mutedForeground,
  };
}

Color _getDifficultyColor(String difficulty, AppColors c) {
  return switch (difficulty) {
    'EASY' => c.success,
    'MEDIUM' => c.warning,
    'HARD' => c.error,
    _ => c.mutedForeground,
  };
}

String _getDifficultyLabel(String difficulty) {
  return switch (difficulty) {
    'EASY' => 'Easy',
    'MEDIUM' => 'Medium',
    'HARD' => 'Hard',
    _ => difficulty,
  };
}

const _levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const _difficulties = ['EASY', 'MEDIUM', 'HARD'];

class PracticeScreen extends ConsumerWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(simulationCategoriesProvider);
    final scenariosAsync = ref.watch(simulationScenariosProvider);
    final filter = ref.watch(scenarioFilterProvider);
    final pausedAsync = ref.watch(pausedSessionProvider);

    return Scaffold(
      appBar: AppAppBar(
        title: const Text('Practice'),
        actions: [
          IconButton(
            onPressed: () => context.push('/practice/history'),
            icon: Icon(
              Icons.history,
              color: AppTheme.colors(context).foreground,
            ),
          ),
          _FilterActionIcon(
            isActive: filter.isActive,
            onTap: () => _showFilterSheet(context, ref),
          ),
        ],
      ),
      body: categoriesAsync.when(
        loading: () => const _CategoriesLoading(),
        error: (error, stack) => _CategoriesError(
          onRetry: () =>
              ref.read(simulationCategoriesProvider.notifier).refresh(),
        ),
        data: (categories) => _PracticeContent(
          categories: categories,
          scenariosAsync: scenariosAsync,
          filter: filter,
          activeSession: pausedAsync.whenOrNull(data: (s) => s),
          onRefreshCategories: () =>
              ref.read(simulationCategoriesProvider.notifier).refresh(),
          onRefreshScenarios: () =>
              ref.read(simulationScenariosProvider.notifier).refresh(),
          onRefreshPaused: () =>
              ref.read(pausedSessionProvider.notifier).refresh(),
          onCategoryTap: (categoryId) {
            final notifier = ref.read(scenarioFilterProvider.notifier);
            final current = ref.read(scenarioFilterProvider);
            if (current.categoryId == categoryId) {
              notifier.setCategory(null);
            } else {
              notifier.setCategory(categoryId);
            }
          },
          onOpenFilter: () => _showFilterSheet(context, ref),
          onCancelSession: () async {
            final session = pausedAsync.whenOrNull(data: (s) => s);
            if (session == null) return;
            final confirmed = await AppDialog.show<bool>(
              context,
              builder: (ctx) => AppDialog(
                title: 'End conversation?',
                content:
                    'Conversation progress will be lost and cannot be recovered.',
                actions: [
                  AppDialogAction(
                    label: 'No',
                    onPressed: () => Navigator.of(ctx).pop(false),
                  ),
                  AppDialogAction(
                    label: 'End session',
                    isPrimary: true,
                    onPressed: () => Navigator.of(ctx).pop(true),
                  ),
                ],
              ),
            );
            if (confirmed != true || !context.mounted) return;
            final repo = ref.read(simulationRepositoryProvider);
            await repo.cancelSession(session.id);
            ref.read(pausedSessionProvider.notifier).refresh();
            ref.read(simulationScenariosProvider.notifier).refresh();
          },
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref) {
    final currentFilter = ref.read(scenarioFilterProvider);
    final categories = ref.read(simulationCategoriesProvider).whenOrNull(
              data: (c) => c,
            ) ??
        [];

    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (context) => _FilterBottomSheet(
        filter: currentFilter,
        categories: categories,
        onApply: (newFilter) {
          ref.read(scenarioFilterProvider.notifier).setFilter(newFilter);
          Navigator.of(context).pop();
        },
      ),
    );
  }
}

class _FilterActionIcon extends StatelessWidget {
  const _FilterActionIcon({required this.isActive, required this.onTap});
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return IconButton(
      onPressed: onTap,
      icon: Badge(
        isLabelVisible: isActive,
        child: Icon(Icons.filter_list, color: c.foreground),
      ),
    );
  }
}

class _PracticeContent extends StatelessWidget {
  const _PracticeContent({
    required this.categories,
    required this.scenariosAsync,
    required this.filter,
    this.activeSession,
    required this.onRefreshCategories,
    required this.onRefreshScenarios,
    required this.onRefreshPaused,
    required this.onCategoryTap,
    required this.onOpenFilter,
    required this.onCancelSession,
  });

  final List<ScenarioCategory> categories;
  final AsyncValue<List<ScenarioSummary>> scenariosAsync;
  final ScenarioFilter filter;
  final ActiveSession? activeSession;
  final Future<void> Function() onRefreshCategories;
  final Future<void> Function() onRefreshScenarios;
  final Future<void> Function() onRefreshPaused;
  final void Function(String categoryId) onCategoryTap;
  final VoidCallback onOpenFilter;
  final VoidCallback onCancelSession;

  String get _sectionTitle {
    if (filter.categoryId != null) {
      final category = categories.where((c) => c.id == filter.categoryId).firstOrNull;
      return category?.name ?? 'All scenarios';
    }
    return 'All scenarios';
  }

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Semantics(
              label: 'No categories icon',
              child: Icon(
                Icons.category_outlined,
                size: 64,
                color: AppTheme.colors(context).mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'No categories yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.colors(context).mutedForeground,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await onRefreshCategories();
        await onRefreshScenarios();
        await onRefreshPaused();
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          if (activeSession != null)
            _PausedSessionBanner(
              session: activeSession!,
              onContinue: () => context.push('/practice/sessions/${activeSession!.id}'),
              onCancel: onCancelSession,
            ),
          if (activeSession != null)
            const SizedBox(height: AppSpacing.lg),
          _CategoryHeader(
            title: 'Scenario categories',
            onSeeAll: filter.categoryId != null
                ? () => onCategoryTap(filter.categoryId!)
                : null,
          ),
          const SizedBox(height: AppSpacing.md),
          _CategoryGrid(
            categories: categories,
            selectedCategoryId: filter.categoryId,
            onCategoryTap: onCategoryTap,
          ),
          const SizedBox(height: AppSpacing.xl),
          _SectionHeader(title: _sectionTitle),
          const SizedBox(height: AppSpacing.md),
          scenariosAsync.when(
            loading: () => const _ScenariosLoading(),
            error: (error, stack) => _ScenariosError(
              onRetry: onRefreshScenarios,
            ),
            data: (scenarios) => _ScenarioList(scenarios: scenarios),
          ),
        ],
      ),
    );
  }
}

class _CategoryHeader extends StatelessWidget {
  const _CategoryHeader({required this.title, this.onSeeAll});
  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Row(
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const Spacer(),
        if (onSeeAll != null)
          GestureDetector(
            onTap: onSeeAll,
            child: Text(
              'See all',
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

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({
    required this.categories,
    required this.selectedCategoryId,
    required this.onCategoryTap,
  });

  final List<ScenarioCategory> categories;
  final String? selectedCategoryId;
  final void Function(String categoryId) onCategoryTap;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.md,
        childAspectRatio: 1.1,
      ),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        final isSelected = category.id == selectedCategoryId;
        return _CategoryCard(
          category: category,
          isSelected: isSelected,
          onTap: () => onCategoryTap(category.id),
        );
      },
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  final ScenarioCategory category;
  final bool isSelected;
  final VoidCallback onTap;

  IconData _getIconData(String iconName) {
    return switch (iconName) {
      'shopping-cart' => Icons.shopping_cart,
      'restaurant' => Icons.restaurant,
      'medical-services' => Icons.medical_services,
      'directions-car' => Icons.directions_car,
      'home' => Icons.home,
      'work' => Icons.work,
      'school' => Icons.school,
      'flight' => Icons.flight,
      'phone' => Icons.phone,
      'sports' => Icons.sports_soccer,
      'music' => Icons.music_note,
      'pets' => Icons.pets,
      _ => Icons.category,
    };
  }

  Color _parseColor(String hexColor) {
    final hex = hexColor.replaceFirst('#', '');
    if (hex.length == 6) {
      return Color(int.parse('FF$hex', radix: 16));
    }
    if (hex.length == 8) {
      return Color(int.parse(hex, radix: 16));
    }
    return AppColors.light.primary;
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final color = _parseColor(category.color);

    return AppCard(
      variant: isSelected ? AppCardVariant.outlined : AppCardVariant.filled,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.all(AppSpacing.md),
      color: color.withValues(alpha: isSelected ? 0.15 : 0.08),
      borderColor: isSelected ? color : color.withValues(alpha: 0.15),
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              _getIconData(category.icon),
              size: 28,
              color: color,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            category.name,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: isSelected ? color : c.foreground,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ScenarioList extends StatelessWidget {
  const _ScenarioList({required this.scenarios});
  final List<ScenarioSummary> scenarios;

  @override
  Widget build(BuildContext context) {
    if (scenarios.isEmpty) {
      return const _ScenariosEmpty();
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: scenarios.length,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, index) {
        return _ScenarioCard(scenario: scenarios[index]);
      },
    );
  }
}

class _ScenarioCard extends StatelessWidget {
  const _ScenarioCard({required this.scenario});
  final ScenarioSummary scenario;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final metaStyle = theme.textTheme.bodySmall?.copyWith(
      color: c.mutedForeground,
      height: 1.2,
    );

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm + 2,
      ),
      onTap: () => context.push('/practice/scenarios/${scenario.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              AppBadge(
                label: scenario.requiredLevel,
                color: _getLevelColor(scenario.requiredLevel, c),
              ),
              const SizedBox(width: AppSpacing.xs),
              AppBadge(
                label: _getDifficultyLabel(scenario.difficulty),
                color: _getDifficultyColor(scenario.difficulty, c),
              ),
              const Spacer(),
              Icon(Icons.access_time_rounded, size: 14, color: c.mutedForeground),
              const SizedBox(width: AppSpacing.xs),
              Text('${scenario.estimatedMinutes}m', style: metaStyle),
              const SizedBox(width: AppSpacing.md),
              Icon(Icons.people_outline, size: 14, color: c.mutedForeground),
              const SizedBox(width: AppSpacing.xs),
              Text('${scenario.characterCount}', style: metaStyle),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            scenario.title,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.25,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (scenario.description.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              scenario.description,
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}

class _ScenariosEmpty extends StatelessWidget {
  const _ScenariosEmpty();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            Icon(
              Icons.search_off,
              size: 48,
              color: c.mutedForeground,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No scenarios found',
              style: theme.textTheme.bodyMedium?.copyWith(
                    color: c.mutedForeground,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScenariosLoading extends StatelessWidget {
  const _ScenariosLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 4,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, index) {
        return AppCard(
          variant: AppCardVariant.outlined,
          borderRadius: AppRadius.lg,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 2,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 32,
                      height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 44,
                      height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 72,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
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
                  width: double.infinity,
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
                  height: 28,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ScenariosError extends StatelessWidget {
  const _ScenariosError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 48, color: c.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Failed to load scenarios',
              style: theme.textTheme.bodyMedium?.copyWith(
                    color: c.mutedForeground,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
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

class _FilterBottomSheet extends StatefulWidget {
  const _FilterBottomSheet({
    required this.filter,
    required this.categories,
    required this.onApply,
  });

  final ScenarioFilter filter;
  final List<ScenarioCategory> categories;
  final void Function(ScenarioFilter) onApply;

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  String? _selectedCategoryId;
  String? _selectedLevel;
  String? _selectedDifficulty;

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.filter.categoryId;
    _selectedLevel = widget.filter.level;
    _selectedDifficulty = widget.filter.difficulty;
  }

  void _apply() {
    widget.onApply(ScenarioFilter(
      categoryId: _selectedCategoryId,
      level: _selectedLevel,
      difficulty: _selectedDifficulty,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.sm,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      'Filters',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: c.mutedForeground),
                    style: IconButton.styleFrom(
                      foregroundColor: c.mutedForeground,
                      minimumSize: const Size(48, 48),
                      fixedSize: const Size(48, 48),
                    ),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _FilterSection(
                    title: 'Category',
                    child: Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        AppChip(
                          label: 'All',
                          isSelected: _selectedCategoryId == null,
                          onTap: () => setState(() => _selectedCategoryId = null),
                        ),
                        ...widget.categories.map(
                          (cat) => AppChip(
                            label: cat.name,
                            isSelected: _selectedCategoryId == cat.id,
                            onTap: () =>
                                setState(() => _selectedCategoryId = cat.id),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _FilterSection(
                    title: 'Level',
                    child: Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        AppChip(
                          label: 'All',
                          isSelected: _selectedLevel == null,
                          onTap: () => setState(() => _selectedLevel = null),
                        ),
                        ..._levels.map(
                          (level) => AppChip(
                            label: level,
                            isSelected: _selectedLevel == level,
                            color: _getLevelColor(level, c),
                            onTap: () => setState(() => _selectedLevel = level),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _FilterSection(
                    title: 'Difficulty',
                    child: Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        AppChip(
                          label: 'All',
                          isSelected: _selectedDifficulty == null,
                          onTap: () =>
                              setState(() => _selectedDifficulty = null),
                        ),
                        ..._difficulties.map(
                          (diff) => AppChip(
                            label: _getDifficultyLabel(diff),
                            isSelected: _selectedDifficulty == diff,
                            color: _getDifficultyColor(diff, c),
                            onTap: () =>
                                setState(() => _selectedDifficulty = diff),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  AppButton(
                    variant: AppButtonVariant.primary,
                    onPressed: _apply,
                    label: 'Apply',
                    isFullWidth: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterSection extends StatelessWidget {
  const _FilterSection({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        child,
      ],
    );
  }
}

class _CategoriesLoading extends StatelessWidget {
  const _CategoriesLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Shimmer.fromColors(
          baseColor: c.muted,
          highlightColor: c.card,
          child: Container(
            height: 20,
            width: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.1,
          ),
          itemCount: 6,
          itemBuilder: (context, index) {
            return Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: c.border),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Container(
                      height: 14,
                      width: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _PausedSessionBanner extends StatelessWidget {
  const _PausedSessionBanner({
    required this.session,
    required this.onContinue,
    required this.onCancel,
  });

  final ActiveSession session;
  final VoidCallback onContinue;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.filled,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.all(AppSpacing.lg),
      color: c.primary.withAlpha(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.pause_circle_outline,
                size: 20,
                color: c.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Session paused',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: c.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            session.scenarioTitle,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Character: ${session.chosenCharacterName}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: c.mutedForeground,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  variant: AppButtonVariant.primary,
                  label: 'Continue',
                  onPressed: onContinue,
                  isFullWidth: true,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppButton(
                  variant: AppButtonVariant.outline,
                  label: 'Cancel',
                  onPressed: onCancel,
                  isFullWidth: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoriesError extends StatelessWidget {
  const _CategoriesError({required this.onRetry});
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
            Semantics(
              label: 'Error loading categories',
              child: Icon(Icons.error_outline, size: 64, color: c.error),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Failed to load categories',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Semantics(
              label: 'Retry loading categories',
              button: true,
              child: AppButton(
                variant: AppButtonVariant.primary,
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: 'Retry',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
