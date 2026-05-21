import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/correction.dart';
import '../../domain/message_feedback.dart';

class FeedbackBottomSheet extends StatefulWidget {
  const FeedbackBottomSheet({
    super.key,
    required this.feedback,
    this.scrollToCorrectionIndex,
  });

  final MessageFeedback feedback;
  final int? scrollToCorrectionIndex;

  @override
  State<FeedbackBottomSheet> createState() => _FeedbackBottomSheetState();
}

class _FeedbackBottomSheetState extends State<FeedbackBottomSheet> {
  final ScrollController _scrollController = ScrollController();
  static const double _correctionItemHeight = 56.0;
  static const double _headerHeight = 56.0;
  static const double _dividerHeight = 1.0;

  @override
  void initState() {
    super.initState();
    if (widget.scrollToCorrectionIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToCorrection());
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCorrection() {
    final index = widget.scrollToCorrectionIndex!;
    if (index < widget.feedback.corrections.length) {
      final offset = _headerHeight + index * _correctionItemHeight;
      _scrollController.animateTo(
        offset,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final corrections = widget.feedback.corrections;
    final showReview = widget.feedback.reviewAvailable && widget.feedback.review != null;

    return DraggableScrollableSheet(
      initialChildSize: 0.4,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            _buildHeader(c),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: EdgeInsets.zero,
                itemCount: corrections.length + (showReview ? 2 : 0),
                itemBuilder: (context, index) {
                  if (index < corrections.length) {
                    final isHighlighted = widget.scrollToCorrectionIndex == index;
                    return _CorrectionItem(
                      correction: corrections[index],
                      isHighlighted: isHighlighted,
                    );
                  }

                  final reviewIndex = index - corrections.length;
                  if (reviewIndex == 0) {
                    return Divider(color: c.border, height: _dividerHeight);
                  }

                  return _ReviewSection(review: widget.feedback.review!);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader(AppColors c) {
    return Container(
      height: _headerHeight,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          Text(
            'Phản hồi',
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleSmall,
              fontWeight: FontWeight.w600,
              color: c.foreground,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Icon(Icons.close, size: 20, color: c.mutedForeground),
          ),
        ],
      ),
    );
  }
}

class _CorrectionItem extends StatefulWidget {
  const _CorrectionItem({
    required this.correction,
    required this.isHighlighted,
  });

  final Correction correction;
  final bool isHighlighted;

  @override
  State<_CorrectionItem> createState() => _CorrectionItemState();
}

class _CorrectionItemState extends State<_CorrectionItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _highlightController;
  late final Animation<Color?> _highlightAnimation;

  @override
  void initState() {
    super.initState();
    _highlightController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _highlightAnimation = ColorTween(
      begin: AppTheme.colors(context).primary.withAlpha(40),
      end: Colors.transparent,
    ).animate(_highlightController);

    if (widget.isHighlighted) {
      _highlightController.forward();
    }
  }

  @override
  void dispose() {
    _highlightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final typeLabel = widget.correction.type == 'SPELLING' ? 'Chính tả' : 'Ngữ pháp';

    return AnimatedBuilder(
      animation: _highlightAnimation,
      builder: (context, child) {
        return Container(
          color: _highlightAnimation.value,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: [
              Text(
                widget.correction.original,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  color: c.error,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: c.error,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                child: Icon(Icons.arrow_forward, size: 16, color: c.mutedForeground),
              ),
              Text(
                widget.correction.corrected,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  fontWeight: FontWeight.w600,
                  color: c.success,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              AppBadge(
                label: typeLabel,
                color: widget.correction.type == 'SPELLING' ? c.warning : c.info,
                fontSize: AppTypography.caption - 1,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ReviewSection extends StatelessWidget {
  const _ReviewSection({required this.review});

  final String review;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Text(
        review,
        style: GoogleFonts.inter(
          fontSize: AppTypography.bodyMedium,
          color: c.foreground,
        ),
      ),
    );
  }
}
