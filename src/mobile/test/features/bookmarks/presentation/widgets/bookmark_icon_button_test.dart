import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/bookmarks/presentation/widgets/bookmark_icon_button.dart';

void main() {
  group('BookmarkIconButton', () {
    testWidgets('shows outlined bookmark icon when not bookmarked', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: BookmarkIconButton(
              vocabularyId: 'v1',
              isBookmarked: false,
              onToggle: (_) {},
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.icon, Icons.bookmark_border);
    });

    testWidgets('shows filled bookmark icon when bookmarked', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: BookmarkIconButton(
              vocabularyId: 'v1',
              isBookmarked: true,
              onToggle: (_) {},
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.icon, Icons.bookmark);
    });

    testWidgets('calls onToggle with vocabularyId on tap', (tester) async {
      String? toggledId;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: BookmarkIconButton(
              vocabularyId: 'v1',
              isBookmarked: false,
              onToggle: (id) => toggledId = id,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(IconButton));
      expect(toggledId, 'v1');
    });
  });
}
