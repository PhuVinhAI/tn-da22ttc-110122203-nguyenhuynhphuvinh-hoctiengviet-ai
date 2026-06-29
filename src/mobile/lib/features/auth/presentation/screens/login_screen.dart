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
import '../widgets/auth_layout.dart';
import '../widgets/google_sign_in_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      final response = await repository.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

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
    } on EmailNotVerifiedException catch (e) {
      if (mounted) {
        context.push('/verify-email?email=${Uri.encodeComponent(e.email)}');
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

  Future<void> _handleGoogleLogin(String idToken) async {
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
      showAppBar: false,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Branding ──────────────────────────────────────────────
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.xl),
                child: Image.asset(
                  'assets/branding/app_icon.png',
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Semantics(
              label: s.authAppTitleSemantics,
              header: true,
              child: Text(
                s.appName,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.headlineMedium,
                  fontWeight: FontWeight.w700,
                  color: c.foreground,
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              s.authAppTagline,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
                height: 1.4,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            // ── Email ─────────────────────────────────────────────────
            Semantics(
              label: s.authEmailInputSemantics,
              textField: true,
              child: AppInput(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                label: s.emailLabel,
                prefixIcon: const Icon(Icons.email_outlined),
                hint: s.authEmailHint,
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
            ),
            const SizedBox(height: AppSpacing.md),
            // ── Password ──────────────────────────────────────────────
            Semantics(
              label: s.authPasswordInputSemantics,
              textField: true,
              child: AppInput(
                controller: _passwordController,
                obscureText: _obscurePassword,
                label: s.passwordLabel,
                prefixIcon: const Icon(Icons.lock_outlined),
                suffixIcon: Semantics(
                  label: _obscurePassword
                      ? s.authShowPassword
                      : s.authHidePassword,
                  button: true,
                  child: IconButton(
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
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return s.authPasswordRequired;
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            // ── Forgot password ───────────────────────────────────────
            Align(
              alignment: Alignment.centerRight,
              child: Semantics(
                label: s.authForgotPasswordSemantics,
                button: true,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.xs,
                      vertical: AppSpacing.xs,
                    ),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    s.authForgotPassword,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      fontWeight: FontWeight.w600,
                      color: c.primary,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            // ── Actions ───────────────────────────────────────────────
            Semantics(
              label: s.authSignInSemantics,
              button: true,
              enabled: !_isLoading,
              child: AppButton(
                variant: AppButtonVariant.primary,
                isFullWidth: true,
                onPressed: _isLoading ? null : _handleLogin,
                isLoading: _isLoading,
                label: s.authSignIn,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Semantics(
              label: s.authCreateAccountSemantics,
              button: true,
              child: AppButton(
                variant: AppButtonVariant.outline,
                isFullWidth: true,
                onPressed: () => context.push('/register'),
                label: s.authCreateAccount,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            // ── Divider ───────────────────────────────────────────────
            AuthOrDivider(label: s.authOr),
            const SizedBox(height: AppSpacing.xl),
            // ── Google ────────────────────────────────────────────────
            Semantics(
              label: s.authGoogleSignInSemantics,
              button: true,
              enabled: !_isLoading,
              child: GoogleSignInButton(
                enabled: !_isLoading,
                onSuccess: _handleGoogleLogin,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
