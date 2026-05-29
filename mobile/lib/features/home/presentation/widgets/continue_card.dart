import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/home_providers.dart';

class ContinueCard extends ConsumerWidget {
  const ContinueCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final continueAsync = ref.watch(continueLearningProvider);

    return continueAsync.when(
      loading: () => const _ShimmerCard(),
      error: (error, _) => _ErrorCard(
        onRetry: () => ref.read(continueLearningProvider.notifier).refresh(),
      ),
      data: (continueLearning) {
        if (continueLearning == null) {
          return const _EmptyCard();
        }
        return _DataCard(continueLearning: continueLearning);
      },
    );
  }
}

// ─── Shell ───────────────────────────────────────────────────────────────

class _Shell extends StatelessWidget {
  const _Shell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: child,
    );
  }
}

// ─── Data ────────────────────────────────────────────────────────────────

class _DataCard extends StatelessWidget {
  const _DataCard({required this.continueLearning});

  final ContinueLearning continueLearning;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final isInProgress =
        continueLearning.status == ContinueLearningStatus.inProgress;
    final accent = isInProgress ? c.primary : c.success;

    return _Shell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  Icons.menu_book_outlined,
                  color: accent,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isInProgress
                          ? S.of(context).inProgressLabel
                          : S.of(context).completedLabel,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.caption,
                        fontWeight: FontWeight.w700,
                        color: accent,
                        height: 1.2,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      continueLearning.lessonTitle,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyLarge,
                        fontWeight: FontWeight.w700,
                        color: c.foreground,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Semantics(
            label: isInProgress
                ? S
                    .of(context)
                    .continueLessonTitleParam(continueLearning.lessonTitle)
                : S
                    .of(context)
                    .reviewLessonTitleParam(continueLearning.lessonTitle),
            button: true,
            child: AppButton(
              variant: AppButtonVariant.primary,
              isFullWidth: true,
              onPressed: () =>
                  context.push('/lessons/${continueLearning.lessonId}'),
              icon: Icon(isInProgress ? Icons.play_arrow : Icons.replay),
              label: isInProgress
                  ? S.of(context).continueLabel
                  : S.of(context).reviewLabel,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty ───────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return _Shell(
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: c.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Icon(
              Icons.menu_book_outlined,
              size: 28,
              color: c.primary,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            S.of(context).startCourseLabel,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyLarge,
              fontWeight: FontWeight.w700,
              color: c.foreground,
              height: 1.25,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            S.of(context).beginLearningVietnameseToday,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
              height: 1.4,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Semantics(
            label: S.of(context).browseAvailableCourses,
            button: true,
            child: AppButton(
              variant: AppButtonVariant.primary,
              isFullWidth: true,
              onPressed: () => context.go('/courses'),
              icon: const Icon(Icons.school_outlined),
              label: S.of(context).browseCourses,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Error ───────────────────────────────────────────────────────────────

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return _Shell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: c.error.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(Icons.error_outline, color: c.error, size: 24),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      S.of(context).continueSection,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodyLarge,
                        fontWeight: FontWeight.w700,
                        color: c.foreground,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      S.of(context).unableToLoadDataMessage,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        color: c.mutedForeground,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            variant: AppButtonVariant.outline,
            isFullWidth: true,
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: S.of(context).retryButton,
          ),
        ],
      ),
    );
  }
}

// ─── Loading ─────────────────────────────────────────────────────────────

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget box(double w, double h, [double r = AppRadius.sm]) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(r),
          ),
        );

    return _Shell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              box(44, 44, AppRadius.md),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    box(70, 12),
                    const SizedBox(height: AppSpacing.sm),
                    box(200, 16),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          box(double.infinity, 44, AppRadius.md),
        ],
      ),
    );
  }
}
