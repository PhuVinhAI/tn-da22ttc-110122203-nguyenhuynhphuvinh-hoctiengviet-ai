import 'package:linvnix/l10n/app_localizations.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../bookmarks/domain/bookmark_models.dart';
import '../../domain/image_analysis_models.dart';

class VocabularyCard extends StatefulWidget {
  const VocabularyCard({
    super.key,
    required this.vocabulary,
    required this.onAdd,
  });

  final ImageAnalysisVocabulary vocabulary;
  final Future<void> Function(ImageAnalysisVocabulary vocabulary) onAdd;

  @override
  State<VocabularyCard> createState() => _VocabularyCardState();
}

class _VocabularyCardState extends State<VocabularyCard> {
  bool _isAdding = false;
  bool _isAdded = false;

  Future<void> _handleAdd() async {
    if (_isAdding || _isAdded) return;

    setState(() => _isAdding = true);
    try {
      await widget.onAdd(widget.vocabulary);
      if (!mounted) return;
      setState(() => _isAdded = true);
    } catch (_) {
      // The caller owns user-facing error state; keep the card retryable.
    } finally {
      if (mounted) {
        setState(() => _isAdding = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final v = widget.vocabulary;
    final pos = v.partOfSpeech == null
        ? null
        : (kPartOfSpeechViLabels[v.partOfSpeech!.toLowerCase()] ??
            v.partOfSpeech!);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: c.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(Icons.translate_rounded, size: 20, color: c.primary),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      v.word,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleSmall,
                        fontWeight: FontWeight.w700,
                        color: c.foreground,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      v.translation,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyMedium,
                        color: c.mutedForeground,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (pos != null || v.classifier != null) ...[
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                if (pos != null) _MetaChip(label: pos),
                if (v.classifier != null)
                  _MetaChip(
                    label: S.of(context).classifierLabelParam(v.classifier!),
                  ),
              ],
            ),
          ],
          if (v.exampleSentence != null) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: c.muted.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    v.exampleSentence!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      color: c.foreground,
                      fontStyle: FontStyle.italic,
                      height: 1.4,
                    ),
                  ),
                  if (v.exampleTranslation != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      v.exampleTranslation!,
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
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: _isAdded ? S.of(context).addedLabel : S.of(context).addLabel,
            icon: Icon(_isAdded ? Icons.check_rounded : Icons.add_rounded),
            variant: _isAdded
                ? AppButtonVariant.secondary
                : AppButtonVariant.primary,
            isLoading: _isAdding,
            isFullWidth: true,
            onPressed: _isAdded || _isAdding
                ? null
                : () => unawaited(_handleAdd()),
            fontSize: AppTypography.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs + 2,
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
          fontWeight: FontWeight.w500,
          color: c.mutedForeground,
        ),
      ),
    );
  }
}
