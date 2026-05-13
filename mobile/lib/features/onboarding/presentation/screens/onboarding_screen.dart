import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../profile/data/profile_providers.dart';

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
  int _dailyGoal = 20;
  bool _isSubmitting = false;

  static const _levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  static const _dialects = [
    _DialectOption('STANDARD', 'Standard', 'Chuẩn chung'),
    _DialectOption('NORTHERN', 'Northern', 'Miền Bắc (Hà Nội)'),
    _DialectOption('CENTRAL', 'Central', 'Miền Trung (Huế, Đà Nẵng)'),
    _DialectOption('SOUTHERN', 'Southern', 'Miền Nam (Sài Gòn)'),
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
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submit();
    }
  }

  void _skipStep() {
    if (_currentStep < 2) {
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
      final updateData = <String, dynamic>{
        'onboardingCompleted': true,
      };
      if (_selectedLevel != null) {
        updateData['currentLevel'] = _selectedLevel;
      }
      if (_selectedDialect != null) {
        updateData['preferredDialect'] = _selectedDialect;
      }

      final repository = ref.read(userRepositoryProvider);
      await repository.updateMe(updateData);

      final prefs = await ref.read(preferencesProvider.future);
      await prefs.setDailyGoal(_dailyGoal);
      await prefs.setOnboardingCompleted();

      ref.read(onboardingCompletedProvider.notifier).markCompleted();

      ref.invalidate(userProfileProvider);

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
                    goal: _dailyGoal,
                    onChanged: (value) {
                      setState(() => _dailyGoal = value);
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
    required this.goal,
    required this.onChanged,
  });

  final int goal;
  final ValueChanged<int> onChanged;

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
            'Set your daily goal',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'How many words do you want to review each day? You can change this later.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xxxl),
          // Big number display
          Center(
            child: Column(
              children: [
                Text(
                  '$goal',
                  style: theme.textTheme.displayLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: c.primary,
                    letterSpacing: -2,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'words per day',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          AppSlider(
            value: goal.toDouble(),
            min: 5,
            max: 50,
            divisions: 9,
            label: '$goal',
            onChanged: (value) => onChanged(value.round()),
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '5',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
              ),
              Text(
                '50',
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
              children: [
                Text(
                  label,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isSelected ? c.primary : c.foreground,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isSelected ? c.primary : c.mutedForeground,
                    ),
                    textAlign: TextAlign.center,
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
