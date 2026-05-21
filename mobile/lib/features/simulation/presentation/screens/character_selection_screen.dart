import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/simulation_providers.dart';
import '../../domain/scenario_character.dart';

class CharacterSelectionScreen extends ConsumerStatefulWidget {
  const CharacterSelectionScreen({super.key, required this.scenarioId});
  final String scenarioId;

  @override
  ConsumerState<CharacterSelectionScreen> createState() =>
      _CharacterSelectionScreenState();
}

class _CharacterSelectionScreenState
    extends ConsumerState<CharacterSelectionScreen> {
  String? _selectedCharacterId;
  bool _isCreating = false;

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

      context.push('/practice/sessions/${response.session.id}');
    } catch (e) {
      if (!mounted) return;

      setState(() => _isCreating = false);

      AppToast.show(
        context,
        message: 'Không thể tạo phiên hội thoại',
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
                'Chọn nhân vật của bạn',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: c.mutedForeground,
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
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.sm,
            AppSpacing.lg,
            AppSpacing.lg,
          ),
          child: AppButton(
            variant: AppButtonVariant.primary,
            onPressed: selectedCharacterId != null ? onStartTap : null,
            label: 'Bắt đầu hội thoại',
            isFullWidth: true,
          ),
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
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      borderColor: isSelected ? c.primary : null,
      color: isSelected ? c.primary.withAlpha(12) : null,
      padding: const EdgeInsets.all(AppSpacing.md),
      onTap: onTap,
      child: AppListItem(
        leading: AppAvatar(
          radius: 20,
          backgroundColor: isSelected ? c.primary.withAlpha(20) : c.muted,
          child: Text(
            character.name.isNotEmpty
                ? character.name[0].toUpperCase()
                : '?',
            style: TextStyle(
              color: isSelected ? c.primary : c.foreground,
              fontWeight: FontWeight.w600,
              fontSize: AppTypography.bodyMedium,
            ),
          ),
        ),
        titleWidget: Text(
          character.name,
          style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? c.primary : c.foreground,
              ),
        ),
        subtitleWidget: Text(
          character.role,
          style: theme.textTheme.bodySmall?.copyWith(
                color: isSelected
                    ? c.primary.withAlpha(180)
                    : c.mutedForeground,
              ),
        ),
      ),
    );
  }
}

class _LoadingOverlay extends StatelessWidget {
  const _LoadingOverlay();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      color: c.background.withAlpha(180),
      child: Center(
        child: AppCard(
          variant: AppCardVariant.filled,
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
                'Đang chuẩn bị hội thoại...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
      appBar: AppAppBar(title: const Text('Chọn nhân vật')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: c.mutedForeground),
              const SizedBox(height: AppSpacing.lg),
              const Text(
                'Không thể tải dữ liệu',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              AppButton(
                variant: AppButtonVariant.primary,
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: 'Thử lại',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
