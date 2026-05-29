import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../widgets/auth_action_skeleton.dart';
import '../widgets/auth_layout.dart';
import '../widgets/otp_code_input.dart';

class EmailVerificationScreen extends ConsumerStatefulWidget {
  const EmailVerificationScreen({super.key, this.email});

  final String? email;

  @override
  ConsumerState<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState
    extends ConsumerState<EmailVerificationScreen> {
  String _code = '';
  bool _isVerifying = false;
  bool _isVerified = false;
  String? _errorMessage;

  Future<void> _verifyCode() async {
    if (_code.length != 6) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(authRepositoryProvider);
      final response = await repository.verifyEmailCode(
        email: widget.email ?? '',
        code: _code,
      );

      final storage = ref.read(secureStorageProvider);
      await storage.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );

      ref.read(authStateProvider.notifier).notifyAuthenticated(true);
      setState(() => _isVerified = true);
    } on AppException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = S.of(context).authVerificationFailed);
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendCode() async {
    if (widget.email == null) return;

    try {
      final dio = ref.read(dioProvider);
      await dio.post('/auth/resend-verification', data: {'email': widget.email});
      if (mounted) {
        AppToast.show(context, message: S.of(context).authVerificationCodeSent, type: AppToastType.success);
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
      title: s.authEmailVerification,
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

    if (_isVerified) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AuthHeader(
            icon: Icons.check_rounded,
            iconColor: AppTheme.colors(context).success,
            badgeSize: 72,
            title: s.authEmailVerified,
            subtitle: s.authEmailVerifiedSuccess,
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(
            variant: AppButtonVariant.primary,
            isFullWidth: true,
            onPressed: () => context.go('/'),
            label: s.authContinueHome,
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AuthHeader(
          icon: Icons.mark_email_read_outlined,
          title: s.authCheckEmail,
          subtitle: '${s.authResetCodeDescription}\n${widget.email ?? 'your email'}',
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
          label: s.authVerify,
        ),
        const SizedBox(height: AppSpacing.sm),
        AuthResendRow(
          prompt: s.authDidNotReceiveCode,
          actionLabel: s.authResend,
          onResend: _resendCode,
        ),
      ],
    );
  }
}
