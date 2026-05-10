import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/profile_providers.dart';
import '../../domain/exercise_stats.dart';
import '../../../user/domain/user_profile.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accent = Theme.of(context).extension<VietnameseAccentTokens>()!;
    final profileAsync = ref.watch(userProfileProvider);
    final statsAsync = ref.watch(exerciseStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _showLogoutDialog(context, ref),
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load profile',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              FilledButton.icon(
                onPressed: () => ref.invalidate(userProfileProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: FilledButton.styleFrom(
                    backgroundColor: accent.accentPrimary),
              ),
            ],
          ),
        ),
        data: (profile) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ProfileHeader(profile: profile),
            const SizedBox(height: 24),
            _ProfileInfoCard(
              profile: profile,
              onEdit: () => _showEditDialog(context, ref, profile),
            ),
            const SizedBox(height: 16),
            _StatsSection(statsAsync: statsAsync, accent: accent),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: const Text('Logout'),
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

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Edit Profile'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(),
                  ),
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
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
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
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Profile updated successfully'),
                        backgroundColor: Theme.of(context).colorScheme.primary,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to update profile: ${e.toString()}'),
                        backgroundColor: Theme.of(context).colorScheme.error,
                      ),
                    );
                  }
                }
              },
              child: const Text('Save'),
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final accent = theme.extension<VietnameseAccentTokens>()!;

    return Center(
      child: Column(
        children: [
          Semantics(
            label: profile.avatarUrl != null
                ? 'Profile picture of ${profile.fullName}'
                : 'Default profile picture',
            child: CircleAvatar(
              radius: 50,
              backgroundColor: accent.accentPrimary.withValues(alpha: 0.2),
              backgroundImage: profile.avatarUrl != null
                  ? NetworkImage(profile.avatarUrl!)
                  : null,
              child: profile.avatarUrl == null
                  ? Icon(Icons.person, size: 50, color: accent.accentPrimary)
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
              color: colorScheme.onSurfaceVariant,
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
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
            const Divider(),
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Semantics(
      label: '$label: $value',
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: colorScheme.onSurfaceVariant),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
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

class _StatsSection extends StatelessWidget {
  const _StatsSection({required this.statsAsync, required this.accent});
  final AsyncValue<ExerciseStats> statsAsync;
  final VietnameseAccentTokens accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Statistics',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        statsAsync.when(
          loading: () => const Card(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
          error: (error, stack) => Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Semantics(
                    label: 'Error loading statistics',
                    child: Icon(Icons.error_outline, color: colorScheme.error),
                  ),
                  const SizedBox(height: 8),
                  const Text('Failed to load statistics'),
                  const SizedBox(height: 8),
                  Semantics(
                    label: 'Retry loading statistics',
                    button: true,
                    child: OutlinedButton(
                      onPressed: () {},
                      child: const Text('Retry'),
                    ),
                  ),
                ],
              ),
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
                      color: accent.accentPrimary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.menu_book,
                      label: 'Words Learned',
                      value: '${stats.correctAnswers}',
                      color: accent.accentSecondary,
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
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.speed, color: accent.accentPrimary),
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
                                  color: accent.accentPrimary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: 60,
                          height: 60,
                          child: CircularProgressIndicator(
                            value: stats.accuracy / 100,
                            backgroundColor: colorScheme.surfaceContainerHighest,
                            color: accent.accentPrimary,
                            strokeWidth: 6,
                          ),
                        ),
                      ],
                    ),
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
    final theme = Theme.of(context);

    return Semantics(
      label: '$label: $value',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 8),
              Text(
                value,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
