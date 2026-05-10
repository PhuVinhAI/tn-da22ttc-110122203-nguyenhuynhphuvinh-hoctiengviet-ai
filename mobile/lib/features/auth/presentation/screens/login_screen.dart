import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/providers/auth_state_provider.dart';
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

      // Invalidate cached providers so they re-fetch for the new user
      ref.invalidate(userProfileProvider);
      ref.invalidate(exerciseStatsProvider);

      // Set onboarding state from server response
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('An unexpected error occurred. Please try again.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('An unexpected error occurred. Please try again.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Semantics(
                    label: 'LinVNix - Vietnamese Language Learning',
                    header: true,
                    child: Text(
                      'LinVNix',
                      style: theme.textTheme.displaySmall,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vietnamese Language Learning',
                    style: theme.textTheme.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),
                  Semantics(
                    label: 'Email input field',
                    textField: true,
                    child: TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email_outlined),
                        helperText: 'Enter your email address',
                      ),
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
                  const SizedBox(height: 16),
                  Semantics(
                    label: 'Password input field',
                    textField: true,
                    child: TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
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
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password is required';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Semantics(
                      label: 'Forgot password',
                      button: true,
                      child: TextButton(
                        onPressed: () => context.push('/forgot-password'),
                        child: const Text('Forgot password?'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Semantics(
                    label: 'Sign in to your account',
                    button: true,
                    enabled: !_isLoading,
                    child: FilledButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Sign In'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Semantics(
                    label: 'Create a new account',
                    button: true,
                    child: OutlinedButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Create Account'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'OR',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 24),
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
