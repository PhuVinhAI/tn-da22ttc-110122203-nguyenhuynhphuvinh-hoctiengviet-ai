import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../features/daily_goals/data/daily_goals_providers.dart';
import '../../../../features/daily_goals/data/daily_goal_progress_providers.dart';
import '../../../../features/profile/data/profile_providers.dart';
import '../../../../features/daily_goals/domain/daily_goal_models.dart';
import '../../../../l10n/app_localizations.dart';

String _goalTypeLabel(BuildContext context, GoalType type) {
  final s = S.of(context);
  return switch (type) {
    GoalType.exercises => s.exercisesTitle,
    GoalType.simulations => s.scenariosTried,
    GoalType.lessons => s.lessonsTitle,
  };
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  String? _selectedNativeLanguage;
  String? _selectedLevel;
  String? _selectedDialect;
  bool _isSubmitting = false;
  bool _completeLowerCourses = false;

  final _goalEnabled = <GoalType, bool>{
    GoalType.exercises: true,
    GoalType.simulations: true,
    GoalType.lessons: false,
  };
  final _goalTargets = <GoalType, int>{
    GoalType.exercises: 10,
    GoalType.simulations: 3,
    GoalType.lessons: 2,
  };

  static const _levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  static const _a1Index = 0;
  static const _dialects = [
    _DialectOption('STANDARD'),
    _DialectOption('NORTHERN'),
    _DialectOption('CENTRAL'),
    _DialectOption('SOUTHERN'),
  ];

  // Maps nativeLanguage value → locale code for setting app language
  static const _languageToLocale = {
    'English': 'en',
    'Vietnamese': 'vi',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'French': 'fr',
    'German': 'de',
    'Spanish': 'es',
    'Thai': 'th',
  };

  bool get _canProceed {
    switch (_currentStep) {
      case 0:
        return _selectedNativeLanguage != null;
      case 1:
        return _selectedLevel != null;
      case 2:
        return _selectedDialect != null;
      case 3:
        return true;
      default:
        return false;
    }
  }

  void _nextStep() {
    if (_currentStep < 3) {
      if (_currentStep == 1 && _selectedLevel != null) {
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
        icon: Icons.fast_forward_rounded,
        title: S.of(context).bypassDialogTitle,
        content: S.of(context).bypassDialogContent,
        actions: [
          AppDialogAction(
            label: S.of(context).continueWithLessonsButton,
            onPressed: () {
              setState(() => _completeLowerCourses = false);
              Navigator.pop(dialogCtx);
              _goToNextPage();
            },
          ),
          AppDialogAction(
            label: S.of(context).skipToExercisesButton,
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

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _skipStep() {
    if (_currentStep < 3) {
      if (_currentStep == 1) {
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
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    var succeeded = false;
    try {
      final onboardingData = <String, dynamic>{
        'completeLowerCourses': _completeLowerCourses,
        'currentLevel': _selectedLevel ?? 'A1',
      };
      if (_selectedDialect != null) {
        onboardingData['preferredDialect'] = _selectedDialect;
      }
      if (_selectedNativeLanguage != null) {
        onboardingData['nativeLanguage'] = _selectedNativeLanguage;
      }

      final repository = ref.read(userRepositoryProvider);
      await repository.submitOnboarding(onboardingData);

      final goalsNotifier = ref.read(dailyGoalsProvider.notifier);
      for (final entry in _goalEnabled.entries) {
        if (!entry.value) continue;
        try {
          await goalsNotifier.createGoal(
            entry.key,
            _goalTargets[entry.key] ?? entry.key.defaultTarget,
          );
        } on AppException catch (e) {
          final alreadyExists = e.message.toLowerCase().contains('already exists');
          if (!alreadyExists) rethrow;
        }
      }

      final prefs = await ref.read(preferencesProvider.future);
      await prefs.setOnboardingCompleted();
      await prefs.setDailyGoalsMigrated();

      // Set app locale to match the user's native language
      final localeCode = _languageToLocale[_selectedNativeLanguage];
      if (localeCode != null) {
        await ref.read(localeProvider.notifier).setLocale(Locale(localeCode));
      }

      ref.invalidate(dailyGoalProgressProvider);
      ref.read(onboardingCompletedProvider.notifier).markCompleted();

      if (!context.mounted) return;
      final container = ProviderScope.containerOf(context);
      context.go('/');
      succeeded = true;

      Future.microtask(() {
        container.invalidate(userProfileProvider);
      });
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(
          context,
          message: S.of(context).unexpectedErrorMessage2,
          type: AppToastType.error,
        );
      }
    } finally {
      if (mounted && !succeeded) {
        setState(() => _isSubmitting = false);
      }
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
            // Top bar: back button + dot progress
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: Row(
                children: [
                  _BackButton(
                    visible: _currentStep > 0,
                    onPressed: _isSubmitting ? null : _previousStep,
                  ),
                  Expanded(
                    child: _DotProgressIndicator(
                      currentStep: _currentStep,
                      totalSteps: 4,
                    ),
                  ),
                  // Balances the back button so the dots stay centred.
                  const SizedBox(width: 40),
                ],
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
                  _NativeLanguageStep(
                    languages: _languageToLocale.keys.toList(),
                    selected: _selectedNativeLanguage,
                    onSelect: (lang) {
                      setState(() => _selectedNativeLanguage = lang);
                    },
                  ),
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
                    label: S.of(context).skipLabel,
                    variant: AppButtonVariant.text,
                    onPressed: _isSubmitting ? null : _skipStep,
                  ),
                  const Spacer(),
                  AppButton(
                    label: _currentStep < 3 ? S.of(context).nextButton : S.of(context).finishButton,
                    variant: AppButtonVariant.primary,
                    onPressed:
                        _canProceed && !_isSubmitting ? _nextStep : null,
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

// Flat back button; keeps its width when hidden so the dots stay centred.
class _BackButton extends StatelessWidget {
  const _BackButton({required this.visible, required this.onPressed});

  final bool visible;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    if (!visible) return const SizedBox(width: 40);

    final c = AppTheme.colors(context);
    return Tooltip(
      message: S.of(context).backButton,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.md),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Icon(
              Icons.arrow_back_rounded,
              size: 20,
              color: c.foreground,
            ),
          ),
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

// Shared step header: title + description
class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.sm),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: AppTypography.headlineSmall,
            fontWeight: FontWeight.w700,
            color: c.foreground,
            height: 1.2,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          description,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            color: c.mutedForeground,
            height: 1.5,
          ),
        ),
        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }
}

class _NativeLanguageStep extends StatelessWidget {
  const _NativeLanguageStep({
    required this.languages,
    required this.selected,
    required this.onSelect,
  });

  final List<String> languages;
  final String? selected;
  final ValueChanged<String> onSelect;

  String _label(BuildContext context, String lang) {
    final s = S.of(context);
    return switch (lang) {
      'English' => s.languageEnglish,
      'Vietnamese' => s.languageVietnamese,
      'Chinese' => s.languageChinese,
      'Japanese' => s.languageJapanese,
      'Korean' => s.languageKorean,
      'French' => s.languageFrench,
      'German' => s.languageGerman,
      'Spanish' => s.languageSpanish,
      'Thai' => s.languageThai,
      _ => lang,
    };
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            title: S.of(context).onboardingSelectNativeLanguageTitle,
            description:
                S.of(context).onboardingSelectNativeLanguageDescription,
          ),
          ...languages.map((lang) {
            final isSelected = lang == selected;
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: _SelectableCard(
                label: _label(context, lang),
                isSelected: isSelected,
                onTap: () => onSelect(lang),
                isWide: true,
              ),
            );
          }),
        ],
      ),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            title: S.of(context).selectLevelTitle,
            description: S.of(context).onboardingSelectLevelDescription,
          ),
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
                  subtitle: _levelSubtitle(context, level),
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

  static String _levelSubtitle(BuildContext context, String level) {
    final s = S.of(context);
    return switch (level) {
      'A1' => s.levelA1,
      'A2' => s.levelA2,
      'B1' => s.levelB1,
      'B2' => s.levelB2,
      'C1' => s.levelC1,
      'C2' => s.levelC2,
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

  String _getDialectLabel(BuildContext context, String dialectValue) {
    final s = S.of(context);
    return switch (dialectValue) {
      'STANDARD' => s.standardDialect,
      'NORTHERN' => s.northernDialect,
      'CENTRAL' => s.centralDialect,
      'SOUTHERN' => s.southernDialect,
      _ => dialectValue,
    };
  }

  String _getDialectDescription(BuildContext context, String dialectValue) {
    final s = S.of(context);
    return switch (dialectValue) {
      'STANDARD' => s.standardDialectDescription,
      'NORTHERN' => s.northernDialectDescription,
      'CENTRAL' => s.centralDialectDescription,
      'SOUTHERN' => s.southernDialectDescription,
      _ => '',
    };
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            title: S.of(context).selectDialectTitle,
            description: S.of(context).onboardingSelectDialectDescription,
          ),
          ...dialects.map((dialect) {
            final isSelected = dialect.value == selected;
            final label = _getDialectLabel(context, dialect.value);
            final description = _getDialectDescription(context, dialect.value);
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: _SelectableCard(
                label: label,
                subtitle: description,
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
    final c = AppTheme.colors(context);
    final types = GoalType.values;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            title: S.of(context).selectGoalsTitle,
            description: S.of(context).onboardingSelectGoalsDescription,
          ),
          // Single flat card with divider-separated goal rows, matching the
          // in-app daily goals section.
          Container(
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (var i = 0; i < types.length; i++) ...[
                  if (i > 0) Container(height: 1, color: c.border),
                  _GoalToggleTile(
                    goalType: types[i],
                    enabled: goalEnabled[types[i]] ?? false,
                    targetValue:
                        goalTargets[types[i]] ?? types[i].defaultTarget,
                    onToggle: (v) => onToggle(types[i], v),
                    onTargetChanged: (v) => onTargetChanged(types[i], v),
                  ),
                ],
              ],
            ),
          ),
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
    final (min, max) = goalType.range;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: enabled ? c.primary.withValues(alpha: 0.12) : c.muted,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  goalType.icon,
                  color: enabled ? c.primary : c.mutedForeground,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _goalTypeLabel(context, goalType),
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        fontWeight: FontWeight.w600,
                        color: enabled ? c.foreground : c.mutedForeground,
                        height: 1.2,
                      ),
                    ),
                    if (enabled) ...[
                      const SizedBox(height: 2),
                      Text(
                        '$targetValue ${goalType.unit}/day',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          fontWeight: FontWeight.w600,
                          color: c.primary,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              AppSwitch(
                value: enabled,
                onChanged: onToggle,
              ),
            ],
          ),
          if (enabled) ...[
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
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyLarge,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? c.primary : c.foreground,
                          height: 1.2,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          subtitle!,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            color: isSelected ? c.primary : c.mutedForeground,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
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
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleMedium,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? c.primary : c.foreground,
                      height: 1.2,
                    ),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  FittedBox(
                    child: Text(
                      subtitle!,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.caption,
                        color: isSelected ? c.primary : c.mutedForeground,
                        height: 1.2,
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
  const _DialectOption(this.value);
  final String value;
}
