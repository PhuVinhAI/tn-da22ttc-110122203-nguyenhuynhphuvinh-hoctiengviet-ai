import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../application/assistant_state_machine.dart';
import '../../data/ai_api_provider.dart';
import '../../data/conversation_model.dart';
import '../../data/screen_context_provider.dart';
import '../../domain/assistant_state.dart';
import 'conversation_drawer.dart';
import 'proposal_card.dart';

/// Full-screen chat view. Shows the complete conversation history with
/// user bubbles (right-aligned) and AI messages (full-width markdown).
/// A drawer on the left lists all conversations with rename/delete.
class AssistantFullScreen extends ConsumerStatefulWidget {
  const AssistantFullScreen({super.key});

  @override
  ConsumerState<AssistantFullScreen> createState() =>
      _AssistantFullScreenState();
}

class _AssistantFullScreenState extends ConsumerState<AssistantFullScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ConversationMessage> _messages = [];
  bool _loadingMessages = false;
  bool _fullTurnInFlight = false;
  bool _reloadAfterTurnScheduled = false;
  String? _loadedConversationId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentConversation();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<bool> _loadCurrentConversation({bool force = false}) async {
    final notifier = ref.read(assistantChatNotifierProvider);
    final convId = notifier.conversationId;
    if (convId == null || (!force && convId == _loadedConversationId)) {
      return false;
    }

    setState(() => _loadingMessages = true);
    try {
      final api = ref.read(aiApiProvider);
      final result = await api.getConversation(convId);
      if (mounted) {
        setState(() {
          _messages = result.messages
              .where((m) => m.isUser || m.isAssistant)
              .toList();
          _loadingMessages = false;
          _loadedConversationId = convId;
        });
        _scrollToBottom();
        return true;
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMessages = false);
    }
    return false;
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  Future<void> _onSend() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final notifier = ref.read(assistantChatNotifierProvider);
    _controller.clear();

    // Add the user message to local list immediately for display.
    setState(() {
      _fullTurnInFlight = true;
      _messages = [
        ..._messages,
        ConversationMessage(
          id: 'local-${DateTime.now().millisecondsSinceEpoch}',
          role: 'user',
          content: text,
        ),
      ];
    });
    _scrollToBottom();

    try {
      await notifier.sendMessage(text);
    } catch (_) {
      if (!mounted) return;
      setState(() => _fullTurnInFlight = false);
    }
  }

  void _onConversationTap(String conversationId) {
    final notifier = ref.read(assistantChatNotifierProvider);
    notifier.openExistingConversation(conversationId);
    setState(() {
      _fullTurnInFlight = false;
      _reloadAfterTurnScheduled = false;
      _loadedConversationId = null;
    });
    _loadCurrentConversation();
  }

  Future<void> _onReset() async {
    await ref.read(assistantChatNotifierProvider).reset();
    if (!mounted) return;
    setState(() {
      _messages = [];
      _fullTurnInFlight = false;
      _reloadAfterTurnScheduled = false;
      _loadedConversationId = null;
    });
  }

  void _reloadAfterCurrentTurn() {
    if (_reloadAfterTurnScheduled) return;
    _reloadAfterTurnScheduled = true;
    _loadedConversationId = null;
    _loadCurrentConversation(force: true).then((loaded) {
      if (!mounted) return;
      setState(() {
        _reloadAfterTurnScheduled = false;
        if (loaded) {
          _fullTurnInFlight = false;
        } else {
          _scrollToBottom();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final displayName = ref.watch(
      currentScreenContextProvider.select((s) => s.displayName),
    );

    // If state machine exits Full, pop this screen.
    ref.listen(assistantStateMachineProvider, (prev, next) {
      if (prev is AssistantFull && next is! AssistantFull) {
        Navigator.of(context).maybePop();
      }
      if (next is AssistantFull) {
        final activeState = next.priorState;
        if (_fullTurnInFlight &&
            activeState is AssistantMidReading &&
            activeState.isDone) {
          _reloadAfterCurrentTurn();
        } else if (_fullTurnInFlight) {
          _scrollToBottom();
        }
      }
    });

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: c.background,
      drawer: ConversationDrawer(onConversationTap: _onConversationTap),
      body: SafeArea(
        child: Column(
          children: [
            _Header(
              displayName: displayName,
              onDrawerTap: () => _scaffoldKey.currentState?.openDrawer(),
              onClose: () => ref.read(assistantChatNotifierProvider).exitFull(),
              onReset: _onReset,
            ),
            Divider(color: c.border, height: 1),
            Expanded(child: _buildBody(c)),
            _ComposeBar(controller: _controller, onSend: _onSend),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(AppColors c) {
    final assistantState = ref.watch(assistantStateMachineProvider);
    final activeFullState = assistantState is AssistantFull
        ? assistantState.priorState
        : null;
    final showLiveTurn =
        _fullTurnInFlight &&
        (activeFullState is AssistantMidLoading ||
            activeFullState is AssistantMidReading ||
            activeFullState is AssistantMidError);

    if (_loadingMessages && _messages.isEmpty && !showLiveTurn) {
      return const Center(child: AppSpinner());
    }

    if (_messages.isEmpty && !showLiveTurn) {
      return Center(
        child: Text(
          'Bắt đầu cuộc trò chuyện',
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            color: c.mutedForeground,
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      itemCount: _messages.length + (showLiveTurn ? 1 : 0),
      itemBuilder: (ctx, i) {
        if (i < _messages.length) {
          return _MessageBubble(message: _messages[i]);
        }
        return _LiveAssistantTurn(
          state: activeFullState!,
          onDeclineProposal: (idx) =>
              ref.read(assistantChatNotifierProvider).dismissProposal(idx),
          onProposalSuccess: (idx, proposal) => ref
              .read(assistantChatNotifierProvider)
              .updateProposal(
                idx,
                proposal.copyWith(status: ProposalCardStatus.success),
              ),
          onRetry: () => ref.read(assistantChatNotifierProvider).retry(),
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.displayName,
    required this.onDrawerTap,
    required this.onClose,
    required this.onReset,
  });

  final String displayName;
  final VoidCallback onDrawerTap;
  final VoidCallback onClose;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.sm,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.menu),
            color: c.mutedForeground,
            tooltip: 'Danh sách hội thoại',
            onPressed: onDrawerTap,
          ),
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
            icon: const Icon(Icons.refresh),
            color: c.mutedForeground,
            tooltip: 'Reset hội thoại',
            onPressed: onReset,
          ),
          IconButton(
            icon: const Icon(Icons.close),
            color: c.mutedForeground,
            tooltip: 'Đóng',
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ConversationMessage message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            color: c.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Text(
            message.content,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: c.foreground,
            ),
          ),
        ),
      );
    }

    // Assistant message — full width, markdown rendered.
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.content.isNotEmpty)
              MarkdownBody(data: message.content, selectable: true)
            else
              Text(
                '_(không có phản hồi)_',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.mutedForeground,
                  fontStyle: FontStyle.italic,
                ),
              ),
            if (message.interrupted)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xs),
                child: Text(
                  'Đã dừng',
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.caption,
                    color: c.mutedForeground,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LiveAssistantTurn extends StatelessWidget {
  const _LiveAssistantTurn({
    required this.state,
    required this.onDeclineProposal,
    required this.onProposalSuccess,
    required this.onRetry,
  });

  final AssistantState state;
  final ValueChanged<int> onDeclineProposal;
  final void Function(int index, ProposalState proposal) onProposalSuccess;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: switch (state) {
          AssistantMidLoading(:final statusText) => Row(
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
          AssistantMidReading(
            :final partial,
            :final interrupted,
            :final proposals,
          ) =>
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MarkdownBody(
                  data: partial.isEmpty
                      ? '_(khÃ´ng cÃ³ pháº£n há»“i)_'
                      : partial,
                  selectable: true,
                ),
                if (interrupted)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text(
                      'ÄÃ£ dá»«ng',
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.caption,
                        color: c.mutedForeground,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                for (var i = 0; i < proposals.length; i++)
                  ProposalCard(
                    proposal: proposals[i],
                    index: i,
                    onDecline: onDeclineProposal,
                    onSuccess: (idx) => onProposalSuccess(idx, proposals[idx]),
                  ),
              ],
            ),
          AssistantMidError(:final message) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
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
              const SizedBox(height: AppSpacing.md),
              AppButton(
                onPressed: onRetry,
                label: 'Thá»­ láº¡i',
                isFullWidth: true,
              ),
            ],
          ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ComposeBar extends StatelessWidget {
  const _ComposeBar({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: c.border)),
        color: c.card,
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.sm,
        MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              maxLines: 5,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.foreground,
              ),
              decoration: InputDecoration(
                hintText: 'Nhập tin nhắn...',
                hintStyle: GoogleFonts.inter(color: c.mutedForeground),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: BorderSide(color: c.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: BorderSide(color: c.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: BorderSide(color: c.primary, width: 1.5),
                ),
              ),
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          IconButton(
            icon: Icon(Icons.send, color: c.primary),
            onPressed: onSend,
          ),
        ],
      ),
    );
  }
}
