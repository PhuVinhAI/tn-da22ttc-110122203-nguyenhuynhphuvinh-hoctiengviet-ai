import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';

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
        if (mounted) {
          AppToast.show(context, message: S.of(context).googleTokenFailed, type: AppToastType.error);
        }
        return;
      }
      widget.onSuccess(idToken);
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled ||
          e.code == GoogleSignInExceptionCode.interrupted) {
      } else if (mounted) {
        AppToast.show(context, message: S.of(context).googleSignInFailedDescParam(e.description ?? ''), type: AppToastType.error);
      }
    } catch (e) {
      if (mounted) {
        AppToast.show(context, message: S.of(context).googleSignInFailedParam(e.toString()), type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.enabled && !_isLoading;

    return AppButton(
      variant: AppButtonVariant.outline,
      isFullWidth: true,
      isLoading: _isLoading,
      onPressed: isEnabled ? _handleGoogleSignIn : null,
      icon: SvgPicture.asset(
        'assets/google_logo.svg',
        width: 20,
        height: 20,
      ),
      label: S.of(context).googleSignInButton,
    );
  }
}
