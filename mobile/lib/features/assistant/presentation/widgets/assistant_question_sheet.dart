import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/screen_context_provider.dart';

/// Slice #03 surface: the empty Compose phase of the Mid (Hỏi) state — a
/// textarea (≤ 5 lines) plus a Send button that currently no-ops. The
/// Loading + Read phases and SSE wiring land in slice #04.
class AssistantQuestionSheet extends ConsumerStatefulWidget {
  const AssistantQuestionSheet({super.key});

  @override
  ConsumerState<AssistantQuestionSheet> createState() =>
      _AssistantQuestionSheetState();
}

class _AssistantQuestionSheetState
    extends ConsumerState<AssistantQuestionSheet> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSend() {
    final text = _controller.text.trim();
    // Slice #03 stops at Compose. Real send (creates Conversation, opens
    // SSE, etc.) lands in slice #04 — see PRD §"Streaming protocol".
    debugPrint(
      'TODO[#04]: AssistantQuestionSheet.send tapped — text="$text"',
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final mq = MediaQuery.of(context);
    final keyboardInset = mq.viewInsets.bottom;
    final displayName = ref.watch(
      currentScreenContextProvider.select((s) => s.displayName),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: keyboardInset),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.sm,
            AppSpacing.lg,
            AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpacing.md),
                  decoration: BoxDecoration(
                    color: c.border,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Trợ lý AI · $displayName',
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        fontWeight: FontWeight.w600,
                        color: c.mutedForeground,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove),
                    color: c.mutedForeground,
                    tooltip: 'Đóng',
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              AppInput(
                controller: _controller,
                focusNode: _focusNode,
                hint: 'Hỏi gì đi nào?',
                maxLines: 5,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: AppSpacing.md),
              AppButton(
                onPressed: _onSend,
                label: 'Gửi',
                isFullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
