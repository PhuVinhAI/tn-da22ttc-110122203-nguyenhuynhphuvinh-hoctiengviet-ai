import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:speech_to_text/speech_recognition_result.dart';

import '../../services/speech_recognizer.dart';
import '../app_theme.dart';

/// Multiline chat composer: send action sits inline on a single line and
/// moves below the field once the text wraps to two or more lines.
/// A mic button on the left lets users dictate text via speech-to-text.
class AppChatComposeField extends StatefulWidget {
  const AppChatComposeField({
    super.key,
    required this.controller,
    this.focusNode,
    required this.hintText,
    this.enabled = true,
    this.showMic = true,
    this.maxLines = 5,
    this.onSend,
    this.onSubmitted,
    this.trailingIcon = Icons.arrow_upward_rounded,
    this.trailingColor,
    this.trailingIconColor,
    this.trailingEnabled = true,
  });

  final TextEditingController controller;
  final FocusNode? focusNode;
  final String hintText;
  final bool enabled;
  final bool showMic;
  final int maxLines;
  final VoidCallback? onSend;
  final ValueChanged<String>? onSubmitted;
  final IconData trailingIcon;
  final Color? trailingColor;
  final Color? trailingIconColor;
  final bool trailingEnabled;

  static const double _buttonSize = 36;
  static const double _actionGap = AppSpacing.sm;

  @override
  State<AppChatComposeField> createState() => _AppChatComposeFieldState();
}

class _AppChatComposeFieldState extends State<AppChatComposeField> {
  final _recognizer = AppSpeechRecognizer.instance;
  StreamSubscription<String>? _statusSub;
  StreamSubscription<String>? _errorSub;
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
    _statusSub = _recognizer.statuses.listen(_handleStatus);
    _errorSub = _recognizer.errors.listen(_handleError);
  }

  @override
  void didUpdateWidget(covariant AppChatComposeField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onTextChanged);
      widget.controller.addListener(_onTextChanged);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    _statusSub?.cancel();
    _errorSub?.cancel();
    if (_isListening) {
      unawaited(_recognizer.stop());
    }
    super.dispose();
  }

  void _onTextChanged() => setState(() {});

  void _handleStatus(String status) {
    if (!mounted) return;
    final listening = status == 'listening';
    if (_isListening != listening) {
      setState(() => _isListening = listening);
    }
  }

  void _handleError(String _) {
    if (!mounted) return;
    setState(() => _isListening = false);
  }

  Future<void> _toggleVoice() async {
    if (!widget.enabled) return;

    if (_isListening) {
      await _recognizer.stop();
      return;
    }

    final ready = await _recognizer.ensureReady();
    if (!mounted || !ready) return;

    await _recognizer.listen(onResult: _handleSpeechResult);
    if (mounted) setState(() => _isListening = true);
  }

  void _handleSpeechResult(SpeechRecognitionResult result) {
    final transcript = result.recognizedWords.trim();
    if (!mounted || transcript.isEmpty) return;
    widget.controller.text = transcript;
    widget.controller.selection = TextSelection.collapsed(
      offset: transcript.length,
    );
  }

  TextStyle _textStyle(AppColors c) => GoogleFonts.inter(
        fontSize: AppTypography.bodyMedium,
        color: widget.enabled ? c.foreground : c.mutedForeground,
      );

  int _lineCount(String text, TextStyle style, double maxWidth) {
    if (text.isEmpty) return 1;
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: Directionality.of(context),
      maxLines: widget.maxLines,
    )..layout(maxWidth: maxWidth);
    return painter.computeLineMetrics().length;
  }

  bool _isMultiline(double containerWidth) {
    final text = widget.controller.text;
    if (text.contains('\n')) return true;

    const horizontalPadding = AppSpacing.lg + AppSpacing.sm;
    // Reserve space for both mic button and send button
    const rowReserved = AppChatComposeField._buttonSize * 2 +
        AppChatComposeField._actionGap * 2;
    final rowTextWidth = containerWidth - horizontalPadding - rowReserved;
    if (rowTextWidth <= 0) return false;

    return _lineCount(text, _textStyle(AppTheme.colors(context)), rowTextWidth) >=
        2;
  }

  InputDecoration _decoration(AppColors c) => InputDecoration(
        hintText: widget.hintText,
        hintStyle: GoogleFonts.inter(
          fontSize: AppTypography.bodyMedium,
          color: c.mutedForeground,
        ),
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        contentPadding: EdgeInsets.zero,
        isDense: true,
        filled: false,
        fillColor: Colors.transparent,
      );

  Widget _buildMicButton(AppColors c) {
    final active = _isListening;
    final canTap = widget.enabled;
    final bg = active ? c.primary : c.muted;
    final fg = active ? c.primaryForeground : c.mutedForeground;

    return GestureDetector(
      onTap: canTap ? _toggleVoice : null,
      child: Container(
        width: AppChatComposeField._buttonSize,
        height: AppChatComposeField._buttonSize,
        decoration: BoxDecoration(
          color: canTap ? bg : c.muted.withValues(alpha: 0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(
          active ? Icons.stop_rounded : Icons.mic_rounded,
          color: canTap ? fg : c.mutedForeground.withValues(alpha: 0.4),
          size: 18,
        ),
      ),
    );
  }

  Widget _buildTrailing(AppColors c) {
    final canTap = widget.trailingEnabled && widget.onSend != null;
    final bg = widget.trailingColor ??
        (widget.enabled && canTap ? c.primary : c.muted);
    final fg = widget.trailingIconColor ??
        (widget.enabled && canTap ? c.primaryForeground : c.mutedForeground);

    return GestureDetector(
      onTap: canTap ? widget.onSend : null,
      child: Container(
        width: AppChatComposeField._buttonSize,
        height: AppChatComposeField._buttonSize,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
        ),
        child: Icon(
          widget.trailingIcon,
          color: fg,
          size: 20,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final multiline = _isMultiline(constraints.maxWidth);
        final mic = widget.showMic ? _buildMicButton(c) : null;
        final trailing = _buildTrailing(c);
        final textField = TextField(
          key: const ValueKey('app_chat_compose_field'),
          controller: widget.controller,
          focusNode: widget.focusNode,
          enabled: widget.enabled,
          maxLines: widget.maxLines,
          minLines: 1,
          textCapitalization: TextCapitalization.sentences,
          style: _textStyle(c),
          decoration: _decoration(c),
          onSubmitted: widget.enabled ? widget.onSubmitted : null,
        );

        return Container(
          decoration: BoxDecoration(
            color: widget.enabled
                ? c.muted.withValues(alpha: 0.4)
                : c.muted.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          padding: const EdgeInsets.only(
            left: AppSpacing.sm,
            right: AppSpacing.sm,
            top: AppSpacing.sm,
            bottom: AppSpacing.sm,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  if (mic != null && !multiline) mic,
                  if (mic != null && !multiline)
                    const SizedBox(
                      width: AppChatComposeField._actionGap,
                    ),
                  // Extra left padding when mic is hidden so text aligns
                  // with the same inset as the right side (AppSpacing.lg).
                  if (mic == null || multiline)
                    const SizedBox(width: AppSpacing.lg - AppSpacing.sm),
                  Expanded(
                    key: const ValueKey('app_chat_compose_field_expanded'),
                    child: textField,
                  ),
                  if (!multiline) ...[
                    const SizedBox(width: AppChatComposeField._actionGap),
                    trailing,
                  ],
                ],
              ),
              if (multiline)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (mic != null) mic else const SizedBox.shrink(),
                    trailing,
                  ],
                ),
            ],
          ),
        );
      },
    );
  }
}
