import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';

/// Section header used on course / module detail screens. Matches the flat
/// profile/settings header style: large inter title with optional subtitle and
/// trailing compact actions.
class ContentListHeader extends StatelessWidget {
  const ContentListHeader({
    super.key,
    required this.title,
    this.progressText,
    this.showCompleteAll = false,
    this.showReset = false,
    this.isCompletingAll = false,
    this.isResetting = false,
    this.onCompleteAll,
    this.onReset,
  });

  final String title;
  final String? progressText;
  final bool showCompleteAll;
  final bool showReset;
  final bool isCompletingAll;
  final bool isResetting;
  final VoidCallback? onCompleteAll;
  final VoidCallback? onReset;

  static const _compactPadding =
      EdgeInsets.symmetric(horizontal: 10, vertical: 6);

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final hasActions = showCompleteAll || showReset;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.md,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.titleMedium,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.2,
                  ),
                ),
                if (progressText != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    progressText!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: c.mutedForeground,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (hasActions) ...[
            const SizedBox(width: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              alignment: WrapAlignment.end,
              children: [
                if (showCompleteAll)
                  AppButton(
                    label: isCompletingAll ? '...' : S.of(context).completeAll,
                    variant: AppButtonVariant.outline,
                    padding: _compactPadding,
                    fontSize: AppTypography.bodySmall,
                    onPressed: isCompletingAll ? null : onCompleteAll,
                    icon: isCompletingAll
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.done_all, size: 14),
                  ),
                if (showReset)
                  AppButton(
                    label: isResetting ? '...' : S.of(context).resetLabel,
                    variant: AppButtonVariant.outline,
                    padding: _compactPadding,
                    fontSize: AppTypography.bodySmall,
                    onPressed: isResetting ? null : onReset,
                    icon: isResetting
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.restart_alt, size: 14),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// AI custom-practice section shown at the foot of course / module detail.
class CustomPracticeSection extends StatelessWidget {
  const CustomPracticeSection({
    super.key,
    required this.eligible,
    required this.lockedMessage,
    required this.emptyMessage,
    required this.isCreating,
    this.error,
    this.onCreate,
    this.onCancelCreate,
    this.exerciseCards = const [],
  });

  final bool eligible;
  final String lockedMessage;
  final String emptyMessage;
  final bool isCreating;
  final String? error;
  final VoidCallback? onCreate;
  final VoidCallback? onCancelCreate;
  final List<Widget> exerciseCards;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: c.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                ),
                child: Icon(Icons.auto_awesome, color: c.primary, size: 18),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                S.of(context).customPracticeLabel,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleMedium,
                  fontWeight: FontWeight.w700,
                  color: c.foreground,
                  height: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (!eligible)
            _StatusMessage(
              icon: Icons.lock_outline,
              message: lockedMessage,
            )
          else ...[
            if (exerciseCards.isEmpty && !isCreating) ...[
              _StatusMessage(
                icon: Icons.auto_awesome_outlined,
                message: emptyMessage,
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            if (isCreating) ...[
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  label: S.of(context).generatingExercises,
                  variant: AppButtonVariant.secondary,
                  onPressed: null,
                  icon: const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  label: S.of(context).cancelButton2,
                  variant: AppButtonVariant.outline,
                  onPressed: onCancelCreate,
                ),
              ),
            ] else
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  label: S.of(context).createCustomPractice,
                  variant: AppButtonVariant.primary,
                  onPressed: onCreate,
                  icon: const Icon(Icons.add),
                ),
              ),
          ],
          if (error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              error!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.error,
              ),
            ),
          ],
          if (exerciseCards.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            ...exerciseCards,
          ],
        ],
      ),
    );
  }
}

class _StatusMessage extends StatelessWidget {
  const _StatusMessage({
    required this.icon,
    required this.message,
  });

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: c.mutedForeground),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
