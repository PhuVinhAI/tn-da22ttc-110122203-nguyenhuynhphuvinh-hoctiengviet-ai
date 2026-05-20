import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/lesson_models.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/presentation/widgets/bookmark_icon_button.dart';
import '../../../profile/data/profile_providers.dart';

class VocabularyStepWidget extends ConsumerStatefulWidget {
  const VocabularyStepWidget({
    super.key,
    required this.vocabularies,
    required this.lessonId,
  });
  final List<LessonVocabulary> vocabularies;
  final String lessonId;

  @override
  ConsumerState<VocabularyStepWidget> createState() =>
      _VocabularyStepWidgetState();
}

class _VocabularyStepWidgetState extends ConsumerState<VocabularyStepWidget> {
  final Set<String> _pendingToggleIds = {};

  Future<void> _toggleBookmark(String vocabularyId) async {
    if (_pendingToggleIds.contains(vocabularyId)) return;

    setState(() => _pendingToggleIds.add(vocabularyId));

    try {
      await ref.read(bookmarkIdsProvider.notifier).toggle(vocabularyId);
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: 'Error: $e', type: AppToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _pendingToggleIds.remove(vocabularyId));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookmarkIdsAsync = ref.watch(bookmarkIdsProvider);
    final bookmarkIds = bookmarkIdsAsync.value;

    final profileAsync = ref.watch(userProfileProvider);
    final preferredDialect = profileAsync.value?.preferredDialect;

    if (widget.vocabularies.isEmpty) {
      return const Center(child: Text('No vocabulary for this lesson'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: widget.vocabularies.length,
      itemBuilder: (context, index) {
        final vocab = widget.vocabularies[index];
        return _VocabularyCard(
          vocabulary: vocab,
          isBookmarked: bookmarkIds?.contains(vocab.id) ?? vocab.isBookmarked,
          isPending: _pendingToggleIds.contains(vocab.id),
          onToggle: _toggleBookmark,
          preferredDialect: preferredDialect,
        );
      },
    );
  }
}

class _VocabularyCard extends StatelessWidget {
  const _VocabularyCard({
    required this.vocabulary,
    required this.isBookmarked,
    required this.isPending,
    required this.onToggle,
    this.preferredDialect,
  });
  final LessonVocabulary vocabulary;
  final bool isBookmarked;
  final bool isPending;
  final ValueChanged<String> onToggle;
  final String? preferredDialect;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final vocab = vocabulary;

    final String displayedWord;
    if (preferredDialect != null &&
        vocab.dialectVariants != null &&
        vocab.dialectVariants![preferredDialect] != null &&
        vocab.dialectVariants![preferredDialect]!.isNotEmpty) {
      displayedWord = vocab.dialectVariants![preferredDialect]!;
    } else {
      displayedWord = vocab.word;
    }

    return AppCard(
      variant: AppCardVariant.outlined,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayedWord,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (vocab.phonetic != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        vocab.phonetic!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: c.mutedForeground,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              isPending
                  ? const SizedBox(
                      width: 48,
                      height: 48,
                      child: Center(
                        child: AppSpinner(size: 24, strokeWidth: 2),
                      ),
                    )
                  : BookmarkIconButton(
                      vocabularyId: vocab.id,
                      isBookmarked: isBookmarked,
                      onToggle: onToggle,
                    ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            vocab.translation,
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              if (vocab.partOfSpeech != null)
                AppChip(
                  label: vocab.partOfSpeech!,
                  fontSize: AppTypography.caption,
                ),
              if (vocab.classifier != null)
                AppChip(
                  label: 'CL: ${vocab.classifier}',
                  fontSize: AppTypography.caption,
                ),
            ],
          ),
          if (vocab.exampleSentence != null) ...[
            const SizedBox(height: 8),
            AppCard(
              variant: AppCardVariant.muted,
              padding: const EdgeInsets.all(AppSpacing.md),
              borderRadius: AppRadius.md,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vocab.exampleSentence!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (vocab.exampleTranslation != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      vocab.exampleTranslation!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.mutedForeground,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
