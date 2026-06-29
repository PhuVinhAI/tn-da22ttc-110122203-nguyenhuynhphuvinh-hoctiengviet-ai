import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';
import 'app_button.dart';

class AppDialog extends StatelessWidget {
  const AppDialog({
    super.key,
    this.title,
    this.titleWidget,
    this.content,
    this.contentWidget,
    this.actions,
    this.actionsWidget,
    this.icon,
    this.iconColor,
  });

  final String? title;
  final Widget? titleWidget;
  final String? content;
  final Widget? contentWidget;
  final List<AppDialogAction>? actions;
  final Widget? actionsWidget;

  /// Optional badge icon shown above the title. When set, the title and
  /// textual content are centred.
  final IconData? icon;
  final Color? iconColor;

  static Future<T?> show<T>(BuildContext context, {
    required WidgetBuilder builder,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: builder,
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = iconColor ?? c.primary;
    final centered = icon != null;

    return Dialog(
      backgroundColor: c.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        side: BorderSide(color: c.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment:
              centered ? CrossAxisAlignment.center : CrossAxisAlignment.stretch,
          children: [
            if (icon != null) ...[
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: Icon(icon, color: accent, size: 28),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            if (titleWidget != null || title != null)
              titleWidget ??
                  Text(
                    title!,
                    textAlign: centered ? TextAlign.center : TextAlign.start,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleSmall,
                      fontWeight: FontWeight.w700,
                      color: c.foreground,
                      height: 1.3,
                    ),
                  ),
            if (contentWidget != null || content != null) ...[
              const SizedBox(height: AppSpacing.sm),
              contentWidget ??
                  Text(
                    content!,
                    textAlign: centered ? TextAlign.center : TextAlign.start,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      color: c.mutedForeground,
                      height: 1.5,
                    ),
                  ),
            ],
            if (actionsWidget != null || actions != null) ...[
              const SizedBox(height: AppSpacing.xl),
              actionsWidget ?? _Actions(actions: actions!),
            ],
          ],
        ),
      ),
    );
  }
}

class _Actions extends StatelessWidget {
  const _Actions({required this.actions});
  final List<AppDialogAction> actions;

  Widget _button(BuildContext context, AppDialogAction a) {
    if (a.isPrimary) {
      return AppButton(
        label: a.label,
        onPressed: a.onPressed,
        variant:
            a.isDestructive ? AppButtonVariant.danger : AppButtonVariant.primary,
        isFullWidth: true,
        fontSize: AppTypography.bodySmall,
      );
    }
    // Secondary / cancel: no fill, neutral foreground label (not primary).
    final c = AppTheme.colors(context);
    return AppButton(
      onPressed: a.onPressed,
      variant: AppButtonVariant.text,
      isFullWidth: true,
      child: Text(
        a.label,
        style: GoogleFonts.inter(
          fontSize: AppTypography.bodySmall,
          fontWeight: FontWeight.w600,
          color: c.foreground,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Stacked in list order: secondary (no fill) above, primary below.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < actions.length; i++)
          Padding(
            padding: EdgeInsets.only(top: i > 0 ? AppSpacing.sm : 0),
            child: _button(context, actions[i]),
          ),
      ],
    );
  }
}

class AppDialogAction {
  const AppDialogAction({
    required this.label,
    required this.onPressed,
    this.isPrimary = false,
    this.isDestructive = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;

  /// When true on the primary action, renders it with the danger variant.
  final bool isDestructive;
}
