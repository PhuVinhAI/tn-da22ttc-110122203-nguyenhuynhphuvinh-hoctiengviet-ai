import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

/// Six-digit OTP row with per-cell inputs. Pasting digits into any cell fills all cells.
class OtpCodeInput extends StatefulWidget {
  const OtpCodeInput({
    super.key,
    required this.onChanged,
    this.onCompleted,
    this.length = 6,
    this.autofocus = true,
  });

  final ValueChanged<String> onChanged;
  final ValueChanged<String>? onCompleted;
  final int length;
  final bool autofocus;

  @override
  State<OtpCodeInput> createState() => _OtpCodeInputState();
}

class _OtpCodeInputState extends State<OtpCodeInput> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  bool _isApplyingPaste = false;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusNodes.first.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  void _notify() {
    widget.onChanged(_code);
    if (_code.length == widget.length) {
      widget.onCompleted?.call(_code);
    }
  }

  void _applyPastedDigits(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return;

    _isApplyingPaste = true;
    for (var i = 0; i < widget.length; i++) {
      _controllers[i].text = i < digits.length ? digits[i] : '';
    }
    _isApplyingPaste = false;

    if (digits.length >= widget.length) {
      _focusNodes[widget.length - 1].unfocus();
    } else {
      _focusNodes[math.min(digits.length, widget.length - 1)].requestFocus();
    }
    _notify();
  }

  void _onChanged(String value, int index) {
    if (_isApplyingPaste) return;

    if (value.length > 1) {
      _applyPastedDigits(value);
      return;
    }

    if (value.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    _notify();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.length, (index) {
        return Flexible(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
            child: SizedBox(
              height: 56,
              child: Focus(
                onKeyEvent: (node, event) {
                  if (event is! KeyDownEvent ||
                      event.logicalKey != LogicalKeyboardKey.backspace) {
                    return KeyEventResult.ignored;
                  }
                  if (_controllers[index].text.isEmpty && index > 0) {
                    _controllers[index - 1].clear();
                    _focusNodes[index - 1].requestFocus();
                    _notify();
                    return KeyEventResult.handled;
                  }
                  return KeyEventResult.ignored;
                },
                child: TextField(
                  controller: _controllers[index],
                  focusNode: _focusNodes[index],
                  textAlign: TextAlign.center,
                  textAlignVertical: TextAlignVertical.center,
                  keyboardType: TextInputType.number,
                  autofillHints:
                      index == 0 ? const [AutofillHints.oneTimeCode] : null,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.titleMedium,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.0,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                    filled: true,
                    fillColor: c.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: BorderSide(color: c.inputBorder, width: 1),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: BorderSide(color: c.inputBorder, width: 1),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: BorderSide(color: c.primary, width: 1.5),
                    ),
                  ),
                  onChanged: (value) => _onChanged(value, index),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
