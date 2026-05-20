import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../features/profile/data/profile_providers.dart';
import '../../../../features/daily_goals/data/daily_goals_providers.dart';
import '../../../../features/daily_goals/domain/daily_goal_models.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  String? _selectedLevel;
  String? _selectedDialect;
  bool _isSubmitting = false;
  bool _completeLowerCourses = false;

  final _goalEnabled = <GoalType, bool>{
    GoalType.exercises: true,
    GoalType.studyMinutes: true,
    GoalType.lessons: false,
  };
  final _goalTargets = <GoalType, int>{
    GoalType.exercises: 10,
    GoalType.studyMinutes: 15,
    GoalType.lessons: 2,
  };

  static const _levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  static const _a1Index = 0;
  static const _dialects = [
    _DialectOption('STANDARD', 'Standard', 'General standard'),
    _DialectOption('NORTHERN', 'Northern', 'Northern Vietnam (Hanoi)'),
    _DialectOption('CENTRAL', 'Central', 'Central Vietnam (Hue, Da Nang)'),
    _DialectOption('SOUTHERN', 'Southern', 'Southern Vietnam (Ho Chi Minh City)'),
  ];

  bool get _canProceed {
    switch (_currentStep) {
      case 0:
        return _selectedLevel != null;
      case 1:
        return _selectedDialect != null;
      case 2:
        return true;
      default:
        return false;
    }
  }

  void _nextStep() {
    if (_currentStep < 2) {
      if (_currentStep == 0 && _selectedLevel != null) {
        final selectedIndex = _levels.indexOf(_selectedLevel!);
        if (selectedIndex > _a1Index) {
          _showBypassDialog();
          return;
        }
      }
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submit();
    }
  }

  void _showBypassDialog() {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Mark lower-level courses as completed?',
        actions: [
          AppDialogAction(
            label: 'No',
            onPressed: () {
              setState(() => _completeLowerCourses = false);
              Navigator.pop(dialogCtx);
              _goToNextPage();
            },
          ),
          AppDialogAction(
            label: 'Yes',
            isPrimary: true,
            onPressed: () {
              setState(() => _completeLowerCourses = true);
              Navigator.pop(dialogCtx);
              _goToNextPage();
            },
          ),
        ],
      ),
    );
  }

  void _goToNextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _skipStep() {
    if (_currentStep < 2) {
      if (_currentStep == 0) {
        setState(() => _completeLowerCourses = false);
      }
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submit();
    }
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);

    try {
      final onboardingData = <String, dynamic>{
        'completeLowerCourses': _completeLowerCourses,
      };
      if (_selectedLevel != null) {
        onboardingData['currentLevel'] = _selectedLevel;
      }
      if (_selectedDialect != null) {
        onboardingData['preferredDialect'] = _selectedDialect;
      }

      final repository = ref.read(userRepositoryProvider);
      await repository.submitOnboarding(onboardingData);
      ref.invalidate(userProfileProvider);

      final goalsNotifier = ref.read(dailyGoalsProvider.notifier);
      for (final entry in _goalEnabled.entries) {
        if (entry.value) {
          await goalsNotifier.createGoal(
            entry.key,
            _goalTargets[entry.key] ?? entry.key.defaultTarget,
          );
        }
      }

      final prefs = await ref.read(preferencesProvider.future);
      await prefs.setOnboardingCompleted();

      ref.read(onboardingCompletedProvider.notifier).markCompleted();

      if (mounted) {
        context.go('/');
      }
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: 'An unexpected error occurred', type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top bar: dot progress
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 28,
                vertical: AppSpacing.lg,
              ),
              child: _DotProgressIndicator(
                currentStep: _currentStep,
                totalSteps: 3,
              ),
            ),
            // Page content
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (index) {
                  setState(() => _currentStep = index);
                },
                children: [
                  _LevelStep(
                    levels: _levels,
                    selected: _selectedLevel,
                    onSelect: (level) {
                      setState(() => _selectedLevel = level);
                    },
                  ),
                  _DialectStep(
                    dialects: _dialects,
                    selected: _selectedDialect,
                    onSelect: (dialect) {
                      setState(() => _selectedDialect = dialect);
                    },
                  ),
                  _DailyGoalStep(
                    goalEnabled: _goalEnabled,
                    goalTargets: _goalTargets,
                    onToggle: (type, enabled) {
                      setState(() => _goalEnabled[type] = enabled);
                    },
                    onTargetChanged: (type, value) {
                      setState(() => _goalTargets[type] = value);
                    },
                  ),
                ],
              ),
            ),
            // Bottom navigation
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 28,
                vertical: AppSpacing.xl,
              ),
              child: Row(
                children: [
                  AppButton(
                    label: _currentStep < 2 ? 'Skip' : 'Skip All',
                    variant: AppButtonVariant.text,
                    onPressed: _isSubmitting ? null : _skipStep,
                  ),
                  const Spacer(),
                  AppButton(
                    label: _currentStep < 2 ? 'Next' : 'Get Started',
                    variant: AppButtonVariant.primary,
                    onPressed: _canProceed ? _nextStep : null,
                    isLoading: _isSubmitting,
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

// Dot-style progress indicator
class _DotProgressIndicator extends StatelessWidget {
  const _DotProgressIndicator({
    required this.currentStep,
    required this.totalSteps,
  });

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(totalSteps, (index) {
        final isActive = index == currentStep;
        final isPast = index < currentStep;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          width: isActive ? 24 : 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          decoration: BoxDecoration(
            color: (isActive || isPast) ? c.primary : c.muted,
            borderRadius: BorderRadius.circular(AppRadius.full),
          ),
        );
      }),
    );
  }
}

