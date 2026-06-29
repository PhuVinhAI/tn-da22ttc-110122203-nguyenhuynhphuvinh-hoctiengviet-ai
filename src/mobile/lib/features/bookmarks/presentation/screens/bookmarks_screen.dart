import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../core/services/audio_player_service.dart';
import '../../../../core/network/media_url.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../../../profile/data/profile_providers.dart';

String _sortLabel(BuildContext context, BookmarkSort sort) {
  final s = S.of(context);
  return switch (sort) {
    BookmarkSort.newest => s.sortNewest,
    BookmarkSort.oldest => s.sortOldest,
    BookmarkSort.az => s.sortAZ,
    BookmarkSort.za => s.sortZA,
  };
}

String _filterLabel(BuildContext context, BookmarkSourceFilter filter) {
  final s = S.of(context);
  return switch (filter) {
    BookmarkSourceFilter.all => s.allLabel,
    BookmarkSourceFilter.ai => s.aiWordsLabel,
    BookmarkSourceFilter.lesson => s.lessonWordsLabel,
  };
}

String _displayWord(BookmarkWithVocabulary item, String? preferredDialect) {
  if (preferredDialect != null &&
      item.dialectVariants != null &&
      item.dialectVariants![preferredDialect] != null &&
      item.dialectVariants![preferredDialect]!.isNotEmpty) {
    return item.dialectVariants![preferredDialect]!;
  }
  return item.word;
}

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});

  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(bookmarksProvider.notifier).loadMore();
    }
  }

  void _onSearchChanged(String value) {
    final trimmed = value.trim();
    ref
        .read(bookmarkSearchProvider.notifier)
        .setSearch(trimmed.isEmpty ? null : trimmed);
  }

  void _onSortChanged(BookmarkSort sort) {
    ref.read(bookmarkSortProvider.notifier).setSort(sort);
  }

  void _onFilterChanged(BookmarkSourceFilter filter) {
    ref.read(bookmarkSourceFilterProvider.notifier).setFilter(filter);
  }

  Future<void> _onRefresh() async {
    await ref.read(bookmarksProvider.notifier).refresh();
  }

  Future<void> _playAudio(String audioUrl) async {
    final audioService = ref.read(audioPlayerProvider);
    await audioService.play(resolveMediaUrl(audioUrl));
  }

  Future<void> _onToggleBookmark(BookmarkWithVocabulary item) async {
    final c = AppTheme.colors(context);
    final bookmarkIdsValue = ref.read(bookmarkIdsProvider).value;
    final isCurrentlyBookmarked =
        item.isPersonal ||
        (bookmarkIdsValue?.contains(item.vocabularyId) ?? true);

    if (isCurrentlyBookmarked) {
      final confirmed = await AppDialog.show<bool>(
        context,
        builder: (ctx) => AppDialog(
          icon: Icons.bookmark_remove_outlined,
          iconColor: c.error,
          title: S.of(context).removeSavedWordTitle,
          content: S.of(context).removeSavedWordContent,
          actions: [
            AppDialogAction(
              label: S.of(context).cancelButton,
              onPressed: () => Navigator.pop(ctx, false),
            ),
            AppDialogAction(
              label: S.of(context).removeButton,
              isPrimary: true,
              isDestructive: true,
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    await ref
        .read(bookmarksProvider.notifier)
        .toggleBookmark(
          item.vocabularyId,
          personalVocabularyId: item.personalVocabularyId,
        );
    final isBookmarked = item.isPersonal
        ? false
        : ref.read(bookmarkIdsProvider).value?.contains(item.vocabularyId) ??
              false;
    if (!isBookmarked && mounted) {
      AppToast.show(
        context,
        message: S.of(context).wordRemovedToast,
        type: AppToastType.info,
      );
    }
  }

  void _showDetail(BookmarkWithVocabulary item, String? preferredDialect) {
    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (context) => _BookmarkDetailSheet(
        item: item,
        preferredDialect: preferredDialect,
        onPlayAudio:
            item.audioUrl != null ? () => _playAudio(item.audioUrl!) : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bookmarksAsync = ref.watch(bookmarksProvider);
    final currentSort = ref.watch(bookmarkSortProvider);
    final currentFilter = ref.watch(bookmarkSourceFilterProvider);
    final bookmarkIds = ref.watch(bookmarkIdsProvider).value;

    final profileAsync = ref.watch(userProfileProvider);
    final preferredDialect = profileAsync.value?.preferredDialect;

    return Scaffold(
      appBar: AppAppBar(
        title: Text(S.of(context).savedWordsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.style_outlined),
            tooltip: S.of(context).studyLabel,
            onPressed: () => context.push('/bookmarks/flashcard'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.sm,
              AppSpacing.lg,
              AppSpacing.sm,
            ),
            child: AppInput(
              controller: _searchController,
              hint: S.of(context).searchWordsOrMeaningsHint,
              prefixIcon: Icon(Icons.search, color: c.mutedForeground),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear, color: c.mutedForeground),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
                      },
                    )
                  : null,
              onChanged: _onSearchChanged,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              0,
              AppSpacing.lg,
              AppSpacing.sm,
            ),
            child: Row(
              children: [
                Expanded(
                  child: AppDropdownField<BookmarkSourceFilter>(
                    label: S.of(context).wordSourceLabel,
                    value: currentFilter,
                    items: BookmarkSourceFilter.values,
                    itemLabelBuilder: (f) => _filterLabel(context, f),
                    onChanged: (value) {
                      if (value != null) _onFilterChanged(value);
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: AppDropdownField<BookmarkSort>(
                    label: S.of(context).sortBy,
                    value: currentSort,
                    items: BookmarkSort.values,
                    itemLabelBuilder: (s) => _sortLabel(context, s),
                    onChanged: (value) {
                      if (value != null) _onSortChanged(value);
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _buildBody(
              bookmarksAsync,
              bookmarkIds,
              preferredDialect,
              currentFilter,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(
    AsyncValue<BookmarksPage> asyncPage,
    Set<String>? bookmarkIds,
    String? preferredDialect,
    BookmarkSourceFilter filter,
  ) {
    return asyncPage.when(
      data: (page) {
        final filtered = filter == BookmarkSourceFilter.all
            ? page.items
            : page.items.where(filter.matches).toList();
        final hasMoreRaw = page.items.length < page.totalItems;

        if (filtered.isEmpty) {
          // The active filter hid everything loaded so far. Keep pulling pages
          // until a match shows up or the server runs out, instead of flashing
          // an empty state while more items still exist server-side.
          if (hasMoreRaw) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              ref.read(bookmarksProvider.notifier).loadMore();
            });
            return const _BookmarksLoading();
          }
          return const _BookmarksEmpty();
        }

        return RefreshIndicator(
          onRefresh: _onRefresh,
          child: ListView.separated(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.xs,
              AppSpacing.lg,
              AppSpacing.xl,
            ),
            itemCount: filtered.length + (hasMoreRaw ? 1 : 0),
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              if (index == filtered.length) {
                return const _BookmarkSkeletonTile();
              }

              final item = filtered[index];
              return _BookmarkTile(
                item: item,
                isBookmarked:
                    item.isPersonal ||
                    (bookmarkIds?.contains(item.vocabularyId) ?? true),
                onToggle: _onToggleBookmark,
                onTap: () => _showDetail(item, preferredDialect),
                preferredDialect: preferredDialect,
              );
            },
          ),
        );
      },
      loading: () => const _BookmarksLoading(),
      error: (error, stack) =>
          _BookmarksError(message: error.toString(), onRetry: _onRefresh),
    );
  }
}

// ─── Part-of-speech pill ─────────────────────────────────────────────────────

class _PosPill extends StatelessWidget {
  const _PosPill({required this.partOfSpeech});
  final String partOfSpeech;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final label =
        kPartOfSpeechViLabels[partOfSpeech.toLowerCase()] ?? partOfSpeech;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: AppTypography.caption,
          color: c.mutedForeground,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

// ─── Tile ────────────────────────────────────────────────────────────────────

class _WordBadge extends StatelessWidget {
  const _WordBadge({required this.word, required this.isPersonal});
  final String word;
  final bool isPersonal;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      alignment: Alignment.center,
      child: isPersonal
          ? Icon(Icons.auto_awesome, color: c.primary, size: 20)
          : Text(
              word.isNotEmpty ? word.substring(0, 1).toUpperCase() : '?',
              style: GoogleFonts.inter(
                fontSize: AppTypography.titleSmall,
                fontWeight: FontWeight.w700,
                color: c.primary,
              ),
            ),
    );
  }
}

class _BookmarkTile extends StatelessWidget {
  const _BookmarkTile({
    required this.item,
    required this.isBookmarked,
    required this.onToggle,
    required this.onTap,
    this.preferredDialect,
  });

  final BookmarkWithVocabulary item;
  final bool isBookmarked;
  final Future<void> Function(BookmarkWithVocabulary item) onToggle;
  final VoidCallback onTap;
  final String? preferredDialect;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final displayedWord = _displayWord(item, preferredDialect);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _WordBadge(word: displayedWord, isPersonal: item.isPersonal),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              displayedWord,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodyLarge,
                                fontWeight: FontWeight.w700,
                                color: c.foreground,
                                height: 1.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (item.partOfSpeech != null) ...[
                            const SizedBox(width: AppSpacing.sm),
                            _PosPill(partOfSpeech: item.partOfSpeech!),
                          ],
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        item.translation,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyMedium,
                          color: c.mutedForeground,
                          height: 1.35,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                IconButton(
                  onPressed: () => onToggle(item),
                  visualDensity: VisualDensity.compact,
                  icon: Icon(
                    isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                    color: isBookmarked ? c.primary : c.mutedForeground,
                    size: 22,
                  ),
                  tooltip: S.of(context).removeSavedWordTitle,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Empty / error / loading ─────────────────────────────────────────────────

class _CenteredState extends StatelessWidget {
  const _CenteredState({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 34, color: iconColor),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: AppTypography.titleSmall,
                fontWeight: FontWeight.w700,
                color: c.foreground,
                height: 1.2,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                height: 1.4,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: AppSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class _BookmarksEmpty extends StatelessWidget {
  const _BookmarksEmpty();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return _CenteredState(
      icon: Icons.bookmark_outline_rounded,
      iconColor: c.primary,
      title: S.of(context).noSavedWords,
      message: S.of(context).saveFavoriteWordsDescription,
    );
  }
}

class _BookmarksError extends StatelessWidget {
  const _BookmarksError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return _CenteredState(
      icon: Icons.error_outline_rounded,
      iconColor: c.error,
      title: S.of(context).unableToLoadDataMessage,
      message: message,
      action: AppButton(
        label: S.of(context).retryButton,
        variant: AppButtonVariant.outline,
        onPressed: onRetry,
      ),
    );
  }
}

class _BookmarkSkeletonTile extends StatelessWidget {
  const _BookmarkSkeletonTile();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    Widget bar(double w, double h) => Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
    );

    return Container(
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                bar(120, 16),
                const SizedBox(height: AppSpacing.sm),
                bar(180, 13),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: c.muted,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        ],
      ),
    );
  }
}

class _BookmarksLoading extends StatelessWidget {
  const _BookmarksLoading();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xs,
        AppSpacing.lg,
        AppSpacing.xl,
      ),
      itemCount: 6,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (_, _) => const _BookmarkSkeletonTile(),
    );
  }
}

// ─── Detail sheet ────────────────────────────────────────────────────────────

class _BookmarkDetailSheet extends StatelessWidget {
  const _BookmarkDetailSheet({
    required this.item,
    this.preferredDialect,
    this.onPlayAudio,
  });

  final BookmarkWithVocabulary item;
  final String? preferredDialect;
  final VoidCallback? onPlayAudio;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final displayedWord = _displayWord(item, preferredDialect);

    return SafeArea(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.md,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      S.of(context).wordDetailsTitle,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleSmall,
                        fontWeight: FontWeight.w700,
                        color: c.foreground,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      child: Icon(Icons.close, size: 20, color: c.mutedForeground),
                    ),
                  ),
                ],
              ),
            ),
            Container(height: 1, color: c.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.xl,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (item.isPersonal) ...[
                        Icon(Icons.auto_awesome, size: 20, color: c.primary),
                        const SizedBox(width: AppSpacing.sm),
                      ],
                      Expanded(
                        child: Text(
                          displayedWord,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.headlineSmall,
                            fontWeight: FontWeight.w800,
                            color: c.foreground,
                            height: 1.15,
                          ),
                        ),
                      ),
                      if (onPlayAudio != null) ...[
                        const SizedBox(width: AppSpacing.sm),
                        _AudioButton(onTap: onPlayAudio!),
                      ],
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  if (item.partOfSpeech != null) ...[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: _PosPill(partOfSpeech: item.partOfSpeech!),
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  Text(
                    item.translation,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleMedium,
                      fontWeight: FontWeight.w700,
                      color: c.foreground,
                      height: 1.3,
                    ),
                  ),
                  if (item.classifier != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      '${S.of(context).classifierLabel} ${item.classifier}',
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        color: c.mutedForeground,
                      ),
                    ),
                  ],
                  if (item.exampleSentence != null) ...[
                    const SizedBox(height: AppSpacing.lg),
                    _ExampleBlock(
                      sentence: item.exampleSentence!,
                      translation: item.exampleTranslation,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AudioButton extends StatelessWidget {
  const _AudioButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.full),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: c.primary.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.volume_up_rounded, color: c.primary, size: 22),
        ),
      ),
    );
  }
}

class _ExampleBlock extends StatelessWidget {
  const _ExampleBlock({required this.sentence, this.translation});
  final String sentence;
  final String? translation;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            S.of(context).exampleLabel,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w700,
              color: c.mutedForeground,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            sentence,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              fontStyle: FontStyle.italic,
              color: c.foreground,
              height: 1.4,
            ),
          ),
          if (translation != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              translation!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
