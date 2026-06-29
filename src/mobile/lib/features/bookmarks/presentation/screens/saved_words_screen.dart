import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/bookmark_providers.dart';
import '../../domain/bookmark_models.dart';
import '../../../../core/services/audio_player_service.dart';
import '../../../../core/network/media_url.dart';
import '../../../profile/data/profile_providers.dart';
import '../../../assistant/data/saved_words_view_state_provider.dart';

String _displayWord(BookmarkWithVocabulary item, String? preferredDialect) {
  if (preferredDialect != null &&
      item.dialectVariants != null &&
      item.dialectVariants![preferredDialect] != null &&
      item.dialectVariants![preferredDialect]!.isNotEmpty) {
    return item.dialectVariants![preferredDialect]!;
  }
  return item.word;
}

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
    // Reset the assistant-facing snapshot so the next screen doesn't see a
    // stale "current card" pointer.
    try {
      ref.read(savedWordsViewStateProvider.notifier).reset();
    } catch (_) {}
    _pageController.dispose();
    _flipController.dispose();
    super.dispose();
  }

  void _flip() {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    setState(() {
      _isFlipped = !_isFlipped;
    });
    ref.read(savedWordsViewStateProvider.notifier).setFlipped(_isFlipped);
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
    ref.read(savedWordsViewStateProvider.notifier).setIndex(index);
    _flipController.reverse();
  }

  Future<void> _playAudio(String audioUrl) async {
    final audioService = ref.read(audioPlayerProvider);
    await audioService.play(resolveMediaUrl(audioUrl));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bookmarksAsync = ref.watch(flashcardBookmarksProvider);

    final profileAsync = ref.watch(userProfileProvider);
    final preferredDialect = profileAsync.value?.preferredDialect;

    final total = bookmarksAsync.value?.length ?? 0;
    final hasItems = total > 0;
    final activeIndex = hasItems ? _currentIndex.clamp(0, total - 1) : 0;

    return Scaffold(
      appBar: AppAppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
          tooltip: S.of(context).exitButton,
        ),
        title: hasItems
            ? Text(
                '${activeIndex + 1} / $total',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleSmall,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
              )
            : null,
        bottom: hasItems
            ? _FlashcardProgress(value: (activeIndex + 1) / total)
            : null,
      ),
      body: bookmarksAsync.when(
        data: (items) {
          if (items.isEmpty) return const _SavedWordsEmpty();
          final safeIndex = _currentIndex.clamp(0, items.length - 1);
          if (safeIndex != _currentIndex) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              setState(() => _currentIndex = safeIndex);
              ref
                  .read(savedWordsViewStateProvider.notifier)
                  .setIndex(safeIndex);
              if (_pageController.hasClients) {
                _pageController.jumpToPage(safeIndex);
              }
            });
          }
          return _buildCardStack(items, preferredDialect, safeIndex);
        },
        loading: () => const _SavedWordsLoading(),
        error: (e, _) => _SavedWordsError(
          message: e.toString(),
          onRetry: () =>
              ref.read(flashcardBookmarksProvider.notifier).refresh(),
        ),
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
          onPlayAudio:
              item.audioUrl != null ? () => _playAudio(item.audioUrl!) : null,
          preferredDialect: preferredDialect,
        );
      },
    );
  }
}

// ─── App-bar progress ────────────────────────────────────────────────────────

class _FlashcardProgress extends StatelessWidget
    implements PreferredSizeWidget {
  const _FlashcardProgress({required this.value});
  final double value;

  @override
  Size get preferredSize => const Size.fromHeight(AppSpacing.md);

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: AppProgress(value: value, height: 4, color: c.primary),
    );
  }
}

// ─── Card ──────────────────────────────────────────────────────────────────

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
            final angle = isActive
                ? flipController.value * math.pi
                : (isFlipped ? math.pi : 0.0);
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
    final displayedWord = _displayWord(item, preferredDialect);

    return _CardSurface(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (item.isPersonal) ...[
            Icon(Icons.auto_awesome, color: c.primary, size: 22),
            const SizedBox(height: AppSpacing.md),
          ],
          Text(
            displayedWord,
            style: GoogleFonts.inter(
              fontSize: AppTypography.headlineMedium,
              fontWeight: FontWeight.w800,
              color: c.foreground,
              height: 1.15,
            ),
            textAlign: TextAlign.center,
          ),
          if (onPlayAudio != null) ...[
            const SizedBox(height: AppSpacing.xl),
            _CircleAudioButton(onTap: onPlayAudio!),
          ],
          const SizedBox(height: AppSpacing.xl),
          _FlipHint(label: S.of(context).tapToFlipBack),
        ],
      ),
    );
  }

  Widget _buildBack(BuildContext context) {
    final c = AppTheme.colors(context);

    return _CardSurface(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              S.of(context).translationLabel.toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: AppTypography.caption,
                fontWeight: FontWeight.w700,
                color: c.mutedForeground,
                letterSpacing: 0.6,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              item.translation,
              style: GoogleFonts.inter(
                fontSize: AppTypography.headlineSmall,
                fontWeight: FontWeight.w800,
                color: c.foreground,
                height: 1.25,
              ),
            ),
            if (item.partOfSpeech != null) ...[
              const SizedBox(height: AppSpacing.md),
              _PosPill(partOfSpeech: item.partOfSpeech!),
            ],
            if (item.classifier != null) ...[
              const SizedBox(height: AppSpacing.md),
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
            const SizedBox(height: AppSpacing.xl),
            Center(child: _FlipHint(label: S.of(context).tapToFlipBack)),
          ],
        ),
      ),
    );
  }
}

class _CardSurface extends StatelessWidget {
  const _CardSurface({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: c.border, width: 1),
      ),
      child: child,
    );
  }
}

class _CircleAudioButton extends StatelessWidget {
  const _CircleAudioButton({required this.onTap});
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
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: c.primary.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.volume_up_rounded, color: c.primary, size: 28),
        ),
      ),
    );
  }
}

class _FlipHint extends StatelessWidget {
  const _FlipHint({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.touch_app_outlined, size: 16, color: c.mutedForeground),
        const SizedBox(width: AppSpacing.xs),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            color: c.mutedForeground,
          ),
        ),
      ],
    );
  }
}

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
        vertical: 3,
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

// ─── Empty / error / loading ─────────────────────────────────────────────────

class _SavedWordsCentered extends StatelessWidget {
  const _SavedWordsCentered({
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

class _SavedWordsEmpty extends StatelessWidget {
  const _SavedWordsEmpty();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return _SavedWordsCentered(
      icon: Icons.style_outlined,
      iconColor: c.primary,
      title: S.of(context).noSavedWords,
      message: S.of(context).saveFavoriteWordsDescription2,
    );
  }
}

class _SavedWordsError extends StatelessWidget {
  const _SavedWordsError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return _SavedWordsCentered(
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

class _SavedWordsLoading extends StatelessWidget {
  const _SavedWordsLoading();

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

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: _CardSurface(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            bar(180, 32),
            const SizedBox(height: AppSpacing.md),
            bar(100, 16),
            const SizedBox(height: AppSpacing.xl),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: c.muted,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            bar(120, 12),
          ],
        ),
      ),
    );
  }
}
