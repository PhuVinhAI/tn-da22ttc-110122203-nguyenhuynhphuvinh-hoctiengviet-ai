import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/simulation_providers.dart';
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

    return Scaffold(
      appBar: AppAppBar(
        title: const Text('Thực hành'),
        actions: [
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
          onRefreshCategories: () =>
              ref.read(simulationCategoriesProvider.notifier).refresh(),
          onRefreshScenarios: () =>
              ref.read(simulationScenariosProvider.notifier).refresh(),
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
    required this.onRefreshCategories,
    required this.onRefreshScenarios,
    required this.onCategoryTap,
    required this.onOpenFilter,
  });

  final List<ScenarioCategory> categories;
  final AsyncValue<List<ScenarioSummary>> scenariosAsync;
  final ScenarioFilter filter;
  final Future<void> Function() onRefreshCategories;
  final Future<void> Function() onRefreshScenarios;
  final void Function(String categoryId) onCategoryTap;
  final VoidCallback onOpenFilter;

  String get _sectionTitle {
    if (filter.categoryId != null) {
      final category = categories.where((c) => c.id == filter.categoryId).firstOrNull;
      return category?.name ?? 'Tất cả tình huống';
    }
    return 'Tất cả tình huống';
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
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _CategoryHeader(
            title: 'Danh mục tình huống',
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
            data: (scenarios) => _ScenarioGrid(scenarios: scenarios),
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
              'Xem tất cả',
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

class _ScenarioGrid extends StatelessWidget {
  const _ScenarioGrid({required this.scenarios});
  final List<ScenarioSummary> scenarios;

  @override
  Widget build(BuildContext context) {
    if (scenarios.isEmpty) {
      return const _ScenariosEmpty();
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.md,
        childAspectRatio: 0.62,
      ),
      itemCount: scenarios.length,
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

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.all(AppSpacing.md),
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppBadge(
                label: scenario.requiredLevel,
                color: _getLevelColor(scenario.requiredLevel, c),
              ),
              const Spacer(),
              Icon(
                Icons.access_time_rounded,
                size: 14,
                color: c.mutedForeground,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                '${scenario.estimatedMinutes}m',
                style: theme.textTheme.bodySmall?.copyWith(
                      color: c.mutedForeground,
                    ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            scenario.title,
            style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            scenario.description,
            style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Row(
            children: [
              AppBadge(
                label: _getDifficultyLabel(scenario.difficulty),
                color: _getDifficultyColor(scenario.difficulty, c),
              ),
              const Spacer(),
              Icon(
                Icons.people_outline,
                size: 14,
                color: c.mutedForeground,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                '${scenario.characterCount}',
                style: theme.textTheme.bodySmall?.copyWith(
                      color: c.mutedForeground,
                    ),
              ),
            ],
          ),
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

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.md,
        childAspectRatio: 0.62,
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return AppCard(
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
                      width: 36,
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
                      width: 40,
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
                  height: 18,
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
                  height: 14,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      width: 50,
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
                      width: 24,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                ],
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

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: c.mutedForeground.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                ),
              ),
              Text(
                'Bộ lọc',
                style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _FilterSection(
                title: 'Danh mục',
                child: Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    _FilterChip(
                      label: 'Tất cả',
                      isSelected: _selectedCategoryId == null,
                      onTap: () => setState(() => _selectedCategoryId = null),
                    ),
                    ...widget.categories.map(
                      (cat) => _FilterChip(
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
                title: 'Trình độ',
                child: Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    _FilterChip(
                      label: 'Tất cả',
                      isSelected: _selectedLevel == null,
                      onTap: () => setState(() => _selectedLevel = null),
                    ),
                    ..._levels.map(
                      (level) => _FilterChip(
                        label: level,
                        isSelected: _selectedLevel == level,
                        color: _getLevelColor(level, c),
                        onTap: () =>
                            setState(() => _selectedLevel = level),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              _FilterSection(
                title: 'Độ khó',
                child: Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    _FilterChip(
                      label: 'Tất cả',
                      isSelected: _selectedDifficulty == null,
                      onTap: () => setState(() => _selectedDifficulty = null),
                    ),
                    ..._difficulties.map(
                      (diff) => _FilterChip(
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
              const SizedBox(height: AppSpacing.xxl),
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  variant: AppButtonVariant.primary,
                  onPressed: () {
                    widget.onApply(ScenarioFilter(
                      categoryId: _selectedCategoryId,
                      level: _selectedLevel,
                      difficulty: _selectedDifficulty,
                    ));
                  },
                  label: 'Áp dụng',
                  isFullWidth: true,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        );
      },
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

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.color,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final chipColor = color ?? c.mutedForeground;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? chipColor.withValues(alpha: 0.12) : c.muted,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
            color: isSelected
                ? chipColor.withValues(alpha: 0.5)
                : c.border,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: isSelected ? chipColor : c.mutedForeground,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
        ),
      ),
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
