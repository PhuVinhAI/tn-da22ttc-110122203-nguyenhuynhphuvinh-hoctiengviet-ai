import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../app_theme.dart';
import '../../providers/bottom_sheet_provider.dart';

class AppBottomSheet {
  AppBottomSheet._();

  static Future<T?> show<T>(BuildContext context, {
    required WidgetBuilder builder,
    bool isScrollControlled = false,
    bool isDismissible = true,
    bool enableDrag = true,
  }) {
    // Capture the container reference before any async operations
    ProviderContainer? container;
    try {
      container = ProviderScope.containerOf(context);
      container.read(bottomSheetOpenProvider.notifier).setOpen(true);
    } catch (_) {
      // Context might not have access to ProviderScope in some edge cases
    }

    final future = showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final c = AppTheme.colors(context);
        return Container(
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppRadius.xl),
            ),
            border: Border.all(color: c.border, width: 1),
          ),
          child: builder(context),
        );
      },
    );

    // Mark bottom sheet as closed when it completes
    future.whenComplete(() {
      try {
        container?.read(bottomSheetOpenProvider.notifier).setOpen(false);
      } catch (_) {
        // Container might be disposed
      }
    });

    return future;
  }
}
