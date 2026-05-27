import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../../../../core/services/audio_player_service.dart';
import '../../../profile/data/profile_providers.dart';

class SavedWordsScreen extends ConsumerStatefulWidget {
  const SavedWordsScreen({super.key});

  @override
  ConsumerState<SavedWordsScreen> createState() => _SavedWordsScreenState();
}

class _SavedWordsScreenState extends ConsumerState<SavedWordsScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  late AnimationController _flipController;
  int _currentIndex = 0;
  bool _isFlipped = false;
  List<BookmarkWithVocabulary> _items = [];

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _flipController.dispose();
    super.dispose();
  }

  void _flip() {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    setState(() {
      _isFlipped = !_isFlipped;
    });
    if (reduceMotion) return;
    if (_isFlipped) {
      _flipController.forward();
    } else {
      _flipController.reverse();
    }
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
      _isFlipped = false;
    });
    _flipController.reverse();
  }

  Future<void> _playAudio(String audioUrl) async {
    final audioService = ref.read(audioPlayerProvider);
    await audioService.play(audioUrl);
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bookmarksAsync = ref.watch(flashcardBookmarksProvider);

    final profileAsync = ref.watch(userProfileProvider);
    final preferredDialect = profileAsync.value?.preferredDialect;

    return Scaffold(
      appBar: AppAppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
          tooltip: 'Exit',
        ),
        title: Text(
          _items.isNotEmpty ? '${_currentIndex + 1}/${_items.length}' : '',
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
      body: bookmarksAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return _buildEmpty(c);
          }
          final safeIndex = _currentIndex.clamp(0, items.length - 1);
          if (safeIndex != _currentIndex) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              setState(() => _currentIndex = safeIndex);
              if (_pageController.hasClients) {
                _pageController.jumpToPage(safeIndex);
              }
            });
          }
          _items = items;
          return _buildCardStack(items, preferredDialect, safeIndex);
        },
        loading: () => const _SavedWordsLoading(),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: c.error.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.error_outline_rounded,
                    size: 80,
                    color: c.error,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  e.toString(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.lg),
                AppButton(
                  label: 'Retry',
                  variant: AppButtonVariant.primary,
                  onPressed: () => ref.read(flashcardBookmarksProvider.notifier).refresh(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty(AppColors c) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: c.primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.bookmark_outline_rounded,
              size: 80,
              color: c.primary,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'No saved words yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: c.foreground,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Save favorite words to study with flashcards',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: c.mutedForeground,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardStack(
    List<BookmarkWithVocabulary> items,
    String? preferredDialect,
    int activeIndex,
  ) {
    return PageView.builder(
      key: ValueKey(items.map((i) => i.id).join(',')),
      controller: _pageController,
      itemCount: items.length,
      onPageChanged: _onPageChanged,
      itemBuilder: (context, index) {
        final item = items[index];
        return _Flashcard(
          item: item,
          isFlipped: index == activeIndex && _isFlipped,
          flipController: _flipController,
          isActive: index == activeIndex,
          onFlip: _flip,
          onPlayAudio: item.audioUrl != null ? () => _playAudio(item.audioUrl!) : null,
          preferredDialect: preferredDialect,
        );
      },
    );
  }
}

class _SavedWordsLoading extends StatelessWidget {
  const _SavedWordsLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: AppCard(
        variant: AppCardVariant.outlined,
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 180,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 100,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 80,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class _Flashcard extends StatelessWidget {
  const _Flashcard({
    required this.item,
    required this.isFlipped,
    required this.flipController,
    required this.isActive,
    required this.onFlip,
    this.onPlayAudio,
    this.preferredDialect,
  });

  final BookmarkWithVocabulary item;
  final bool isFlipped;
  final AnimationController flipController;
  final bool isActive;
  final VoidCallback onFlip;
  final VoidCallback? onPlayAudio;
  final String? preferredDialect;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onFlip,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: AnimatedBuilder(
          animation: flipController,
          builder: (context, child) {
            final angle = isActive ? flipController.value * math.pi : (isFlipped ? math.pi : 0.0);
            return Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateY(angle),
              child: angle < math.pi / 2
                  ? _buildFront(context)
                  : Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()..rotateY(math.pi),
                      child: _buildBack(context),
                    ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildFront(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    final String displayedWord;
    if (preferredDialect != null &&
        item.dialectVariants != null &&
        item.dialectVariants![preferredDialect] != null &&
        item.dialectVariants![preferredDialect]!.isNotEmpty) {
      displayedWord = item.dialectVariants![preferredDialect]!;
    } else {
      displayedWord = item.word;
    }

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            displayedWord,
            style: theme.textTheme.headlineLarge,
            textAlign: TextAlign.center,
          ),
          if (item.phonetic != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              '/${item.phonetic}/',
              style: theme.textTheme.titleMedium?.copyWith(
                    color: c.mutedForeground,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
          if (onPlayAudio != null) ...[
            const SizedBox(height: AppSpacing.lg),
            IconButton(
              icon: Icon(Icons.volume_up, size: 32, color: c.primary),
              onPressed: onPlayAudio,
              tooltip: 'Play pronunciation',
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Tap to flip',
            style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBack(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.translation,
              style: theme.textTheme.headlineSmall,
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
                style: theme.textTheme.bodyMedium,
              ),
            ],
            if (item.exampleSentence != null) ...[
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Example:',
                style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                item.exampleSentence!,
                style: theme.textTheme.bodyLarge?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
              ),
              if (item.exampleTranslation != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(
                  item.exampleTranslation!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                        color: c.mutedForeground,
                      ),
                ),
              ],
            ],
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Tap to flip back',
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
