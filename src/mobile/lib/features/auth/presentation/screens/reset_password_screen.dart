import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../utils/password_policy.dart';
import '../widgets/auth_layout.dart';
import '../widgets/password_requirements.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({
    super.key,
    this.token,
    this.fromSettings = false,
  });

  final String? token;
  final bool fromSettings;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _isReset = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _password = '';

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.token == null) return;

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.resetPassword(
        token: widget.token!,
        newPassword: _passwordController.text,
      );
      setState(() => _isReset = true);
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (_) {
      if (mounted) {
        AppToast.show(context, message: S.of(context).unexpectedErrorMessage, type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);

    return AuthScaffold(
      title: s.authResetPassword,
      child: _isReset ? _buildSuccess(context, s) : _buildForm(context, s),
    );
  }

  Widget _buildSuccess(BuildContext context, S s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AuthHeader(
          icon: Icons.check_rounded,
          iconColor: AppTheme.colors(context).success,
          badgeSize: 72,
          title: s.authPasswordResetSuccess,
          subtitle: widget.fromSettings
              ? s.authPasswordChangedSuccess
              : s.authPasswordResetSuccessMessage,
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
          variant: AppButtonVariant.primary,
          isFullWidth: true,
          onPressed: () => context.go(
            widget.fromSettings ? '/settings' : '/login',
          ),
          label: widget.fromSettings ? s.authBackToSettings : s.authSignIn,
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context, S s) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AuthHeader(
            icon: Icons.lock_outlined,
            title: s.authSetNewPassword,
            subtitle: s.authChooseStrongPassword,
          ),
          const SizedBox(height: AppSpacing.xl),
          // ── New password ──────────────────────────────────────────
          AppInput(
            controller: _passwordController,
            obscureText: _obscurePassword,
            label: s.authNewPassword,
            prefixIcon: const Icon(Icons.lock_outlined),
            onChanged: (value) => setState(() => _password = value),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
              onPressed: () {
                setState(() => _obscurePassword = !_obscurePassword);
              },
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return s.authPasswordRequired;
              }
              if (!PasswordPolicy.isStrong(value)) {
                return s.passwordRequirementsNotMet;
              }
              return null;
            },
          ),
          PasswordRequirements(password: _password),
          const SizedBox(height: AppSpacing.md),
          // ── Confirm password ──────────────────────────────────────
          AppInput(
            controller: _confirmPasswordController,
            obscureText: _obscureConfirmPassword,
            label: s.authConfirmPassword,
            prefixIcon: const Icon(Icons.lock_outlined),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirmPassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
              ),
              onPressed: () {
                setState(() =>
                    _obscureConfirmPassword = !_obscureConfirmPassword);
              },
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return s.authConfirmPasswordRequired;
              }
              if (value != _passwordController.text) {
                return s.authPasswordMismatch;
              }
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(
            variant: AppButtonVariant.primary,
            isFullWidth: true,
            onPressed: _isLoading ? null : _handleReset,
            isLoading: _isLoading,
            label: s.authResetPassword,
          ),
          if (!widget.fromSettings) ...[
            const SizedBox(height: AppSpacing.sm),
            AppButton(
              variant: AppButtonVariant.text,
              isFullWidth: true,
              onPressed: () => context.go('/login'),
              label: s.authBackToSignIn,
            ),
          ],
        ],
      ),
    );
  }
}
