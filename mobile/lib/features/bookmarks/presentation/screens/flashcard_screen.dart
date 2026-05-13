import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../../../../core/services/audio_player_service.dart';

class FlashcardScreen extends ConsumerStatefulWidget {
  const FlashcardScreen({super.key});

  @override
  ConsumerState<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends ConsumerState<FlashcardScreen>
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

    return Scaffold(
      appBar: AppAppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
          tooltip: 'Thoát',
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
          _items = items;
          if (_currentIndex >= items.length) {
            _currentIndex = 0;
          }
          return _buildCardStack(items);
        },
        loading: () => const Center(child: AppSpinner()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: c.error),
              const SizedBox(height: 16),
              Text(e.toString(), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              AppButton(
                label: 'Thử lại',
                variant: AppButtonVariant.primary,
                onPressed: () => ref.invalidate(flashcardBookmarksProvider),
              ),
            ],
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
          Icon(Icons.bookmark_border, size: 64, color: c.mutedForeground),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Chưa lưu từ nào',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: c.mutedForeground,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Lưu từ yêu thích để học bằng flashcard',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: c.mutedForeground,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardStack(List<BookmarkWithVocabulary> items) {
    return PageView.builder(
      controller: _pageController,
      itemCount: items.length,
      onPageChanged: _onPageChanged,
      itemBuilder: (context, index) {
        final item = items[index];
        return _Flashcard(
          item: item,
          isFlipped: index == _currentIndex && _isFlipped,
          flipController: _flipController,
          isActive: index == _currentIndex,
          onFlip: _flip,
          onPlayAudio: item.audioUrl != null ? () => _playAudio(item.audioUrl!) : null,
        );
      },
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
  });

  final BookmarkWithVocabulary item;
  final bool isFlipped;
  final AnimationController flipController;
  final bool isActive;
  final VoidCallback onFlip;
  final VoidCallback? onPlayAudio;

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

    return AppCard(
      variant: AppCardVariant.outlined,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            item.word,
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
              tooltip: 'Nghe phát âm',
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Chạm để lật',
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
                'Lượng từ: ${item.classifier}',
                style: theme.textTheme.bodyMedium,
              ),
            ],
            if (item.exampleSentence != null) ...[
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Ví dụ:',
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
              'Chạm để lật lại',
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
