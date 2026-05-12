import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/providers/theme_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/profile_providers.dart';
import '../../domain/exercise_stats.dart';
import '../../../user/domain/user_profile.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/domain/bookmark_models.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppAppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _showLogoutDialog(context, ref),
          ),
        ],
      ),
      body: profileAsync.when(
          loading: () => const Center(child: AppSpinner(size: 20)),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: c.error),
                const SizedBox(height: 16),
                Text('Failed to load profile',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                AppButton(
                  onPressed: () => ref.invalidate(userProfileProvider),
                  icon: const Icon(Icons.refresh),
                  label: 'Retry',
                  variant: AppButtonVariant.primary,
                ),
              ],
            ),
          ),
          data: (profile) => ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            children: [
              _ProfileHeader(profile: profile),
              const SizedBox(height: 16),
              _ProfileInfoCard(
                profile: profile,
                onEdit: () => _showEditDialog(context, ref, profile),
              ),
              const SizedBox(height: 12),
              _ThemeSection(),
              const SizedBox(height: 12),
              _StatsSection(),
              const SizedBox(height: 12),
              _VocabStatsSection(),
              const SizedBox(height: 12),
              _SavedWordsSection(),
            ],
          ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    AppDialog.show(
      context,
      builder: (ctx) => AppDialog(
        title: 'Logout',
        content: 'Are you sure you want to logout?',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(ctx),
          ),
          AppDialogAction(
            label: 'Logout',
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(ctx);
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

  void _showEditDialog(
      BuildContext context, WidgetRef ref, UserProfile profile) {
    final fullNameController = TextEditingController(text: profile.fullName);
    String? selectedLanguage = profile.nativeLanguage;
    String? selectedLevel = profile.currentLevel;
    String? selectedDialect = profile.preferredDialect;

    final languages = [
      'English',
      'Chinese',
      'Japanese',
      'Korean',
      'French',
      'German',
      'Spanish',
      'Vietnamese',
    ];

    final levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    final dialects = ['STANDARD', 'NORTHERN', 'CENTRAL', 'SOUTHERN'];

    AppDialog.show(
      context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AppDialog(
          title: 'Edit Profile',
          contentWidget: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppInput(
                  controller: fullNameController,
                  label: 'Full Name',
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedLanguage,
                  decoration: const InputDecoration(
                    labelText: 'Native Language',
                    border: OutlineInputBorder(),
                  ),
                  items: languages
                      .map((l) => DropdownMenuItem(value: l, child: Text(l)))
                      .toList(),
                  onChanged: (value) {
                    setState(() => selectedLanguage = value);
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedLevel,
                  decoration: const InputDecoration(
                    labelText: 'Current Level',
                    border: OutlineInputBorder(),
                  ),
                  items: levels
                      .map((l) => DropdownMenuItem(value: l, child: Text(l)))
                      .toList(),
                  onChanged: (value) {
                    setState(() => selectedLevel = value);
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedDialect,
                  decoration: const InputDecoration(
                    labelText: 'Preferred Dialect',
                    border: OutlineInputBorder(),
                  ),
                  items: dialects
                      .map((d) => DropdownMenuItem(
                            value: d,
                            child: Text(_formatDialect(d)),
                          ))
                      .toList(),
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
                    AppToast.show(context, message: 'Profile updated successfully', type: AppToastType.success);
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppToast.show(context, message: 'Failed to update profile: ${e.toString()}', type: AppToastType.error);
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  static String _formatDialect(String dialect) {
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
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Center(
      child: Column(
        children: [
          Semantics(
            label: profile.avatarUrl != null
                ? 'Profile picture of ${profile.fullName}'
                : 'Default profile picture',
            child: AppAvatar(
              radius: 50,
              backgroundColor: c.primary.withValues(alpha: 0.2),
              backgroundImage: profile.avatarUrl != null
                  ? NetworkImage(profile.avatarUrl!)
                  : null,
              child: profile.avatarUrl == null
                  ? Icon(Icons.person, size: 50, color: c.primary)
                  : null,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            profile.fullName,
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text(
            profile.email,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileInfoCard extends StatelessWidget {
  const _ProfileInfoCard({required this.profile, required this.onEdit});
  final UserProfile profile;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Profile Information',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: onEdit,
              ),
            ],
          ),
          AppDivider(),
          _InfoRow(
            icon: Icons.language,
            label: 'Native Language',
            value: profile.nativeLanguage ?? 'Not set',
          ),
          _InfoRow(
            icon: Icons.trending_up,
            label: 'Current Level',
            value: profile.currentLevel ?? 'Not set',
          ),
          _InfoRow(
            icon: Icons.record_voice_over,
            label: 'Preferred Dialect',
            value: profile.preferredDialect != null
                ? ProfileScreen._formatDialect(profile.preferredDialect!)
                : 'Not set',
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Semantics(
      label: '$label: $value',
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: c.mutedForeground),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                  Text(
                    value,
                    style: theme.textTheme.bodyLarge,
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

class _ThemeSection extends ConsumerWidget {
  const _ThemeSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final currentMode = ref.watch(themeModeProvider);

    Future<void> setMode(ThemeMode mode) async {
      await ref.read(themeModeProvider.notifier).setThemeMode(mode);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Cài đặt',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        AppCard(
          variant: AppCardVariant.outlined,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: [
              AppListItem(
                leading: Icon(Icons.brightness_auto, color: c.foreground),
                title: 'Theo hệ thống',
                subtitle: 'Tự động theo thiết lập thiết bị',
                trailing: Icon(
                  currentMode == ThemeMode.system
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: currentMode == ThemeMode.system
                      ? c.primary
                      : c.mutedForeground,
                  size: 20,
                ),
                onTap: () => setMode(ThemeMode.system),
              ),
              AppListItem(
                leading: Icon(Icons.light_mode, color: c.foreground),
                title: 'Sáng',
                trailing: Icon(
                  currentMode == ThemeMode.light
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: currentMode == ThemeMode.light
                      ? c.primary
                      : c.mutedForeground,
                  size: 20,
                ),
                onTap: () => setMode(ThemeMode.light),
              ),
              AppListItem(
                leading: Icon(Icons.dark_mode, color: c.foreground),
                title: 'Tối',
                trailing: Icon(
                  currentMode == ThemeMode.dark
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: currentMode == ThemeMode.dark
                      ? c.primary
                      : c.mutedForeground,
                  size: 20,
                ),
                onTap: () => setMode(ThemeMode.dark),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatsSection extends ConsumerWidget {
  const _StatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final accent = AppTheme.accents(context);
    final theme = Theme.of(context);
    final statsAsync = ref.watch(exerciseStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Statistics',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        statsAsync.when(
          loading: () => const AppCard(
            variant: AppCardVariant.outlined,
            child: Center(child: AppSpinner(size: 20)),
          ),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Column(
              children: [
                Semantics(
                  label: 'Error loading statistics',
                  child: Icon(Icons.error_outline, color: c.error),
                ),
                const SizedBox(height: 8),
                const Text('Failed to load statistics'),
                const SizedBox(height: 8),
                Semantics(
                  label: 'Retry loading statistics',
                  button: true,
                  child: AppButton(
                    label: 'Retry',
                    variant: AppButtonVariant.outline,
                    onPressed: () => ref.invalidate(exerciseStatsProvider),
                  ),
                ),
              ],
            ),
          ),
          data: (stats) => Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.check_circle,
                      label: 'Lessons Completed',
                      value: '${stats.completedExercises}',
                      color: c.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.menu_book,
                      label: 'Words Learned',
                      value: '${stats.correctAnswers}',
                      color: c.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.quiz,
                      label: 'Exercises Done',
                      value: '${stats.totalExercises}',
                      color: accent.toneLow,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.timer,
                      label: 'Total Time',
                      value: _formatTime(stats.totalTimeSpent),
                      color: accent.diacriticColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Semantics(
                label: 'Accuracy: ${stats.accuracy.toStringAsFixed(1)} percent',
                child: AppCard(
                  variant: AppCardVariant.outlined,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Icon(Icons.speed, color: c.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Accuracy',
                              style: theme.textTheme.bodySmall,
                            ),
                            Text(
                              '${stats.accuracy.toStringAsFixed(1)}%',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: c.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppProgress(
                        value: stats.accuracy / 100,
                        isCircular: true,
                        color: c.primary,
                        trackColor: c.muted,
                        radius: 28,
                        strokeWidth: 5,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
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

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Semantics(
      label: '$label: $value',
      child: AppCard(
        variant: AppCardVariant.outlined,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  value,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VocabStatsSection extends ConsumerWidget {
  const _VocabStatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final statsAsync = ref.watch(bookmarkStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Thống kê từ vựng',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        statsAsync.when(
          loading: () => const AppCard(
            variant: AppCardVariant.outlined,
            child: Center(child: AppSpinner(size: 20)),
          ),
          error: (error, stack) => AppCard(
            variant: AppCardVariant.outlined,
            child: Row(
              children: [
                Icon(Icons.error_outline, color: c.error),
                const SizedBox(width: 12),
                const Expanded(child: Text('Không thể tải thống kê')),
              ],
            ),
          ),
          data: (stats) => _VocabStatsCard(stats: stats),
        ),
      ],
    );
  }
}

class _VocabStatsCard extends StatelessWidget {
  const _VocabStatsCard({required this.stats});
  final BookmarkStats stats;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    if (stats.total == 0) {
      return AppCard(
        variant: AppCardVariant.outlined,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.bookmark_border, color: c.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  '0',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Từ đã lưu',
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
        ),
      );
    }

    final breakdownItems = stats.byPartOfSpeech.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bookmark, color: c.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                '${stats.total}',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: c.primary,
                ),
              ),
              const Spacer(),
              Text(
                'Từ đã lưu',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
              ),
            ],
          ),
          if (breakdownItems.isNotEmpty) ...[
            AppDivider(),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: breakdownItems.map((entry) {
                final viLabel = kPartOfSpeechViLabels[entry.key] ?? entry.key;
                return AppChip(
                  label: '$viLabel: ${entry.value}',
                  fontSize: AppTypography.caption,
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _SavedWordsSection extends StatelessWidget {
  const _SavedWordsSection();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      child: AppListItem(
        leading: Icon(Icons.bookmark, color: c.primary),
        titleWidget: Text(
          'Từ đã lưu',
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/bookmarks'),
      ),
    );
  }
}
