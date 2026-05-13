import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../profile/data/profile_providers.dart';
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

      ref.invalidate(userProfileProvider);
      ref.invalidate(exerciseStatsProvider);

      if (response.user.onboardingCompleted) {
        ref.read(onboardingCompletedProvider.notifier).markCompleted();
      } else {
        ref.read(onboardingCompletedProvider.notifier).reset();
      }

      ref.read(authStateProvider.notifier).setAuthenticated(true);
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
        AppToast.show(context, message: 'An unexpected error occurred. Please try again.', type: AppToastType.error);
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

      ref.invalidate(userProfileProvider);
      ref.invalidate(exerciseStatsProvider);

      if (response.user.onboardingCompleted) {
        ref.read(onboardingCompletedProvider.notifier).markCompleted();
      } else {
        ref.read(onboardingCompletedProvider.notifier).reset();
      }

      ref.read(authStateProvider.notifier).setAuthenticated(true);
    } on AppException catch (e) {
      if (mounted) {
        AppToast.show(context, message: e.message, type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: 'An unexpected error occurred. Please try again.', type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = AppTheme.colors(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 28,
              vertical: AppSpacing.xl,
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Branding - centered
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: c.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                      ),
                      child: Icon(
                        Icons.translate_rounded,
                        size: 36,
                        color: c.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Semantics(
                    label: 'LinVNix - Vietnamese Language Learning',
                    header: true,
                    child: Text(
                      'LinVNix',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: -1,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Learn Vietnamese, your way',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxxl),
                // Email field
                Semantics(
                  label: 'Email input field',
                  textField: true,
                  child: AppInput(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    label: 'Email',
                    prefixIcon: const Icon(Icons.email_outlined),
                    hint: 'Enter your email address',
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Email is required';
                      }
                      if (!value.contains('@')) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                // Password field
                Semantics(
                  label: 'Password input field',
                  textField: true,
                  child: AppInput(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    label: 'Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: Semantics(
                      label: _obscurePassword
                          ? 'Show password'
                          : 'Hide password',
                      button: true,
                      child: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () {
                          setState(
                              () => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Password is required';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                // Forgot password - right-aligned
                Align(
                  alignment: Alignment.centerRight,
                  child: Semantics(
                    label: 'Forgot password',
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
                        'Forgot password?',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: c.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                // Sign in button
                Semantics(
                  label: 'Sign in to your account',
                  button: true,
                  enabled: !_isLoading,
                  child: AppButton(
                    variant: AppButtonVariant.primary,
                    isFullWidth: true,
                    onPressed: _isLoading ? null : _handleLogin,
                    isLoading: _isLoading,
                    label: 'Sign In',
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                // Create account button
                Semantics(
                  label: 'Create a new account',
                  button: true,
                  child: AppButton(
                    variant: AppButtonVariant.outline,
                    isFullWidth: true,
                    onPressed: () => context.push('/register'),
                    label: 'Create Account',
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                // Divider with "or"
                Row(
                  children: [
                    const Expanded(child: AppDivider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                      ),
                      child: Text(
                        'or',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: c.mutedForeground,
                          fontSize: AppTypography.caption,
                        ),
                      ),
                    ),
                    const Expanded(child: AppDivider()),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                // Google sign in
                Semantics(
                  label: 'Sign in with Google',
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
          ),
        ),
      ),
    );
  }
}