class _LevelStep extends StatelessWidget {
  const _LevelStep({
    required this.levels,
    required this.selected,
    required this.onSelect,
  });

  final List<String> levels;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            "What's your current level?",
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Select the level that best describes your Vietnamese proficiency.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.5,
                crossAxisSpacing: AppSpacing.md,
                mainAxisSpacing: AppSpacing.md,
              ),
              itemCount: levels.length,
              itemBuilder: (context, index) {
                final level = levels[index];
                final isSelected = level == selected;
                return _SelectableCard(
                  label: level,
                  subtitle: _levelSubtitle(level),
                  isSelected: isSelected,
                  onTap: () => onSelect(level),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  static String _levelSubtitle(String level) {
    return switch (level) {
      'A1' => 'Beginner',
      'A2' => 'Elementary',
      'B1' => 'Intermediate',
      'B2' => 'Upper Intermediate',
      'C1' => 'Advanced',
      'C2' => 'Proficient',
      _ => '',
    };
  }
}

class _DialectStep extends StatelessWidget {
  const _DialectStep({
    required this.dialects,
    required this.selected,
    required this.onSelect,
  });

  final List<_DialectOption> dialects;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = AppTheme.colors(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Which dialect do you prefer?',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Choose the Vietnamese dialect you want to focus on.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          ...dialects.map((dialect) {
            final isSelected = dialect.value == selected;
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: _SelectableCard(
                label: dialect.label,
                subtitle: dialect.description,
                isSelected: isSelected,
                onTap: () => onSelect(dialect.value),
                isWide: true,
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _DailyGoalStep extends StatelessWidget {
  const _DailyGoalStep({
    required this.goalEnabled,
    required this.goalTargets,
    required this.onToggle,
    required this.onTargetChanged,
  });

  final Map<GoalType, bool> goalEnabled;
  final Map<GoalType, int> goalTargets;
  final void Function(GoalType, bool) onToggle;
  final void Function(GoalType, int) onTargetChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = AppTheme.colors(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Set daily goals',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Choose the goals you want to track. You can change them later in Profile.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          ...GoalType.values.map((type) => _GoalToggleTile(
                goalType: type,
                enabled: goalEnabled[type] ?? false,
                targetValue: goalTargets[type] ?? type.defaultTarget,
                onToggle: (v) => onToggle(type, v),
                onTargetChanged: (v) => onTargetChanged(type, v),
              )),
        ],
      ),
    );
  }
}

class _GoalToggleTile extends StatelessWidget {
  const _GoalToggleTile({
    required this.goalType,
    required this.enabled,
    required this.targetValue,
    required this.onToggle,
    required this.onTargetChanged,
  });

  final GoalType goalType;
  final bool enabled;
  final int targetValue;
  final ValueChanged<bool> onToggle;
  final ValueChanged<int> onTargetChanged;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final (min, max) = goalType.range;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: AppCard(
        variant: AppCardVariant.outlined,
        borderColor: enabled ? c.primary : c.border,
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          children: [
            Row(
              children: [
                Icon(goalType.icon,
                    color: enabled ? c.primary : c.mutedForeground, size: 24),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    goalType.label,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: enabled ? c.foreground : c.mutedForeground,
                    ),
                  ),
                ),
                AppSwitch(
                  value: enabled,
                  onChanged: onToggle,
                ),
              ],
            ),
            if (enabled) ...[
              const SizedBox(height: AppSpacing.md),
              Center(
                child: Text(
                  '$targetValue ${goalType.unit}/day',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: c.primary,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              AppSlider(
                value: targetValue.toDouble(),
                min: min.toDouble(),
                max: max.toDouble(),
                divisions: (max - min) ~/ goalType.step,
                label: '$targetValue',
                onChanged: (v) => onTargetChanged(v.round()),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SelectableCard extends StatelessWidget {
  const _SelectableCard({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.subtitle,
    this.isWide = false,
  });

  final String label;
  final String? subtitle;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isWide;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = AppTheme.colors(context);

    return AppCard(
      onTap: onTap,
      variant: AppCardVariant.outlined,
      color: isSelected ? c.primary.withValues(alpha: 0.06) : c.card,
      borderColor: isSelected ? c.primary : c.border,
      borderRadius: AppRadius.lg,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: isWide
          ? Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected ? c.primary : c.foreground,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          subtitle!,
                          style: AppTheme.vnStyle(
                            fontSize: AppTypography.bodySmall,
                            color: isSelected ? c.primary : c.mutedForeground,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 150),
                  opacity: isSelected ? 1.0 : 0.0,
                  child: Icon(
                    Icons.check_circle_rounded,
                    color: c.primary,
                    size: 20,
                  ),
                ),
              ],
            )
          : Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                FittedBox(
                  child: Text(
                    label,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isSelected ? c.primary : c.foreground,
                    ),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  FittedBox(
                    child: Text(
                      subtitle!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontSize: AppTypography.caption,
                        color: isSelected ? c.primary : c.mutedForeground,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}

class _DialectOption {
  const _DialectOption(this.value, this.label, this.description);
  final String value;
  final String label;
  final String description;
}
