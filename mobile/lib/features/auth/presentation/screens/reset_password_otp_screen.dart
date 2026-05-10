import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/providers.dart';

class ResetPasswordOtpScreen extends ConsumerStatefulWidget {
  const ResetPasswordOtpScreen({super.key, required this.email});

  final String email;

  @override
  ConsumerState<ResetPasswordOtpScreen> createState() =>
      _ResetPasswordOtpScreenState();
}

class _ResetPasswordOtpScreenState
    extends ConsumerState<ResetPasswordOtpScreen> {
  final List<TextEditingController> _codeControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isVerifying = false;
  String? _errorMessage;

  @override
  void dispose() {
    for (final c in _codeControllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _code => _codeControllers.map((c) => c.text).join();

  Future<void> _verifyCode() async {
    final code = _code;
    if (code.length != 6) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final repository = ref.read(authRepositoryProvider);
      final response = await repository.verifyResetCode(
        email: widget.email,
        code: code,
      );

      if (mounted) {
        context.push('/reset-password?token=${response.resetToken}');
      }
    } on AppException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Verification failed');
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendCode() async {
    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.forgotPassword(email: widget.email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('A new reset code has been sent'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to resend code'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reset Password'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isVerifying) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                const Text('Verifying code...'),
              ] else ...[
                const Icon(
                  Icons.lock_reset_outlined,
                  size: 64,
                ),
                const SizedBox(height: 24),
                Text(
                  'Enter reset code',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'We sent a 6-digit code to ${widget.email}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(6, (index) {
                    return Container(
                      width: 48,
                      height: 56,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      child: TextField(
                        controller: _codeControllers[index],
                        focusNode: _focusNodes[index],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        maxLength: 1,
                        style: const TextStyle(
                            fontSize: 24, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          counterText: '',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onChanged: (value) {
                          if (value.isNotEmpty && index < 5) {
                            _focusNodes[index + 1].requestFocus();
                          }
                          if (value.isEmpty && index > 0) {
                            _focusNodes[index - 1].requestFocus();
                          }
                          if (_code.length == 6) {
                            _verifyCode();
                          }
                        },
                      ),
                    );
                  }),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _code.length == 6 ? _verifyCode : null,
                  child: const Text('Verify'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: _resendCode,
                  child: const Text('Resend code'),
                ),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Back to Sign In'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
