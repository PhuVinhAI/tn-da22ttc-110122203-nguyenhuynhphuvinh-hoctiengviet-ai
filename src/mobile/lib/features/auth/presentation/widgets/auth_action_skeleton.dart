import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';

class AuthActionSkeleton extends StatelessWidget {
  const AuthActionSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const AppShimmerBox(
          width: 64,
          height: 64,
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.xl)),
        ),
        const SizedBox(height: AppSpacing.lg),
        const AppShimmerBox(
          width: 200,
          height: 14,
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.sm)),
        ),
        const SizedBox(height: AppSpacing.sm),
        const AppShimmerBox(
          width: 160,
          height: 12,
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.sm)),
        ),
      ],
    );
  }
}
