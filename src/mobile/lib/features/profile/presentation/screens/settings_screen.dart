import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/constants/app_info.dart';
import '../../../../core/providers/assistant_bar_provider.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../../core/providers/theme_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/media_url.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../daily_goals/presentation/widgets/daily_goal_section.dart';
import '../../../user/domain/user_profile.dart';
import '../../data/profile_providers.dart';
import '../widgets/settings_actions.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppAppBar(title: Text(S.of(context).settingsTitle)),
      body: profileAsync.when(
        loading: () => const _SettingsLoadingSkeleton(),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  S.of(context).failedToLoadSettings,
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  label: S.of(context).retryButton,
                  variant: AppButtonVariant.outline,
                  onPressed: () =>
                      ref.read(userProfileProvider.notifier).refresh(),
                ),
              ],
            ),
          ),
        ),
        data: (profile) => ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.xl,
          ),
          children: [
            _AccountHeader(profile: profile),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).editProfileTitle,
              child: _ProfileEditor(profile: profile),
            ),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).appearanceLabel,
              child: const _ThemeSelector(),
            ),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).languageSection,
              child: const _LanguageTile(),
            ),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).assistantSection,
              child: const _AssistantBarTile(),
            ),
            const SizedBox(height: AppSpacing.xl),
            const DailyGoalSection(),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).accountSection,
              child: _AccountActions(profile: profile),
            ),
            const SizedBox(height: AppSpacing.xl),
            _SettingsGroup(
              title: S.of(context).developerSection,
              child: const _DeveloperActions(),
            ),
            const SizedBox(height: AppSpacing.xl),
            AppButton(
              label: S.of(context).logOutLabel,
              variant: AppButtonVariant.outline,
              icon: const Icon(Icons.logout),
              onPressed: () => showLogoutDialog(context, ref),
            ),
            const SizedBox(height: AppSpacing.lg),
            Center(
              child: Text(
                '$appName v$appVersion',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: AppTheme.colors(context).mutedForeground,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String formatDialect(BuildContext context, String dialect) {
  switch (dialect) {
    case 'STANDARD':
      return S.of(context).standardDialect;
    case 'NORTHERN':
      return S.of(context).northernDialect;
    case 'CENTRAL':
      return S.of(context).centralDialect;
    case 'SOUTHERN':
      return S.of(context).southernDialect;
    default:
      return dialect;
  }
}

// ─── Section group ────────────────────────────────────────────────────────

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: AppSpacing.md),
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleSmall,
              fontWeight: FontWeight.w700,
              color: c.foreground,
              height: 1.2,
            ),
          ),
        ),
        child,
      ],
    );
  }
}

/// A flat card that wraps a list of rows, inserting full-width dividers.
class _SettingsCard extends StatelessWidget {
  const _SettingsCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Container(height: 1, color: c.border),
            children[i],
          ],
        ],
      ),
    );
  }
}

// ─── Account header ─────────────────────────────────────────────────────

