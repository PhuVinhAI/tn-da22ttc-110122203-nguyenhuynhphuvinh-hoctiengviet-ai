import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app_theme.dart';

enum AppToastType { info, success, warning, error }

class AppToast {
  AppToast._();

  static void show(BuildContext context, {
    required String message,
    AppToastType type = AppToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final c = AppTheme.colors(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    scaffoldMessenger.hideCurrentSnackBar();
    scaffoldMessenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(_icon(type), color: _fgColor(c, type), size: 20),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                message,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: _fgColor(c, type),
                ),
              ),
            ),
          ],
        ),
        backgroundColor: _bgColor(c, type),
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        elevation: 0,
      ),
    );
  }

  static Color _bgColor(AppColors c, AppToastType type) {
    return switch (type) {
      AppToastType.info => c.info,
      AppToastType.success => c.success,
      AppToastType.warning => c.warning,
      AppToastType.error => c.error,
    };
  }

  static Color _fgColor(AppColors c, AppToastType type) {
    return switch (type) {
      AppToastType.info => c.infoForeground,
      AppToastType.success => c.successForeground,
      AppToastType.warning => c.warningForeground,
      AppToastType.error => c.errorForeground,
    };
  }

  static IconData _icon(AppToastType type) {
    return switch (type) {
      AppToastType.info => Icons.info_outline,
      AppToastType.success => Icons.check_circle_outline,
      AppToastType.warning => Icons.warning_amber,
      AppToastType.error => Icons.error_outline,
    };
  }
}
