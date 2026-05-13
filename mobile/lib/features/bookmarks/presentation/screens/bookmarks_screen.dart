import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../widgets/bookmark_icon_button.dart';

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
    ref.read(bookmarkSearchProvider.notifier).setSearch(
          trimmed.isEmpty ? null : trimmed,
        );
    ref.invalidate(bookmarksProvider);
  }

  void _onSortChanged(BookmarkSort sort) {
    ref.read(bookmarkSortProvider.notifier).setSort(sort);
    ref.invalidate(bookmarksProvider);
  }

  Future<void> _onRefresh() async {
    await ref.read(bookmarksProvider.notifier).refresh();
  }

  Future<void> _onToggleBookmark(String vocabularyId) async {
    final isBookmarked =
        await ref.read(bookmarksProvider.notifier).toggleBookmark(vocabularyId);
    if (!isBookmarked && mounted) {
      AppToast.show(context, message: 'Word removed', type: AppToastType.info);
    }
  }

  void _showDetail(BookmarkWithVocabulary item) {
    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (context) => _BookmarkDetailSheet(item: item),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookmarksAsync = ref.watch(bookmarksProvider);
    final currentSort = ref.watch(bookmarkSortProvider);

    return Scaffold(
      appBar: AppAppBar(
        title: const Text('Saved Words'),
        actions: [
          IconButton(
            icon: const Icon(Icons.school),
            tooltip: 'Study',
            onPressed: () => context.push('/bookmarks/flashcard'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
            child: AppInput(
              controller: _searchController,
              hint: 'Search words or meanings...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
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
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
            child: AppDropdownField<BookmarkSort>(
              label: 'Sort by',
              value: currentSort,
              items: BookmarkSort.values,
              itemLabelBuilder: (sort) => switch (sort) {
                BookmarkSort.newest => 'Newest',
                BookmarkSort.oldest => 'Oldest',
                BookmarkSort.az => 'A-Z',
                BookmarkSort.za => 'Z-A',
                BookmarkSort.difficulty => 'Difficulty',
              },
              onChanged: (value) {
                if (value != null) _onSortChanged(value);
              },
            ),
          ),
          Expanded(child: _buildBody(bookmarksAsync)),
        ],
      ),
    );
  }

  Widget _buildBody(AsyncValue<BookmarksPage> asyncPage) {
    final c = AppTheme.colors(context);
    return asyncPage.when(
      data: (page) {
        if (page.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.bookmark_border, size: 64, color: c.mutedForeground),
                const SizedBox(height: 16),
                Text(
                  'No saved words yet',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: c.mutedForeground,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Save your favorite words from lessons',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: _onRefresh,
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(AppSpacing.sm),
            itemCount: page.items.length + (page.items.length < page.totalItems ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == page.items.length) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: AppSpinner(),
                  ),
                );
              }

              final item = page.items[index];
              return _BookmarkTile(
                item: item,
                onToggle: _onToggleBookmark,
                onTap: () => _showDetail(item),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: AppSpinner()),
      error: (error, stack) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: c.error),
            const SizedBox(height: 16),
            Text(error.toString(), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            AppButton(
              label: 'Retry',
              variant: AppButtonVariant.primary,
              onPressed: _onRefresh,
            ),
          ],
        ),
      ),
    );
  }
}

class _BookmarkTile extends StatelessWidget {
  const _BookmarkTile({
    required this.item,
    required this.onToggle,
    required this.onTap,
  });

  final BookmarkWithVocabulary item;
  final Future<void> Function(String vocabularyId) onToggle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return AppCard(
      variant: AppCardVariant.outlined,
      borderRadius: AppRadius.lg,
      margin: const EdgeInsets.symmetric(vertical: AppSpacing.xs, horizontal: AppSpacing.sm),
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      item.word,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (item.partOfSpeech != null) ...[
                      const SizedBox(width: AppSpacing.sm),
                      AppChip(
                        label: kPartOfSpeechViLabels[item.partOfSpeech!.toLowerCase()] ?? item.partOfSpeech!,
                        color: c.info,
                        fontSize: AppTypography.caption,
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  item.translation,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                ),
              ],
            ),
          ),
          BookmarkIconButton(
            vocabularyId: item.vocabularyId,
            isBookmarked: true,
            onToggle: (_) => onToggle(item.vocabularyId),
          ),
        ],
      ),
    );
  }
}

class _BookmarkDetailSheet extends StatelessWidget {
  const _BookmarkDetailSheet({required this.item});

  final BookmarkWithVocabulary item;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: c.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                item.word,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              if (item.phonetic != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '/${item.phonetic}/',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              Text(
                item.translation,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              if (item.partOfSpeech != null) ...[
                const SizedBox(height: AppSpacing.sm),
                AppChip(
                  label: kPartOfSpeechViLabels[item.partOfSpeech!.toLowerCase()] ?? item.partOfSpeech!,
                  color: c.info,
                ),
              ],
              if (item.classifier != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Classifier: ${item.classifier}',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
              if (item.exampleSentence != null) ...[
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Example:',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  item.exampleSentence!,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                ),
                if (item.exampleTranslation != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    item.exampleTranslation!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: c.mutedForeground,
                        ),
                  ),
                ],
              ],
              if (item.dialectVariants != null &&
                  item.dialectVariants!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Dialect Variants:',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: AppSpacing.xs),
                ...item.dialectVariants!.entries.map(
                  (e) => Text(
                    '${e.key}: ${e.value}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