class _AccountHeader extends StatelessWidget {
  const _AccountHeader({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final hasAvatar =
        profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty;
    final initial =
        profile.fullName.isNotEmpty ? profile.fullName[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: hasAvatar ? null : c.primary.withValues(alpha: 0.12),
              border: Border.all(
                color: c.primary.withValues(alpha: 0.2),
                width: 2,
              ),
              image: hasAvatar
                  ? DecorationImage(
                      image: NetworkImage(resolveMediaUrl(profile.avatarUrl!)),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: hasAvatar
                ? null
                : Center(
                    child: Text(
                      initial,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleMedium,
                        fontWeight: FontWeight.w700,
                        color: c.primary,
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.fullName,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.titleSmall,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  profile.email,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Profile editor (inline) ───────────────────────────────────────────────

class _ProfileEditor extends ConsumerStatefulWidget {
  const _ProfileEditor({required this.profile});
  final UserProfile profile;

  @override
  ConsumerState<_ProfileEditor> createState() => _ProfileEditorState();
}

class _ProfileEditorState extends ConsumerState<_ProfileEditor> {
  static const _languages = [
    'English',
    'Chinese',
    'Japanese',
    'Korean',
    'French',
    'German',
    'Spanish',
    'Vietnamese',
  ];
  static const _levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  static const _dialects = ['STANDARD', 'NORTHERN', 'CENTRAL', 'SOUTHERN'];

  late final TextEditingController _nameController;
  String? _language;
  String? _level;
  String? _dialect;
  Timer? _nameDebounce;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.profile.fullName);
    _language = widget.profile.nativeLanguage;
    _level = widget.profile.currentLevel;
    _dialect = widget.profile.preferredDialect;
  }

  @override
  void dispose() {
    _nameDebounce?.cancel();
    _nameController.dispose();
    super.dispose();
  }

  String _languageLabel(String lang) => switch (lang) {
        'English' => S.of(context).languageEnglish,
        'Chinese' => S.of(context).languageChinese,
        'Japanese' => S.of(context).languageJapanese,
        'Korean' => S.of(context).languageKorean,
        'French' => S.of(context).languageFrench,
        'German' => S.of(context).languageGerman,
        'Spanish' => S.of(context).languageSpanish,
        'Vietnamese' => S.of(context).languageVietnamese,
        _ => lang,
      };

  Future<void> _update({
    String? fullName,
    String? nativeLanguage,
    String? currentLevel,
    String? preferredDialect,
  }) async {
    try {
      await ref.read(userProfileProvider.notifier).updateProfile(
            fullName: fullName,
            nativeLanguage: nativeLanguage,
            currentLevel: currentLevel,
            preferredDialect: preferredDialect,
          );
    } catch (e) {
      if (mounted) {
        AppToast.show(
          context,
          message: S.of(context).failedToUpdateProfileParam(e.toString()),
          type: AppToastType.error,
        );
      }
    }
  }

  void _onNameChanged(String value) {
    _nameDebounce?.cancel();
    _nameDebounce = Timer(const Duration(milliseconds: 700), () {
      final name = value.trim();
      if (name.isEmpty || name == widget.profile.fullName) return;
      _update(fullName: name);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
          controller: _nameController,
          label: S.of(context).nameLabel,
          textCapitalization: TextCapitalization.words,
          textInputAction: TextInputAction.done,
          onChanged: _onNameChanged,
        ),
        const SizedBox(height: AppSpacing.md),
        AppDropdownField<String>(
          label: S.of(context).nativeLanguageLabel,
          value: _language,
          items: _languages,
          itemLabelBuilder: _languageLabel,
          onChanged: (value) {
            setState(() => _language = value);
            _update(nativeLanguage: value);
          },
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: AppDropdownField<String>(
                label: S.of(context).currentLevelLabel,
                value: _level,
                items: _levels,
                onChanged: (value) {
                  setState(() => _level = value);
                  _update(currentLevel: value);
                },
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: AppDropdownField<String>(
                label: S.of(context).preferredDialectLabel,
                value: _dialect,
                items: _dialects,
                itemLabelBuilder: (val) => formatDialect(context, val),
                onChanged: (value) {
                  setState(() => _dialect = value);
                  _update(preferredDialect: value);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Account actions ──────────────────────────────────────────────────────

class _AccountActions extends ConsumerWidget {
  const _AccountActions({required this.profile});
  final UserProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SettingsCard(
      children: [
        _SettingsRow(
          icon: Icons.lock_outline,
          title: S.of(context).changePasswordTitle,
          subtitle: S.of(context).changePasswordSubtitle,
          onTap: () => startChangePassword(context, ref, profile),
        ),
        _SettingsRow(
          icon: Icons.cleaning_services_outlined,
          title: S.of(context).clearDataTitle,
          subtitle: S.of(context).clearDataSubtitle,
          isDestructive: true,
          onTap: () => showClearDataDialog(context, ref),
        ),
        _SettingsRow(
          icon: Icons.delete_forever_outlined,
          title: S.of(context).deleteAccountTitle,
          subtitle: S.of(context).permanentlyRemoveAccountData,
          isDestructive: true,
          onTap: () => showDeleteAccountDialog(context, ref),
        ),
      ],
    );
  }
}

// ─── Developer actions ────────────────────────────────────────────────────

class _DeveloperActions extends ConsumerWidget {
  const _DeveloperActions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SettingsCard(
      children: [
        _SettingsRow(
          icon: Icons.cached_outlined,
          title: S.of(context).clearCacheTitle,
          subtitle: S.of(context).clearCacheSubtitle,
          onTap: () => showClearCacheDialog(context, ref),
        ),
      ],
    );
  }
}

// ─── Settings row ─────────────────────────────────────────────────────────

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.trailing,
    this.isDestructive = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = isDestructive ? c.error : c.primary;
    final titleColor = isDestructive ? c.error : c.foreground;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, color: accent, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        fontWeight: FontWeight.w600,
                        color: titleColor,
                        height: 1.2,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          color: c.mutedForeground,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              trailing ??
                  Icon(Icons.chevron_right, color: c.mutedForeground, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Theme selector ────────────────────────────────────────────────────────

class _ThemeSelector extends ConsumerWidget {
  const _ThemeSelector();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final currentMode = ref.watch(themeModeProvider);

    Future<void> setMode(ThemeMode mode) async {
      await ref.read(themeModeProvider.notifier).setThemeMode(mode);
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        children: [
          _ThemeBlock(
            icon: Icons.brightness_auto,
            label: S.of(context).systemTheme,
            isSelected: currentMode == ThemeMode.system,
            onTap: () => setMode(ThemeMode.system),
          ),
          const SizedBox(width: AppSpacing.sm),
          _ThemeBlock(
            icon: Icons.light_mode_outlined,
            label: S.of(context).lightTheme,
            isSelected: currentMode == ThemeMode.light,
            onTap: () => setMode(ThemeMode.light),
          ),
          const SizedBox(width: AppSpacing.sm),
          _ThemeBlock(
            icon: Icons.dark_mode_outlined,
            label: S.of(context).darkTheme,
            isSelected: currentMode == ThemeMode.dark,
            onTap: () => setMode(ThemeMode.dark),
          ),
        ],
      ),
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
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: isSelected ? c.primary.withValues(alpha: 0.12) : c.muted,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: isSelected ? c.primary : Colors.transparent,
              width: 1.5,
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
          child: Column(
            children: [
              Icon(
                icon,
                size: 26,
                color: isSelected ? c.primary : c.mutedForeground,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
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

// ─── Language ─────────────────────────────────────────────────────────────

class _LanguageTile extends ConsumerWidget {
  const _LanguageTile();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final languages = [
      ('en', 'English', S.of(context).languageEnglish),
      ('vi', S.of(context).languageVietnamese, S.of(context).languageVietnamese),
      ('zh', '中文', S.of(context).languageChinese),
      ('ja', '日本語', S.of(context).languageJapanese),
      ('ko', '한국어', S.of(context).languageKorean),
      ('fr', 'Français', S.of(context).languageFrench),
      ('es', 'Español', S.of(context).languageSpanish),
      ('de', 'Deutsch', S.of(context).languageGerman),
      ('th', 'ภาษาไทย', S.of(context).languageThai),
    ];

    final currentCode = ref.watch(localeProvider)?.languageCode ?? 'en';
    final current = languages.firstWhere(
      (l) => l.$1 == currentCode,
      orElse: () => languages.first,
    );

    return _SettingsCard(
      children: [
        _SettingsRow(
          icon: Icons.translate_outlined,
          title: current.$2,
          subtitle: current.$3,
          onTap: () =>
              _showLanguagePicker(context, ref, currentCode, languages),
        ),
      ],
    );
  }

  void _showLanguagePicker(
    BuildContext context,
    WidgetRef ref,
    String currentCode,
    List<(String, String, String)> languages,
  ) {
    AppMenuBottomSheet.show(
      context,
      title: S.of(context).languageSection,
      items: languages
          .map(
            (l) => AppMenuBottomSheetItem(
              label: l.$2,
              sublabel: l.$3,
              isSelected: l.$1 == currentCode,
              onTap: () =>
                  ref.read(localeProvider.notifier).setLocale(Locale(l.$1)),
            ),
          )
          .toList(),
    );
  }
}

// ─── Assistant bar ──────────────────────────────────────────────────────────

class _AssistantBarTile extends ConsumerWidget {
  const _AssistantBarTile();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(assistantBarEnabledProvider);

    return _SettingsCard(
      children: [
        _SettingsRow(
          icon: Icons.auto_awesome,
          title: S.of(context).aiAssistantBarTitle,
          subtitle: S.of(context).aiAssistantBarSubtitle,
          onTap: null,
          trailing: AppSwitch(
            value: enabled,
            onChanged: (value) => ref
                .read(assistantBarEnabledProvider.notifier)
                .setEnabled(value),
          ),
        ),
      ],
    );
  }
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

class _SettingsLoadingSkeleton extends StatelessWidget {
  const _SettingsLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget box(double w, double h, {double radius = AppRadius.sm}) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(radius),
          ),
        );

    Widget card(double height) => Container(
          height: height,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
        );

    Widget group(double headerW, double cardH) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            box(headerW, 16),
            const SizedBox(height: AppSpacing.md),
            card(cardH),
          ],
        );

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xl,
      ),
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: c.muted,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    box(140, 16),
                    const SizedBox(height: AppSpacing.xs),
                    box(180, 12),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        group(88, 96),
        const SizedBox(height: AppSpacing.xl),
        group(72, 64),
        const SizedBox(height: AppSpacing.xl),
        group(80, 64),
        const SizedBox(height: AppSpacing.xl),
        group(96, 200),
      ],
    );
  }
}
