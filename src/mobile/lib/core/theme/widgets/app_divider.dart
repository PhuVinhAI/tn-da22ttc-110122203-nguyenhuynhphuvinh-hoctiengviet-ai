import 'package:flutter/material.dart';
import '../app_theme.dart';

class AppDivider extends StatelessWidget {
  const AppDivider({
    super.key,
    this.height,
    this.thickness,
    this.color,
    this.indent,
    this.endIndent,
  });

  final double? height;
  final double? thickness;
  final Color? color;
  final double? indent;
  final double? endIndent;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Divider(
      height: height ?? 1,
      thickness: thickness ?? 1,
      color: color ?? c.border,
      indent: indent,
      endIndent: endIndent,
    );
  }
}
