import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/simulation_providers.dart';
import '../../domain/scenario_character.dart';

class CharacterSelectionScreen extends ConsumerStatefulWidget {
  const CharacterSelectionScreen({
    super.key,
    required this.scenarioId,
    this.preselectedCharacterId,
  });
  final String scenarioId;
  final String? preselectedCharacterId;

  @override
  ConsumerState<CharacterSelectionScreen> createState() =>
      _CharacterSelectionScreenState();
}

class _CharacterSelectionScreenState
    extends ConsumerState<CharacterSelectionScreen> {
  String? _selectedCharacterId;
  bool _isCreating = false;

  @override
  void initState() {
    super.initState();
    _selectedCharacterId = widget.preselectedCharacterId;
  }

  Future<void> _createSession() async {
    if (_selectedCharacterId == null || _isCreating) return;

    setState(() => _isCreating = true);

    try {
      final repo = ref.read(simulationRepositoryProvider);
      final response = await repo.createSession(
        widget.scenarioId,
        _selectedCharacterId!,
      );

      if (!mounted) return;

      setState(() => _isCreating = false);
      context.go(
        '/practice/sessions/${response.session.id}?fromCharacterSelection=true',
      );
    } catch (e) {
      if (!mounted) return;

      setState(() => _isCreating = false);

      AppToast.show(
        context,
        message: S.of(context).unableToCreateSessionMessage,
        type: AppToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(scenarioDetailProvider(widget.scenarioId));

    return detailAsync.when(
      loading: () => const _CharacterSelectionLoading(),
      error: (error, stack) => _CharacterSelectionError(
        onRetry: () =>
            ref.invalidate(scenarioDetailProvider(widget.scenarioId)),
      ),
      data: (detail) {
        final playableCharacters =
            detail.characters.where((c) => c.isPlayable).toList();

        return Stack(
          children: [
            _CharacterSelectionContent(
              scenarioTitle: detail.title,
              characters: playableCharacters,
              selectedCharacterId: _selectedCharacterId,
              onCharacterTap: (character) {
                setState(() {
                  _selectedCharacterId =
                      _selectedCharacterId == character.id
                          ? null
                          : character.id;
                });
              },
              onStartTap: _createSession,
            ),
            if (_isCreating) const _LoadingOverlay(),
          ],
        );
      },
    );
  }
}

class _CharacterSelectionContent extends StatelessWidget {
  const _CharacterSelectionContent({
    required this.scenarioTitle,
    required this.characters,
    required this.selectedCharacterId,
    required this.onCharacterTap,
    required this.onStartTap,
  });

  final String scenarioTitle;
  final List<ScenarioCharacter> characters;
  final String? selectedCharacterId;
  final ValueChanged<ScenarioCharacter> onCharacterTap;
  final VoidCallback onStartTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            title: Text(
              scenarioTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: Text(
                S.of(context).chooseCharacterTitle,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleSmall,
                  fontWeight: FontWeight.w700,
                  color: c.foreground,
                  height: 1.2,
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final character = characters[index];
                  final isSelected =
                      selectedCharacterId == character.id;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _CharacterCard(
                      character: character,
                      isSelected: isSelected,
                      onTap: () => onCharacterTap(character),
                    ),
                  );
                },
                childCount: characters.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: SizedBox(height: AppSpacing.xxl + AppSpacing.lg),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.lg,
              ),
              child: AppButton(
                variant: AppButtonVariant.primary,
                onPressed: selectedCharacterId != null ? onStartTap : null,
                label: S.of(context).chatTitle,
                isFullWidth: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CharacterCard extends StatelessWidget {
  const _CharacterCard({
    required this.character,
    required this.isSelected,
    required this.onTap,
  });

  final ScenarioCharacter character;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      borderColor: isSelected ? c.primary : null,
      color: isSelected ? c.primary.withValues(alpha: 0.08) : null,
      padding: const EdgeInsets.all(AppSpacing.lg),
      onTap: onTap,
      child: AppListItem(
        leading: AppAvatar(
          radius: 20,
          backgroundColor:
              isSelected ? c.primary.withValues(alpha: 0.12) : c.muted,
          child: Text(
            character.name.isNotEmpty
                ? character.name[0].toUpperCase()
                : '?',
            style: GoogleFonts.inter(
              color: isSelected ? c.primary : c.foreground,
              fontWeight: FontWeight.w600,
              fontSize: AppTypography.bodyMedium,
            ),
          ),
        ),
        titleWidget: Text(
          character.name,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            fontWeight: FontWeight.w600,
            color: isSelected ? c.primary : c.foreground,
          ),
        ),
        subtitleWidget: Text(
          character.role,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            color: isSelected
                ? c.primary.withValues(alpha: 0.7)
                : c.mutedForeground,
          ),
        ),
        trailing: isSelected
            ? Icon(Icons.check_circle, color: c.primary, size: 22)
            : null,
      ),
    );
  }
}

class _LoadingOverlay extends StatelessWidget {
  const _LoadingOverlay();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Material(
      type: MaterialType.canvas,
      color: c.background.withValues(alpha: 0.7),
      child: Center(
        child: AppCard(
          variant: AppCardVariant.outlined,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppSpinner(size: 28),
              const SizedBox(height: AppSpacing.md),
              Text(
                S.of(context).creatingStatus,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CharacterSelectionLoading extends StatelessWidget {
  const _CharacterSelectionLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            title: Shimmer.fromColors(
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
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: List.generate(
                  3,
                  (_) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: AppCard(
                      variant: AppCardVariant.outlined,
                      borderRadius: AppRadius.lg,
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: AppListItem(
                        leading: Shimmer.fromColors(
                          baseColor: c.muted,
                          highlightColor: c.card,
                          child: AppAvatar(
                            radius: 20,
                            backgroundColor: Colors.white,
                          ),
                        ),
                        titleWidget: Shimmer.fromColors(
                          baseColor: c.muted,
                          highlightColor: c.card,
                          child: Container(
                            height: 16,
                            width: 100,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm),
                            ),
                          ),
                        ),
                        subtitleWidget: Shimmer.fromColors(
                          baseColor: c.muted,
                          highlightColor: c.card,
                          child: Container(
                            height: 12,
                            width: 80,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CharacterSelectionError extends StatelessWidget {
  const _CharacterSelectionError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Scaffold(
      appBar: AppAppBar(title: Text(S.of(context).chooseCharacterTitle)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: c.mutedForeground),
              const SizedBox(height: AppSpacing.lg),
              Text(
                S.of(context).unableToLoadDataMessage,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyLarge,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              AppButton(
                variant: AppButtonVariant.primary,
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: S.of(context).retryButton,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
