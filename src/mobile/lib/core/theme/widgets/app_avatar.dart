import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    this.radius = 24,
    this.backgroundColor,
    this.foregroundColor,
    this.backgroundImage,
    this.child,
    this.border = false,
  });

  final double radius;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final ImageProvider? backgroundImage;
  final Widget? child;
  final bool border;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final bgColor = backgroundColor ?? c.muted;
    final fgColor = foregroundColor ?? c.foreground;

    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        color: backgroundImage != null ? null : bgColor,
        borderRadius: BorderRadius.circular(radius),
        border: border ? Border.all(color: c.border, width: 1) : null,
        image: backgroundImage != null
            ? DecorationImage(image: backgroundImage!, fit: BoxFit.cover)
            : null,
      ),
      child: child != null
          ? Center(
              child: IconTheme(
                data: IconThemeData(color: fgColor, size: radius),
                child: child!,
              ),
            )
          : null,
    );
  }
}
