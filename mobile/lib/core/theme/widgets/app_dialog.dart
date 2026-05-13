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
  });

  final String? title;
  final Widget? titleWidget;
  final String? content;
  final Widget? contentWidget;
  final List<AppDialogAction>? actions;
  final Widget? actionsWidget;

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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (titleWidget != null || title != null)
              titleWidget ??
                  Text(
                    title!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.titleSmall,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                    ),
                  ),
            if (contentWidget != null || content != null) ...[
              const SizedBox(height: AppSpacing.md),
              contentWidget ??
                  Text(
                    content!,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      color: c.mutedForeground,
                      height: 1.5,
                    ),
                  ),
            ],
            if (actionsWidget != null || actions != null) ...[
              const SizedBox(height: AppSpacing.xl),
              actionsWidget ??
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: List.generate(actions!.length, (i) {
                      final action = actions![i];
                      return Padding(
                        padding: EdgeInsets.only(top: i > 0 ? AppSpacing.sm : 0),
                        child: action.isPrimary
                            ? AppButton(
                                label: action.label,
                                onPressed: action.onPressed,
                                variant: AppButtonVariant.primary,
                                isFullWidth: true,
                                fontSize: AppTypography.bodySmall,
                              )
                            : AppButton(
                                label: action.label,
                                onPressed: action.onPressed,
                                variant: AppButtonVariant.text,
                                isFullWidth: true,
                                fontSize: AppTypography.bodySmall,
                              ),
                      );
                    }),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

class AppDialogAction {
  const AppDialogAction({
    required this.label,
    required this.onPressed,
    this.isPrimary = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;
}
