import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/widgets/widgets.dart';

class SubmitButton extends StatelessWidget {
  const SubmitButton({
    super.key,
    required this.isEnabled,
    required this.isLoading,
    required this.onPressed,
  });

  final bool isEnabled;
  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return AppButton(
      label: S.of(context).submitLabel,
      onPressed: isEnabled ? onPressed : null,
      isLoading: isLoading,
      isFullWidth: true,
    );
  }
}
