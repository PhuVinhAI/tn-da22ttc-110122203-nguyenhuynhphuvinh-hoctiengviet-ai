import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../domain/lesson_models.dart';
import 'content_shared.dart';

/// Văn bản — render kiểu trang đọc: bản dịch ở trên dạng eyebrow,
/// đoạn văn tiếng Việt là body chính. Mobile tự tách paragraph theo
/// dòng trống trong nội dung gốc.
class TextContentWidget extends StatelessWidget {
  const TextContentWidget({super.key, required this.content});

  final LessonContent content;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final body = content.vietnameseText;
    final translation = content.translation;

    final paragraphs = body
        .split(RegExp(r'\n\s*\n'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList(growable: false);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.xl,
        AppSpacing.xl,
        AppSpacing.xxxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (paragraphs.isEmpty)
            Text(
              body,
              style: GoogleFonts.inter(
                fontSize: AppTypography.titleSmall,
                color: c.foreground,
                fontWeight: FontWeight.w500,
                height: 1.6,
              ),
            )
          else
            for (var i = 0; i < paragraphs.length; i++) ...[
              Text(
                paragraphs[i],
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleSmall,
                  color: c.foreground,
                  fontWeight: FontWeight.w500,
                  height: 1.6,
                ),
              ),
              if (i < paragraphs.length - 1)
                const SizedBox(height: AppSpacing.lg),
            ],
          if (translation != null && translation.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              translation,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                fontWeight: FontWeight.w500,
                fontStyle: FontStyle.italic,
                color: c.mutedForeground,
                height: 1.5,
              ),
            ),
          ],
          if (content.notes != null && content.notes!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xl),
            Text(
              content.notes!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
