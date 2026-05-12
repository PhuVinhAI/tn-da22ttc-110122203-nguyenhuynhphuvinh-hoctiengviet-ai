import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../../../../core/services/audio_player_service.dart';

class FlashcardScreen extends ConsumerStatefulWidget {
  const FlashcardScreen({super.key});

  @override
  ConsumerState<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends ConsumerState<FlashcardScreen>
    with SingleTickerProviderStateMixin {
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
    final bookmarksAsync = ref.watch(flashcardBookmarksProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
          tooltip: 'Thoát',
        ),
        title: Text(
          _items.isNotEmpty ? '${_currentIndex + 1}/${_items.length}' : '',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        centerTitle: true,
      ),
      body: bookmarksAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return _buildEmpty();
          }
          _items = items;
          if (_currentIndex >= items.length) {
            _currentIndex = 0;
          }
          return _buildCardStack(items);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(e.toString(), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(flashcardBookmarksProvider),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_border, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Chưa lưu từ nào',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Lưu từ yêu thích để học bằng flashcard',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
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
          flipController: index == _currentIndex ? _flipController : AnimationController.unbounded(vsync: this),
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
    required this.onFlip,
    this.onPlayAudio,
  });

  final BookmarkWithVocabulary item;
  final bool isFlipped;
  final AnimationController flipController;
  final VoidCallback onFlip;
  final VoidCallback? onPlayAudio;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onFlip,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: AnimatedBuilder(
          animation: flipController,
          builder: (context, child) {
            final angle = flipController.value * math.pi;
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 8,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              item.word,
              style: theme.textTheme.headlineLarge,
              textAlign: TextAlign.center,
            ),
            if (item.phonetic != null) ...[
              const SizedBox(height: 8),
              Text(
                '/${item.phonetic}/',
                style: theme.textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onPlayAudio != null) ...[
              const SizedBox(height: 16),
              IconButton(
                icon: Icon(Icons.volume_up, size: 32, color: colorScheme.primary),
                onPressed: onPlayAudio,
                tooltip: 'Nghe phát âm',
              ),
            ],
            const SizedBox(height: 24),
            Text(
              'Chạm để lật',
              style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBack(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 8,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.translation,
                style: theme.textTheme.headlineSmall,
              ),
              if (item.partOfSpeech != null) ...[
                const SizedBox(height: 8),
                Chip(
                  label: Text(
                    kPartOfSpeechViLabels[item.partOfSpeech] ?? item.partOfSpeech!,
                  ),
                  backgroundColor: colorScheme.primaryContainer,
                  labelStyle: TextStyle(color: colorScheme.onPrimaryContainer),
                ),
              ],
              if (item.classifier != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Lượng từ: ${item.classifier}',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
              if (item.exampleSentence != null) ...[
                const SizedBox(height: 16),
                Text(
                  'Ví dụ:',
                  style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.exampleSentence!,
                  style: theme.textTheme.bodyLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                ),
                if (item.exampleTranslation != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.exampleTranslation!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ],
              const SizedBox(height: 24),
              Text(
                'Chạm để lật lại',
                style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
