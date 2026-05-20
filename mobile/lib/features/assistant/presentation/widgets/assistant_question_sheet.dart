import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../application/assistant_state_machine.dart';
import '../../data/screen_context_provider.dart';
import '../../domain/assistant_state.dart';
import 'assistant_full_screen.dart';

/// The Mid (Hỏi) bottom-sheet surface. Renders three phases driven by
/// [assistantStateMachineProvider]:
///
/// - **Compose** — textarea (≤ 5 lines) + Send.
/// - **Loading** — spinner + per-tool status text + Stop.
/// - **Reading** — markdown answer + Stop (streaming) or Soạn tiếp
///   (done). When `interrupted=true` an "Đã dừng" label is shown below
///   the partial answer.
///
/// A "Reset" affordance is always visible in the header so the learner
/// can drop the current Conversation and start a fresh one with the
/// now-current `screenContext`. A pre-token error transitions the sheet
/// into a recoverable error view with a "Thử lại" button.
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

  Future<void> _onSend() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final notifier = ref.read(assistantChatNotifierProvider);
    _controller.clear();
    await notifier.sendMessage(text);
  }

  @override
  Widget build(BuildContext context) {
    // When the state machine transitions back to Compose (via Soạn tiếp
    // or Reset) refocus the textarea so the learner can keep typing
    // without an extra tap.
    ref.listen(assistantStateMachineProvider, (prev, next) {
      if (next is AssistantMidCompose && prev is! AssistantMidCompose) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _focusNode.requestFocus();
        });
      }
      // Defensive: if anything transitions us to Collapsed (e.g.
      // programmatic flow) and the sheet is still mounted, dismiss it.
      if (prev is! AssistantCollapsed && next is AssistantCollapsed) {
        _dismissSheetIfCurrent();
      }
      // When entering Full, dismiss the sheet and navigate to the
      // full-screen chat view.
      if (prev is! AssistantFull && next is AssistantFull) {
        _dismissSheetIfCurrent();
        Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => const AssistantFullScreen(),
            fullscreenDialog: true,
          ),
        );
      }
    });

    final state = ref.watch(assistantStateMachineProvider);
    final c = AppTheme.colors(context);
    final mq = MediaQuery.of(context);
    final keyboardInset = mq.viewInsets.bottom;
    final maxSheetHeight = mq.size.height * 0.5;
    final displayName = ref.watch(
      currentScreenContextProvider.select((s) => s.displayName),
    );

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        (state is AssistantMidCompose
            ? (keyboardInset > 0
                ? (keyboardInset - 24).clamp(0.0, double.infinity)
                : AppSpacing.md)
            : keyboardInset + AppSpacing.md),
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxSheetHeight),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _DragHandle(color: c.border),
            _Header(displayName: displayName, state: state),
            const SizedBox(height: AppSpacing.sm),
            _Body(
              state: state,
              controller: _controller,
              focusNode: _focusNode,
              onSend: _onSend,
            ),
          ],
        ),
      ),
    );
  }

  void _dismissSheetIfCurrent() {
    final route = ModalRoute.of(context);
    if (!mounted || route?.isCurrent != true) return;
    Navigator.of(context).pop();
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle({required this.color});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 36,
        height: 4,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(AppRadius.full),
        ),
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.displayName, required this.state});

  final String displayName;
  final AssistantState state;

  bool get _resetVisible => state is! AssistantCollapsed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            'AI Assistant · $displayName',
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              fontWeight: FontWeight.w600,
              color: c.mutedForeground,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (_resetVisible)
          IconButton(
            icon: const Icon(Icons.open_in_full),
            color: c.mutedForeground,
            tooltip: 'Full screen',
            onPressed: () =>
                ref.read(assistantChatNotifierProvider).enterFull(),
          ),
        if (_resetVisible)
          IconButton(
            icon: const Icon(Icons.refresh),
            color: c.mutedForeground,
            tooltip: 'Reset conversation',
            onPressed: () => ref.read(assistantChatNotifierProvider).reset(),
          ),
        IconButton(
          icon: const Icon(Icons.remove),
          color: c.mutedForeground,
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ],
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({
    required this.state,
    required this.controller,
    required this.focusNode,
    required this.onSend,
  });

  final AssistantState state;
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return switch (state) {
      AssistantCollapsed() => const SizedBox.shrink(),
      AssistantFull() => const SizedBox.shrink(),
      AssistantMidCompose() => _ComposeBody(
        controller: controller,
        focusNode: focusNode,
        onSend: onSend,
      ),
      AssistantMidLoading(:final statusText) => _LoadingBody(
        statusText: statusText,
      ),
      AssistantMidReading(
        :final partial,
        :final streaming,
        :final interrupted,
        :final toolStatusText,
      ) =>
        _ReadingBody(
          partial: partial,
          streaming: streaming,
          interrupted: interrupted,
          toolStatusText: toolStatusText,
        ),
      AssistantMidError(:final message) => _ErrorBody(message: message),
    };
  }
}

