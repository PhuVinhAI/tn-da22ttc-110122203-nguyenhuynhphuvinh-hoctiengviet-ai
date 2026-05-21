import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_theme.dart';

/// Multiline chat composer: send action sits inline on a single line and
/// moves below the field once the text wraps to two or more lines.
class AppChatComposeField extends StatefulWidget {
  const AppChatComposeField({
    super.key,
    required this.controller,
    this.focusNode,
    required this.hintText,
    this.enabled = true,
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
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
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
    super.dispose();
  }

  void _onTextChanged() => setState(() {});

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
    const rowReserved =
        AppChatComposeField._buttonSize + AppChatComposeField._actionGap;
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

  Widget _buildTrailing(AppColors c) {
    final canTap = widget.trailingEnabled && widget.onSend != null;
    final bg = widget.trailingColor ??
        (widget.enabled ? c.primary : c.muted);
    final fg = widget.trailingIconColor ??
        (widget.enabled ? c.primaryForeground : c.mutedForeground);

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
            left: AppSpacing.lg,
            right: AppSpacing.sm,
            top: AppSpacing.sm,
            bottom: AppSpacing.sm,
          ),
          // Keep the TextField in a stable Row slot so toggling multiline
          // layout does not dispose it and dismiss the keyboard.
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(child: textField),
                  if (!multiline) ...[
                    const SizedBox(width: AppChatComposeField._actionGap),
                    trailing,
                  ],
                ],
              ),
              if (multiline)
                Align(
                  alignment: Alignment.centerRight,
                  child: trailing,
                ),
            ],
          ),
        );
      },
    );
  }
}
