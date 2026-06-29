import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class BookmarkIconButton extends StatelessWidget {
  const BookmarkIconButton({
    super.key,
    required this.vocabularyId,
    required this.isBookmarked,
    required this.onToggle,
  });

  final String vocabularyId;
  final bool isBookmarked;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return IconButton(
      onPressed: () => onToggle(vocabularyId),
      icon: Icon(
        isBookmarked ? Icons.bookmark : Icons.bookmark_border,
        color: isBookmarked ? c.primary : c.mutedForeground,
      ),
    );
  }
}
