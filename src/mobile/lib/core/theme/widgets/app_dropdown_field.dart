import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';
import 'app_bottom_sheet.dart';

class AppDropdownField<T> extends StatelessWidget {
  const AppDropdownField({
    super.key,
    required this.label,
    required this.items,
    required this.onChanged,
    this.value,
    this.hint,
    this.prefixIcon,
    this.itemLabelBuilder,
    this.validator,
  });

  final String label;
  final List<T> items;
  final T? value;
  final String? hint;
  final Widget? prefixIcon;
  final ValueChanged<T?> onChanged;
  final String Function(T)? itemLabelBuilder;
  final String? Function(T?)? validator;

  String _getLabel(T item) {
    if (itemLabelBuilder != null) return itemLabelBuilder!(item);
    return item.toString();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final errorText = validator?.call(value);
    final hasError = errorText != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: () => _showPicker(context),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: label,
              hintText: hint,
              prefixIcon: prefixIcon,
              suffixIcon: Icon(
                Icons.keyboard_arrow_down_rounded,
                color: c.mutedForeground,
              ),
              errorText: hasError ? errorText : null,
            ),
            child: Text(
              value != null ? _getLabel(value as T) : '',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: value != null ? c.foreground : c.mutedForeground,
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showPicker(BuildContext context) {
    final c = AppTheme.colors(context);

    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.lg,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleSmall,
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Icon(Icons.close, size: 20, color: c.mutedForeground),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: c.border),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.4,
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: items.length,
                  itemBuilder: (ctx, index) {
                    final item = items[index];
                    final isSelected = item == value;

                    return GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        Navigator.pop(ctx);
                        onChanged(item);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                          vertical: AppSpacing.md,
                        ),
                        color: isSelected
                            ? c.primary.withValues(alpha: 0.06)
                            : Colors.transparent,
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                _getLabel(item),
                                style: GoogleFonts.inter(
                                  fontSize: AppTypography.bodyMedium,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  color: isSelected
                                      ? c.primary
                                      : c.foreground,
                                ),
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_rounded,
                                size: 20,
                                color: c.primary,
                              ),
                          ],
                        ),
                      ),
                    );
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
