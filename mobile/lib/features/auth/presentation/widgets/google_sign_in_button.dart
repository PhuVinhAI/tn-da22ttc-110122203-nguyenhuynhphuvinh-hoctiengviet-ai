import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/theme/widgets/widgets.dart';

class GoogleSignInButton extends StatefulWidget {
  const GoogleSignInButton({
    required this.onSuccess,
    super.key,
    this.enabled = true,
  });

  final void Function(String idToken) onSuccess;
  final bool enabled;

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    try {
      final account = await GoogleSignIn.instance.authenticate();
      final auth = account.authentication;
      final idToken = auth.idToken;
      if (idToken == null) {
        throw Exception('Failed to obtain Google ID token');
      }
      widget.onSuccess(idToken);
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled ||
          e.code == GoogleSignInExceptionCode.interrupted) {
      } else if (mounted) {
        AppToast.show(context, message: 'Google Sign-In failed: ${e.description}', type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: 'Google Sign-In failed: $e', type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.enabled && !_isLoading;

    return SizedBox(
      width: double.infinity,
      height: 44,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        elevation: 0,
        child: InkWell(
          onTap: isEnabled ? _handleGoogleSignIn : null,
          borderRadius: BorderRadius.circular(20),
          highlightColor: const Color(0xFFE8E8E8),
          splashColor: Colors.transparent,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isEnabled
                    ? const Color(0xFF747775)
                    : const Color(0xFFC7C7C7),
                width: 1,
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Opacity(
              opacity: _isLoading ? 0.5 : 1.0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SvgPicture.asset(
                    'assets/google_logo.svg',
                    width: 20,
                    height: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Sign in with Google',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 15,
                      color: isEnabled
                          ? const Color(0xFF1F1F1F)
                          : const Color(0xFF9E9E9E),
                      fontFamily: 'Roboto',
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
