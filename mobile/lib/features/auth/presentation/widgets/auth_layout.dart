import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';

/// Centered, scrollable shell shared by every auth screen. Keeps a single
/// source of truth for page padding, vertical centring and the max content
/// width so all auth pages line up with the profile / settings language.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.child,
    this.title,
    this.showAppBar = true,
  });

  /// Column of content (already laid out with `CrossAxisAlignment.stretch`).
  final Widget child;

  /// App bar title. When null the app bar shows no title.
  final String? title;

  /// Login is the root route and has no app bar; everything else does.
  final bool showAppBar;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showAppBar
          ? AppAppBar(title: title != null ? Text(title!) : null)
          : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.xl,
              vertical: AppSpacing.xl,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

/// Tinted icon badge + title + optional subtitle, centred. Pass [icon] for the
/// default rounded badge, or [leading] to supply a custom mark (e.g. the app
/// logo on the login screen).
class AuthHeader extends StatelessWidget {
  const AuthHeader({
    super.key,
    required this.title,
    this.icon,
    this.leading,
    this.iconColor,
    this.subtitle,
    this.badgeSize = 64,
    this.titleSize = AppTypography.titleLarge,
  });

  final String title;
  final IconData? icon;
  final Widget? leading;
  final Color? iconColor;
  final String? subtitle;
  final double badgeSize;
  final double titleSize;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final accent = iconColor ?? c.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: leading ??
              Container(
                width: badgeSize,
                height: badgeSize,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(icon, size: badgeSize * 0.46, color: accent),
              ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          title,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: titleSize,
            fontWeight: FontWeight.w700,
            color: c.foreground,
            height: 1.2,
            letterSpacing: -0.3,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            subtitle!,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: c.mutedForeground,
              height: 1.5,
            ),
          ),
        ],
      ],
    );
  }
}

/// Centred error message shown under an OTP field.
class AuthErrorText extends StatelessWidget {
  const AuthErrorText({super.key, required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Text(
      message,
      textAlign: TextAlign.center,
      style: GoogleFonts.inter(
        fontSize: AppTypography.bodySmall,
        fontWeight: FontWeight.w500,
        color: AppTheme.colors(context).error,
      ),
    );
  }
}

/// "Didn't receive a code? Resend" row shared by the OTP screens.
class AuthResendRow extends StatelessWidget {
  const AuthResendRow({
    super.key,
    required this.prompt,
    required this.actionLabel,
    required this.onResend,
  });

  final String prompt;
  final String actionLabel;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          prompt,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            color: AppTheme.colors(context).mutedForeground,
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        AppButton(
          variant: AppButtonVariant.text,
          onPressed: onResend,
          label: actionLabel,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xs,
            vertical: AppSpacing.xs,
          ),
        ),
      ],
    );
  }
}

/// Horizontal rule with a centred label ("or"), used between the primary
/// auth actions and the social sign-in option.
class AuthOrDivider extends StatelessWidget {
  const AuthOrDivider({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Row(
      children: [
        const Expanded(child: AppDivider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w600,
              color: c.mutedForeground,
            ),
          ),
        ),
        const Expanded(child: AppDivider()),
      ],
    );
  }
}
