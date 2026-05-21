import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_theme.dart';
import 'app_bottom_sheet.dart';

class AppMenuBottomSheetItem {
  const AppMenuBottomSheetItem({
    required this.label,
    required this.onTap,
    this.icon,
    this.foregroundColor,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? foregroundColor;
}

class AppMenuBottomSheet {
  AppMenuBottomSheet._();

  static Future<void> show(
    BuildContext context, {
    required String title,
    required List<AppMenuBottomSheetItem> items,
  }) {
    return AppBottomSheet.show(
      context,
      builder: (ctx) {
        final c = AppTheme.colors(ctx);

        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.lg,
                ),
                child: Center(
                  child: Text(
                    title,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleSmall,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                    ),
                  ),
                ),
              ),
              Divider(height: 1, color: c.border),
              ...items.map(
                (item) => _MenuItemRow(
                  item: item,
                  onSelected: () {
                    Navigator.pop(ctx);
                    item.onTap();
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MenuItemRow extends StatelessWidget {
  const _MenuItemRow({
    required this.item,
    required this.onSelected,
  });

  final AppMenuBottomSheetItem item;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final color = item.foregroundColor ?? c.foreground;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onSelected,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            if (item.icon != null) ...[
              Icon(item.icon, size: 20, color: color),
              const SizedBox(width: AppSpacing.md),
            ],
            Expanded(
              child: Text(
                item.label,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  fontWeight: FontWeight.w400,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
