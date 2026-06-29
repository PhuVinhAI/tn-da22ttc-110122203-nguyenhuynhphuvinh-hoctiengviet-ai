import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
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
        AppToast.show(context, message: S.of(context).errorParam(e.toString()), type: AppToastType.error);
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
      final c = AppTheme.colors(context);
      return Center(
        child: Text(
          S.of(context).noVocabularyForLesson,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            color: c.mutedForeground,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
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

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayedWord,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.titleMedium,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  vocab.translation,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyLarge,
                    color: c.foreground,
                    height: 1.4,
                  ),
                ),
                if (vocab.partOfSpeech != null || vocab.classifier != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.xs,
                    children: [
                      if (vocab.partOfSpeech != null)
                        AppChip(
                          label: vocab.partOfSpeech!,
                          fontSize: AppTypography.caption,
                        ),
                      if (vocab.classifier != null)
                        AppChip(
                          label: S
                              .of(context)
                              .classifierLabelParam(vocab.classifier!),
                          fontSize: AppTypography.caption,
                        ),
                    ],
                  ),
                ],
                if (vocab.exampleSentence != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: c.muted,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: c.border, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          vocab.exampleSentence!,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodyMedium,
                            fontWeight: FontWeight.w500,
                            color: c.foreground,
                            height: 1.45,
                          ),
                        ),
                        if (vocab.exampleTranslation != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            vocab.exampleTranslation!,
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.bodySmall,
                              color: c.mutedForeground,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ],
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
    );
  }
}
