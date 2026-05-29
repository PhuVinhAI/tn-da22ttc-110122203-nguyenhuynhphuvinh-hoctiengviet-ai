import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../utils/password_policy.dart';

/// Live password feedback shown under the password field on the register and
/// reset-password screens: a strength progress bar plus a per-rule checklist.
///
/// Stateless — the parent owns the current password value and rebuilds this
/// widget on every keystroke.
class PasswordRequirements extends StatelessWidget {
  const PasswordRequirements({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();

    final c = AppTheme.colors(context);
    final s = S.of(context);
    final checks = PasswordPolicy.evaluate(password);
    final strength = PasswordPolicy.strength(password);

    final (Color strengthColor, String strengthLabel, int filledSegments) =
        switch (strength) {
      PasswordStrength.strong => (c.success, s.passwordStrengthStrong, 3),
      PasswordStrength.medium => (c.warning, s.passwordStrengthMedium, 2),
      _ => (c.error, s.passwordStrengthWeak, 1),
    };

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Strength bar + label ──────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: Row(
                  children: List.generate(3, (i) {
                    final filled = i < filledSegments;
                    return Expanded(
                      child: Container(
                        height: 6,
                        margin: EdgeInsets.only(right: i < 2 ? AppSpacing.xs : 0),
                        decoration: BoxDecoration(
                          color: filled ? strengthColor : c.border,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                strengthLabel,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.caption,
                  fontWeight: FontWeight.w600,
                  color: strengthColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          // ── Requirement checklist ─────────────────────────────────────
          _Rule(ok: checks.minLength, label: s.passwordRuleMinLength),
          _Rule(ok: checks.lowercase, label: s.passwordRuleLowercase),
          _Rule(ok: checks.uppercase, label: s.passwordRuleUppercase),
          _Rule(ok: checks.number, label: s.passwordRuleNumber),
          _Rule(ok: checks.special, label: s.passwordRuleSpecial),
          _Rule(ok: checks.noSpace, label: s.passwordRuleNoSpace),
          _Rule(ok: checks.notCommon, label: s.passwordRuleNotCommon),
        ],
      ),
    );
  }
}

class _Rule extends StatelessWidget {
  const _Rule({required this.ok, required this.label});

  final bool ok;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            ok ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
            size: 16,
            color: ok ? c.success : c.mutedForeground,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: ok ? c.foreground : c.mutedForeground,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
