import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../widgets/auth_action_skeleton.dart';
import '../widgets/auth_layout.dart';
import '../widgets/otp_code_input.dart';

class ResetPasswordOtpScreen extends ConsumerStatefulWidget {
  const ResetPasswordOtpScreen({
    super.key,
    required this.email,
    this.fromSettings = false,
  });

  final String email;
  final bool fromSettings;

  @override
  ConsumerState<ResetPasswordOtpScreen> createState() =>
      _ResetPasswordOtpScreenState();
}

class _ResetPasswordOtpScreenState
    extends ConsumerState<ResetPasswordOtpScreen> {
  String _code = '';
  bool _isVerifying = false;
  String? _errorMessage;

  Future<void> _verifyCode() async {
    if (_code.length != 6) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(authRepositoryProvider);
      final response = await repository.verifyResetCode(
        email: widget.email,
        code: _code,
      );

      if (mounted) {
        final from = widget.fromSettings ? '&from=settings' : '';
        context.push('/reset-password?token=${response.resetToken}$from');
      }
    } on AppException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = S.of(context).authVerificationFailed);
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendCode() async {
    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.forgotPassword(email: widget.email);
      if (mounted) {
        AppToast.show(context, message: S.of(context).authResetCodeSent, type: AppToastType.success);
      }
    } catch (_) {
      if (mounted) {
        AppToast.show(context, message: S.of(context).authResendCodeFailed, type: AppToastType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);

    return AuthScaffold(
      title: s.authResetPassword,
      child: _buildBody(context, s),
    );
  }

  Widget _buildBody(BuildContext context, S s) {
    if (_isVerifying) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthActionSkeleton(),
          const SizedBox(height: AppSpacing.xl),
          Text(
            s.authVerifyingCode,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: AppTheme.colors(context).mutedForeground,
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AuthHeader(
          icon: Icons.lock_reset_outlined,
          title: s.authEnterResetCode,
          subtitle: '${s.authResetCodeDescription}\n${widget.email}',
        ),
        const SizedBox(height: AppSpacing.xl),
        AutofillGroup(
          child: OtpCodeInput(
            onChanged: (code) => setState(() => _code = code),
            onCompleted: (_) => _verifyCode(),
          ),
        ),
        if (_errorMessage != null) ...[
          const SizedBox(height: AppSpacing.md),
          AuthErrorText(message: _errorMessage!),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppButton(
          variant: AppButtonVariant.primary,
          isFullWidth: true,
          onPressed: _code.length == 6 ? _verifyCode : null,
          label: s.authVerifyCode,
        ),
        const SizedBox(height: AppSpacing.sm),
        AuthResendRow(
          prompt: s.authDidNotReceiveCode,
          actionLabel: s.authResend,
          onResend: _resendCode,
        ),
        if (!widget.fromSettings) ...[
          const SizedBox(height: AppSpacing.xs),
          AppButton(
            variant: AppButtonVariant.text,
            isFullWidth: true,
            onPressed: () => context.go('/login'),
            label: s.authBackToSignIn,
          ),
        ],
      ],
    );
  }
}
