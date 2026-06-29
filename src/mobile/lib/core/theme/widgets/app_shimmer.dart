import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../app_theme.dart';

class AppShimmer extends StatelessWidget {
  const AppShimmer({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Shimmer.fromColors(
      baseColor: c.muted,
      highlightColor: c.card,
      child: child,
    );
  }
}

class AppShimmerBox extends StatelessWidget {
  const AppShimmerBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.shape = BoxShape.rectangle,
  });

  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxShape shape;

  @override
  Widget build(BuildContext context) {
    return AppShimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: shape == BoxShape.circle ? null : borderRadius,
          shape: shape,
        ),
      ),
    );
  }
}

/// Left-aligned text lines for AI / chat typing placeholders.
class AppShimmerTextBlock extends StatelessWidget {
  const AppShimmerTextBlock({super.key, this.lineWidths = const [240, 280, 150]});

  final List<double> lineWidths;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < lineWidths.length; i++) ...[
          if (i > 0) const SizedBox(height: AppSpacing.sm),
          AppShimmerBox(
            width: lineWidths[i],
            height: 14,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        ],
      ],
    );
  }
}
