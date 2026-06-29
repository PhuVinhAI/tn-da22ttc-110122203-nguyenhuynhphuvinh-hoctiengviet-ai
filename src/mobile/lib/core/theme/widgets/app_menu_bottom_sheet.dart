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
    this.isSelected = false,
    this.sublabel,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? foregroundColor;
  final bool isSelected;
  final String? sublabel;
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
      isScrollControlled: true,
      builder: (ctx) {
        final c = AppTheme.colors(ctx);
        final maxHeight = MediaQuery.of(ctx).size.height * 0.5;

        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxHeight),
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
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    children: items
                        .map(
                          (item) => _MenuItemRow(
                            item: item,
                            onSelected: () {
                              Navigator.pop(ctx);
                              item.onTap();
                            },
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ),
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
    final color = item.isSelected
        ? c.primary
        : (item.foregroundColor ?? c.foreground);

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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    item.label,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      fontWeight: item.isSelected
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: color,
                    ),
                  ),
                  if (item.sublabel != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      item.sublabel!,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        fontWeight: FontWeight.w400,
                        color: c.mutedForeground,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (item.isSelected)
              Icon(Icons.check, size: 18, color: c.primary),
          ],
        ),
      ),
    );
  }
}
