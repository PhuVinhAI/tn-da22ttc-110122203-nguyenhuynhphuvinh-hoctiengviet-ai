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
import '../utils/password_policy.dart';
import '../widgets/auth_layout.dart';
import '../widgets/google_sign_in_button.dart';
import '../widgets/password_requirements.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _password = '';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        fullName: _nameController.text.trim(),
      );

      if (mounted) {
        context.push('/verify-email?email=${Uri.encodeComponent(_emailController.text.trim())}');
      }
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: S.of(context).unexpectedErrorMessage, type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleRegister(String idToken) async {
    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      final response = await repository.loginWithGoogle(idToken: idToken);

      final storage = ref.read(secureStorageProvider);
      await storage.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );

      if (response.user.onboardingCompleted) {
        ref.read(onboardingCompletedProvider.notifier).markCompleted();
      } else {
        ref.read(onboardingCompletedProvider.notifier).reset();
      }

      ref.read(authStateProvider.notifier).notifyAuthenticated(true);
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: S.of(context).unexpectedErrorMessage, type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final s = S.of(context);

    return AuthScaffold(
      title: s.authCreateAccount,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AuthHeader(
              icon: Icons.person_add_outlined,
              title: s.registerTitle,
              subtitle: s.registerSubtitle,
            ),
            const SizedBox(height: AppSpacing.xl),
            // ── Full name ─────────────────────────────────────────────
            AppInput(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              label: s.nameLabel,
              prefixIcon: const Icon(Icons.person_outlined),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return s.nameHint;
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            // ── Email ─────────────────────────────────────────────────
            AppInput(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              label: s.emailLabel,
              prefixIcon: const Icon(Icons.email_outlined),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return s.authEmailRequired;
                }
                if (!value.contains('@')) {
                  return s.authEmailInvalid;
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),
            // ── Password ──────────────────────────────────────────────
            AppInput(
              controller: _passwordController,
              obscureText: _obscurePassword,
              label: s.passwordLabel,
              prefixIcon: const Icon(Icons.lock_outlined),
              onChanged: (value) => setState(() => _password = value),
              suffixIcon: IconButton(
                padding: const EdgeInsets.all(AppSpacing.md),
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
              label: s.confirmPasswordLabel,
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                padding: const EdgeInsets.all(AppSpacing.md),
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
            // ── Actions ───────────────────────────────────────────────
            AppButton(
              variant: AppButtonVariant.primary,
              isFullWidth: true,
              onPressed: _isLoading ? null : _handleRegister,
              isLoading: _isLoading,
              label: s.authCreateAccount,
            ),
            const SizedBox(height: AppSpacing.xl),
            AuthOrDivider(label: s.authOr),
            const SizedBox(height: AppSpacing.xl),
            GoogleSignInButton(
              enabled: !_isLoading,
              onSuccess: _handleGoogleRegister,
            ),
            const SizedBox(height: AppSpacing.xl),
            // ── Already have an account ───────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  s.authAlreadyHaveAccount,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                AppButton(
                  variant: AppButtonVariant.text,
                  onPressed: () => context.pop(),
                  label: s.authSignIn,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: AppSpacing.xs,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
