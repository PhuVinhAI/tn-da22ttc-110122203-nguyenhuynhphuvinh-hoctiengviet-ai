import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../application/assistant_state_machine.dart';
import '../../data/screen_context_provider.dart';
import '../../domain/assistant_state.dart';
import 'assistant_full_screen.dart';
import 'proposal_card.dart';

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
      if (next is AssistantCollapsed) {
        Navigator.of(context).maybePop();
      }
      // When entering Full, dismiss the sheet and navigate to the
      // full-screen chat view.
      if (next is AssistantFull) {
        Navigator.of(context).maybePop();
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
      ),
    );
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
        if (_resetVisible)
          IconButton(
            icon: const Icon(Icons.open_in_full),
            color: c.mutedForeground,
            tooltip: 'Toàn màn hình',
            onPressed: () =>
                ref.read(assistantChatNotifierProvider).enterFull(),
          ),
        if (_resetVisible)
          IconButton(
            icon: const Icon(Icons.refresh),
            color: c.mutedForeground,
            tooltip: 'Reset hội thoại',
            onPressed: () =>
                ref.read(assistantChatNotifierProvider).reset(),
          ),
        IconButton(
          icon: const Icon(Icons.remove),
          color: c.mutedForeground,
          tooltip: 'Đóng',
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
      AssistantMidLoading(:final statusText) =>
        _LoadingBody(statusText: statusText),
      AssistantMidReading(
        :final partial,
        :final streaming,
        :final interrupted,
        :final proposals,
      ) =>
        _ReadingBody(
          partial: partial,
          streaming: streaming,
          interrupted: interrupted,
          proposals: proposals,
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
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
          controller: controller,
          focusNode: focusNode,
          hint: 'Hỏi gì đi nào?',
          maxLines: 5,
          textCapitalization: TextCapitalization.sentences,
        ),
        const SizedBox(height: AppSpacing.md),
        AppButton(
          onPressed: onSend,
          label: 'Gửi',
          isFullWidth: true,
        ),
      ],
    );
  }
}

class _LoadingBody extends ConsumerWidget {
  const _LoadingBody({required this.statusText});

  final String statusText;

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
            children: [
              const AppSpinner(),
              const SizedBox(width: AppSpacing.md),
              Expanded(
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
        AppButton(
          onPressed: () => ref.read(assistantChatNotifierProvider).stop(),
          label: 'Dừng',
          variant: AppButtonVariant.outline,
          isFullWidth: true,
        ),
      ],
    );
  }
}

class _ReadingBody extends ConsumerWidget {
  const _ReadingBody({
    required this.partial,
    required this.streaming,
    required this.interrupted,
    this.proposals = const [],
  });

  final String partial;
  final bool streaming;
  final bool interrupted;
  final List<ProposalState> proposals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final mq = MediaQuery.of(context);
    // Cap the markdown body at ~75% of the screen height so the sheet
    // doesn't push the bottom buttons off-screen for long answers.
    final maxBodyHeight = mq.size.height * 0.75;

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
                  data: partial.isEmpty ? '_(không có phản hồi)_' : partial,
                  selectable: true,
                ),
                for (var i = 0; i < proposals.length; i++)
                  ProposalCard(
                    proposal: proposals[i],
                    index: i,
                    onDecline: (idx) => ref
                        .read(assistantChatNotifierProvider)
                        .dismissProposal(idx),
                    onSuccess: (idx) => ref
                        .read(assistantChatNotifierProvider)
                        .updateProposal(
                          idx,
                          proposals[idx]
                              .copyWith(status: ProposalCardStatus.success),
                        ),
                  ),
              ],
            ),
          ),
        ),
        if (interrupted)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Text(
              'Đã dừng',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        const SizedBox(height: AppSpacing.md),
        if (streaming)
          AppButton(
            onPressed: () => ref.read(assistantChatNotifierProvider).stop(),
            label: 'Dừng',
            variant: AppButtonVariant.outline,
            isFullWidth: true,
          )
        else
          AppButton(
            onPressed: () =>
                ref.read(assistantChatNotifierProvider).composeAgain(),
            label: 'Soạn tiếp',
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
          label: 'Thử lại',
          isFullWidth: true,
        ),
      ],
    );
  }
}