class _ComposeBody extends StatelessWidget {
  const _ComposeBody({
    required this.controller,
    required this.focusNode,
    required this.onSend,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      decoration: BoxDecoration(
        color: c.muted.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.sm,
        top: AppSpacing.sm,
        bottom: AppSpacing.sm,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: controller,
            focusNode: focusNode,
            maxLines: 5,
            minLines: 1,
            textCapitalization: TextCapitalization.sentences,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: c.foreground,
            ),
            decoration: InputDecoration(
              hintText: 'Ask anything...',
              hintStyle: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
              filled: false,
              fillColor: Colors.transparent,
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: onSend,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: c.primary,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_upward_rounded,
                  color: c.primaryForeground,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingBody extends ConsumerWidget {
  const _LoadingBody({required this.statusText});

  final String statusText;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    return Container(
      decoration: BoxDecoration(
        color: c.muted.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.sm,
        top: AppSpacing.lg,
        bottom: AppSpacing.sm,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppSpinner(),
                const SizedBox(width: AppSpacing.md),
                Flexible(
                  child: Text(
                    statusText,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      color: c.mutedForeground,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () => ref.read(assistantChatNotifierProvider).stop(),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: c.error,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.stop_rounded,
                  color: c.errorForeground,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReadingBody extends ConsumerWidget {
  const _ReadingBody({
    required this.partial,
    required this.streaming,
    required this.interrupted,
    required this.toolStatusText,
  });

  final String partial;
  final bool streaming;
  final bool interrupted;
  final String? toolStatusText;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final mq = MediaQuery.of(context);
    // Cap the markdown body at ~75% of the screen height so the sheet
    // doesn't push the bottom buttons off-screen for long answers.
    final maxBodyHeight = mq.size.height * 0.3;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxBodyHeight),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                MarkdownBody(
                  data: partial.isEmpty ? '_(no response)_' : partial,
                  selectable: true,
                ),
              ],
            ),
          ),
        ),
        if (interrupted)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Text(
              'Stopped',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        const SizedBox(height: AppSpacing.md),
        if (streaming && toolStatusText != null)
          Row(
            children: [
              const AppSpinner(),
              const SizedBox(width: AppSpacing.md),
              Flexible(
                child: Text(
                  toolStatusText!,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.mutedForeground,
                  ),
                ),
              ),
            ],
          )
        else if (streaming)
          AppButton(
            onPressed: () => ref.read(assistantChatNotifierProvider).stop(),
            label: 'Stop',
            variant: AppButtonVariant.outline,
            isFullWidth: true,
          )
        else
          AppButton(
            onPressed: () =>
                ref.read(assistantChatNotifierProvider).composeAgain(),
            label: 'Compose again',
            isFullWidth: true,
          ),
      ],
    );
  }
}

class _ErrorBody extends ConsumerWidget {
  const _ErrorBody({required this.message});

  final String message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.error_outline, color: c.error),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  message,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.foreground,
                  ),
                ),
              ),
            ],
          ),
        ),
        AppButton(
          onPressed: () => ref.read(assistantChatNotifierProvider).retry(),
          label: 'Retry',
          isFullWidth: true,
        ),
      ],
    );
  }
}
