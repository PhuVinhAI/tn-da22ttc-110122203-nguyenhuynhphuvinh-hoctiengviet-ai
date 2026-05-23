import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/assistant_bar_provider.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/providers/theme_provider.dart';
import '../../../../core/sync/sync.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../daily_goals/data/notification_service.dart';
import '../../../daily_goals/presentation/widgets/daily_goal_section.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../user/domain/user_profile.dart';
import '../../data/profile_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: const AppAppBar(title: Text('Settings')),
      body: profileAsync.when(
        loading: () => const _SettingsLoadingSkeleton(),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Failed to load settings',
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  label: 'Retry',
                  variant: AppButtonVariant.outline,
                  onPressed: () =>
                      ref.read(userProfileProvider.notifier).refresh(),
                ),
              ],
            ),
          ),
        ),
        data: (profile) => ListView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          children: [
            _AccountHeader(profile: profile),
            const SizedBox(height: AppSpacing.lg),
            _SettingsSection(
              title: 'Account',
              children: [
                _SettingsTile(
                  icon: Icons.person_outline,
                  title: 'Edit profile',
                  subtitle: 'Name, language, level, dialect',
                  onTap: () => _showEditProfileDialog(context, ref, profile),
                ),
                _SettingsTile(
                  icon: Icons.lock_outline,
                  title: 'Change password',
                  subtitle: 'Send a verification code to your email',
                  onTap: () => _startChangePassword(context, ref, profile),
                ),
                _SettingsTile(
                  icon: Icons.cleaning_services_outlined,
                  title: 'Clear data',
                  subtitle:
                      'Delete all progress, bookmarks, stats, and AI history',
                  isDestructive: true,
                  onTap: () => _showClearDataDialog(context, ref),
                ),
                _SettingsTile(
                  icon: Icons.delete_forever_outlined,
                  title: 'Delete account',
                  subtitle: 'Permanently remove your account and data',
                  isDestructive: true,
                  onTap: () => _showDeleteAccountDialog(context, ref),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            const _ThemeSection(),
            const SizedBox(height: AppSpacing.lg),
            const _AssistantBarSection(),
            const SizedBox(height: AppSpacing.lg),
            const DailyGoalSection(),
            const SizedBox(height: AppSpacing.xl),
            AppButton(
              label: 'Log out',
              variant: AppButtonVariant.outline,
              icon: const Icon(Icons.logout),
              onPressed: () => _showLogoutDialog(context, ref),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    AppDialog.show(
      context,
      builder: (ctx) => AppDialog(
        title: 'Log out',
        content: 'Are you sure you want to log out?',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(ctx),
          ),
          AppDialogAction(
            label: 'Log out',
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(exerciseSessionServiceProvider).clearAll();
              } catch (_) {}
              await ref.read(authStateProvider.notifier).logout();
              if (ctx.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }

  Future<void> _startChangePassword(
    BuildContext context,
    WidgetRef ref,
    UserProfile profile,
  ) async {
    final confirmed = await AppDialog.show<bool>(
      context,
      builder: (ctx) => AppDialog(
        title: 'Change password',
        content:
            'We will send a verification code to ${profile.email}. Continue?',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(ctx, false),
          ),
          AppDialogAction(
            label: 'Continue',
            isPrimary: true,
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.forgotPassword(email: profile.email);
      if (context.mounted) {
        context.push(
          '/reset-password-otp?email=${Uri.encodeComponent(profile.email)}&from=settings',
        );
      }
    } on AppException catch (e) {
      if (context.mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (_) {
      if (context.mounted) {
        AppToast.show(
          context,
          message: 'Could not start password reset',
          type: AppToastType.error,
        );
      }
    }
  }

  void _showClearDataDialog(BuildContext context, WidgetRef ref) {
    AppDialog.show(
      context,
      builder: (ctx) => AppDialog(
        title: 'Clear data',
        content:
            'This permanently deletes all your learning data from our servers: '
            'progress, exercise results, bookmarks, daily goals, and AI chat history. '
            'Your account will remain active but you will need to complete onboarding again.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(ctx),
          ),
          AppDialogAction(
            label: 'Delete data',
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(userRepositoryProvider).clearUserData();
                await ref.read(exerciseSessionServiceProvider).clearAll();

                try {
                  final prefs = await ref.read(preferencesProvider.future);
                  await prefs.clearOnboardingState();
                  await prefs.clearLevelUpPromptFlags();
                } catch (_) {}

                try {
                  await NotificationService.cancelDailyReminder();
                } catch (_) {}

                ref.read(onboardingCompletedProvider.notifier).reset();
                ref.read(dataChangeBusProvider.notifier).emit({
                  'auth',
                  'exercise',
                  'progress',
                  'exercise-set',
                  'bookmark',
                  'daily-goal',
                  'simulation',
                  'simulation-results',
                });

                await ref.read(userProfileProvider.notifier).refresh();
                await ref.read(exerciseStatsProvider.notifier).refresh();

                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: 'All learning data has been deleted',
                    type: AppToastType.success,
                  );
                  context.go('/onboarding');
                }
              } on AppException catch (e) {
                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: e.message,
                    type: AppToastType.error,
                  );
                }
              } catch (_) {
                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: 'Could not clear data',
                    type: AppToastType.error,
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, WidgetRef ref) {
    AppDialog.show(
      context,
      builder: (ctx) => AppDialog(
        title: 'Delete account',
        content:
            'This will permanently delete your account and all associated data. '
            'This action cannot be undone.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(ctx),
          ),
          AppDialogAction(
            label: 'Delete account',
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(userRepositoryProvider).deleteAccount();
                try {
                  await ref.read(exerciseSessionServiceProvider).clearAll();
                } catch (_) {}
                try {
                  final prefs = await ref.read(preferencesProvider.future);
                  await prefs.clearOnboardingState();
                  await prefs.clearLevelUpPromptFlags();
                } catch (_) {}
                try {
                  await NotificationService.cancelDailyReminder();
                } catch (_) {}
                ref.read(onboardingCompletedProvider.notifier).reset();
                ref.read(dataChangeBusProvider.notifier).emit({
                  'auth',
                  'daily-goal',
                  'bookmark',
                  'exercise',
                  'progress',
                  'exercise-set',
                  'simulation',
                  'simulation-results',
                });
                await ref.read(authStateProvider.notifier).logout();
                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: 'Your account has been deleted',
                    type: AppToastType.success,
                  );
                  context.go('/login');
                }
              } on AppException catch (e) {
                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: e.message,
                    type: AppToastType.error,
                  );
                }
              } catch (_) {
                if (context.mounted) {
                  AppToast.show(
                    context,
                    message: 'Could not delete account',
                    type: AppToastType.error,
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  void _showEditProfileDialog(
    BuildContext context,
    WidgetRef ref,
    UserProfile profile,
  ) {
    final fullNameController = TextEditingController(text: profile.fullName);
    String? selectedLanguage = profile.nativeLanguage;
    String? selectedLevel = profile.currentLevel;
    String? selectedDialect = profile.preferredDialect;

    const languages = [
      'English',
      'Chinese',
      'Japanese',
      'Korean',
      'French',
      'German',
      'Spanish',
      'Vietnamese',
    ];

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const dialects = ['STANDARD', 'NORTHERN', 'CENTRAL', 'SOUTHERN'];

    AppDialog.show(
      context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AppDialog(
          title: 'Edit profile',
          contentWidget: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppInput(
                  controller: fullNameController,
                  label: 'Full name',
                ),
                const SizedBox(height: 16),
                AppDropdownField<String>(
                  label: 'Native language',
                  value: selectedLanguage,
                  items: languages,
                  onChanged: (value) {
                    setState(() => selectedLanguage = value);
                  },
                ),
                const SizedBox(height: 16),
                AppDropdownField<String>(
                  label: 'Current level',
                  value: selectedLevel,
                  items: levels,
                  onChanged: (value) {
                    setState(() => selectedLevel = value);
                  },
                ),
                const SizedBox(height: 16),
                AppDropdownField<String>(
                  label: 'Preferred dialect',
                  value: selectedDialect,
                  items: dialects,
                  itemLabelBuilder: formatDialect,
                  onChanged: (value) {
                    setState(() => selectedDialect = value);
                  },
                ),
              ],
            ),
          ),
          actions: [
            AppDialogAction(
              label: 'Cancel',
              onPressed: () => Navigator.pop(context),
            ),
            AppDialogAction(
              label: 'Save',
              isPrimary: true,
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ref.read(userProfileProvider.notifier).updateProfile(
                        fullName: fullNameController.text.trim(),
                        nativeLanguage: selectedLanguage,
                        currentLevel: selectedLevel,
                        preferredDialect: selectedDialect,
                      );
                  if (context.mounted) {
                    AppToast.show(
                      context,
                      message: 'Profile updated',
                      type: AppToastType.success,
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(
                      context,
                      message: 'Failed to update profile: $e',
                      type: AppToastType.error,
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

String formatDialect(String dialect) {
  switch (dialect) {
    case 'STANDARD':
      return 'Standard';
    case 'NORTHERN':
      return 'Northern';
    case 'CENTRAL':
      return 'Central';
    case 'SOUTHERN':
      return 'Southern';
    default:
      return dialect;
  }
}

class _SettingsLoadingSkeleton extends StatelessWidget {
  const _SettingsLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget shimmerBox({
      required double width,
      required double height,
      BorderRadius? borderRadius,
      BoxShape shape = BoxShape.rectangle,
    }) {
      return Shimmer.fromColors(
        baseColor: c.muted,
        highlightColor: c.card,
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: shape == BoxShape.circle ? null : borderRadius,
            shape: shape,
          ),
        ),
      );
    }

    Widget settingsTileSkeleton() {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            shimmerBox(width: 20, height: 20, borderRadius: BorderRadius.circular(4)),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  shimmerBox(
                    width: 120,
                    height: 14,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  const SizedBox(height: 6),
                  shimmerBox(
                    width: 200,
                    height: 12,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ],
              ),
            ),
            shimmerBox(width: 20, height: 20, borderRadius: BorderRadius.circular(4)),
          ],
        ),
      );
    }

    Widget sectionTitleSkeleton(double width) {
      return shimmerBox(
        width: width,
        height: 14,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      children: [
        AppCard(
          variant: AppCardVariant.outlined,
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              shimmerBox(width: 56, height: 56, shape: BoxShape.circle),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    shimmerBox(
                      width: 140,
                      height: 16,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    shimmerBox(
                      width: 180,
                      height: 12,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        sectionTitleSkeleton(64),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              settingsTileSkeleton(),
              AppDivider(),
              settingsTileSkeleton(),
              AppDivider(),
              settingsTileSkeleton(),
              AppDivider(),
              settingsTileSkeleton(),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        sectionTitleSkeleton(88),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                child: shimmerBox(
                  height: 72,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: shimmerBox(
                  height: 72,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: shimmerBox(
                  height: 72,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        sectionTitleSkeleton(72),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: EdgeInsets.zero,
          child: settingsTileSkeleton(),
        ),
        const SizedBox(height: AppSpacing.lg),
        sectionTitleSkeleton(80),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              settingsTileSkeleton(),
              AppDivider(),
              settingsTileSkeleton(),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        shimmerBox(
          width: double.infinity,
          height: 44,
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }
}

class _AccountHeader extends StatelessWidget {
  const _AccountHeader({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          AppAvatar(
            radius: 28,
            backgroundColor: c.primary.withValues(alpha: 0.08),
            backgroundImage:
                profile.avatarUrl != null ? NetworkImage(profile.avatarUrl!) : null,
            child: profile.avatarUrl == null
                ? Icon(Icons.person, size: 28, color: c.primary)
                : null,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.fullName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  profile.email,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) AppDivider(),
                children[i],
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.isDestructive = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final color = isDestructive ? c.error : c.foreground;

    return AppListItem(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      leading: Icon(icon, size: 20, color: isDestructive ? c.error : c.primary),
      titleWidget: Text(
        title,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitleWidget: subtitle != null
          ? Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            )
          : null,
      trailing: Icon(Icons.chevron_right, color: c.mutedForeground, size: 20),
      onTap: onTap,
    );
  }
}

class _ThemeSection extends ConsumerWidget {
  const _ThemeSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final currentMode = ref.watch(themeModeProvider);

    Future<void> setMode(ThemeMode mode) async {
      await ref.read(themeModeProvider.notifier).setThemeMode(mode);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Appearance',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              _ThemeBlock(
                icon: Icons.brightness_auto,
                label: 'System',
                isSelected: currentMode == ThemeMode.system,
                onTap: () => setMode(ThemeMode.system),
              ),
              const SizedBox(width: AppSpacing.md),
              _ThemeBlock(
                icon: Icons.light_mode,
                label: 'Light',
                isSelected: currentMode == ThemeMode.light,
                onTap: () => setMode(ThemeMode.light),
              ),
              const SizedBox(width: AppSpacing.md),
              _ThemeBlock(
                icon: Icons.dark_mode,
                label: 'Dark',
                isSelected: currentMode == ThemeMode.dark,
                onTap: () => setMode(ThemeMode.dark),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ThemeBlock extends StatelessWidget {
  const _ThemeBlock({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: isSelected ? c.primary.withValues(alpha: 0.12) : c.muted,
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(
              color: isSelected ? c.primary : c.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Icon(
                icon,
                size: 28,
                color: isSelected ? c.primary : c.mutedForeground,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                style: TextStyle(
                  fontSize: AppTypography.bodySmall,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? c.primary : c.foreground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AssistantBarSection extends ConsumerWidget {
  const _AssistantBarSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final enabled = ref.watch(assistantBarEnabledProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Assistant',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: EdgeInsets.zero,
          child: AppListItem(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            leading: Icon(Icons.auto_awesome, color: c.primary, size: 20),
            titleWidget: Text(
              'AI assistant bar',
              style: theme.textTheme.bodyMedium,
            ),
            subtitleWidget: Text(
              'Show on lesson and exercise screens',
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
            trailing: AppSwitch(
              value: enabled,
              onChanged: (value) => ref
                  .read(assistantBarEnabledProvider.notifier)
                  .setEnabled(value),
            ),
          ),
        ),
      ],
    );
  }
}
