import 'package:flutter/material.dart';
import '../app_theme.dart';

enum AppCardVariant { filled, outlined, muted }

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    this.margin,
    this.variant = AppCardVariant.outlined,
    this.color,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.clipBehavior,
  });

  final Widget? child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final AppCardVariant variant;
  final Color? color;
  final Color? borderColor;
  final double? borderRadius;
  final VoidCallback? onTap;
  final Clip? clipBehavior;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bgColor = color ?? switch (variant) {
      AppCardVariant.filled => c.card,
      AppCardVariant.outlined => c.card,
      AppCardVariant.muted => c.muted,
    };
    final bdColor = borderColor ?? switch (variant) {
      AppCardVariant.filled => Colors.transparent,
      AppCardVariant.outlined => c.border,
      AppCardVariant.muted => Colors.transparent,
    };
    final radius = borderRadius ?? AppRadius.lg;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: margin ?? EdgeInsets.zero,
        padding: padding,
        clipBehavior: clipBehavior ?? Clip.none,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: bdColor, width: 1),
        ),
        child: child,
      ),
    );
  }
}
