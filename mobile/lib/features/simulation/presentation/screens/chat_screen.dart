import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/simulation_chat_notifier.dart';
import '../../data/simulation_providers.dart';
import '../../domain/simulation_message.dart';
import '../widgets/correction_text_span_builder.dart';
import '../widgets/feedback_bottom_sheet.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    super.key,
    required this.sessionId,
    this.isHistory = false,
  });

  final String sessionId;
  final bool isHistory;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();
  final FocusNode _inputFocusNode = FocusNode();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initSession());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    if (_initialized) return;
    _initialized = true;

    final sessionAsync = ref.read(simulationSessionProvider(widget.sessionId));

    await sessionAsync.when(
      data: (data) {
        if (!mounted) return;
        final notifier = ref.read(simulationChatProvider.notifier);
        if (widget.isHistory) {
          notifier.loadExistingSession(
            session: data.session,
            messages: data.messages,
          );
        } else {
          notifier.initSession(
            sessionId: data.session.id,
            chosenCharacterId: data.session.chosenCharacterId,
            initialMessages: data.messages,
            nextTurnCharacterId: data.session.nextTurnCharacterId,
          );
        }
        _scrollToBottom();
      },
      loading: () async {
        final repo = ref.read(simulationRepositoryProvider);
        try {
          final data = await repo.getSession(widget.sessionId);
          if (!mounted) return;
          final notifier = ref.read(simulationChatProvider.notifier);
          if (widget.isHistory) {
            notifier.loadExistingSession(
              session: data.session,
              messages: data.messages,
            );
          } else {
            notifier.initSession(
              sessionId: data.session.id,
              chosenCharacterId: data.session.chosenCharacterId,
              initialMessages: data.messages,
              nextTurnCharacterId: data.session.nextTurnCharacterId,
            );
          }
          _scrollToBottom();
        } catch (e) {
          if (!mounted) return;
          AppToast.show(
            context,
            message: 'Không thể tải phiên hội thoại',
            type: AppToastType.error,
          );
        }
      },
      error: (e, _) async {
        final repo = ref.read(simulationRepositoryProvider);
        try {
          final data = await repo.getSession(widget.sessionId);
          if (!mounted) return;
          final notifier = ref.read(simulationChatProvider.notifier);
          if (widget.isHistory) {
            notifier.loadExistingSession(
              session: data.session,
              messages: data.messages,
            );
          } else {
            notifier.initSession(
              sessionId: data.session.id,
              chosenCharacterId: data.session.chosenCharacterId,
              initialMessages: data.messages,
              nextTurnCharacterId: data.session.nextTurnCharacterId,
            );
          }
          _scrollToBottom();
        } catch (_) {
          if (!mounted) return;
          AppToast.show(
            context,
            message: 'Không thể tải phiên hội thoại',
            type: AppToastType.error,
          );
        }
      },
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _onSend() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;
    _inputController.clear();
    ref.read(simulationChatProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(simulationChatProvider);

    ref.listen(simulationChatProvider, (prev, next) {
      if (prev?.messages.length != next.messages.length) {
        _scrollToBottom();
      }
    });

    final showCompletedBanner =
        chatState.sessionEnded && !widget.isHistory;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hội thoại'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: chatState.sessionId.isEmpty
                ? const Center(child: AppSpinner())
                : _MessageList(
                    messages: chatState.messages,
                    isReceiving: chatState.status == SimulationChatStatus.receiving ||
                        chatState.status == SimulationChatStatus.sending,
                    npcSpeakerName: chatState.npcSpeakerName,
                    scrollController: _scrollController,
                  ),
          ),
          if (showCompletedBanner)
            _CompletedBanner(onViewResult: () {}),
          if (!chatState.sessionEnded && !widget.isHistory)
            _ComposeBar(
              controller: _inputController,
              focusNode: _inputFocusNode,
              enabled: chatState.isLearnerTurn &&
                  chatState.status == SimulationChatStatus.idle,
              isNpcTurn: chatState.isNpcTurn ||
                  chatState.status == SimulationChatStatus.sending,
              npcName: chatState.npcSpeakerName,
              onSend: _onSend,
            ),
          if (widget.isHistory)
            _HistoryBanner(),
        ],
      ),
    );
  }
}

class _MessageList extends StatefulWidget {
  const _MessageList({
    required this.messages,
    required this.isReceiving,
    required this.npcSpeakerName,
    required this.scrollController,
  });

  final List<SimulationMessage> messages;
  final bool isReceiving;
  final String npcSpeakerName;
  final ScrollController scrollController;

  @override
  State<_MessageList> createState() => _MessageListState();
}

class _MessageListState extends State<_MessageList> {
  final Map<int, bool> _animatedIndices = {};

  @override
  void didUpdateWidget(covariant _MessageList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.messages.length > oldWidget.messages.length) {
      final newCount = widget.messages.length - oldWidget.messages.length;
      final startIndex = oldWidget.messages.length;
      for (int i = startIndex; i < startIndex + newCount; i++) {
        if (!_animatedIndices.containsKey(i)) {
          _animatedIndices[i] = false;
          final delay = (i - startIndex) * 300;
          Future.delayed(Duration(milliseconds: delay), () {
            if (mounted) {
              setState(() => _animatedIndices[i] = true);
            }
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: widget.scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      itemCount: widget.messages.length + (widget.isReceiving ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == widget.messages.length && widget.isReceiving) {
          return const _TypingIndicator();
        }

        final message = widget.messages[index];
        final isAnimated = _animatedIndices[index] ?? true;

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: _AnimatedBubble(
            visible: isAnimated,
            child: _MessageBubble(message: message),
          ),
        );
      },
    );
  }
}

class _AnimatedBubble extends StatelessWidget {
  const _AnimatedBubble({
    required this.visible,
    required this.child,
  });

  final bool visible;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: visible ? Offset.zero : const Offset(0, 0.1),
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        child: child,
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppSpinner(size: 16, color: c.mutedForeground),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Đang suy nghĩ...',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final SimulationMessage message;

  @override
  Widget build(BuildContext context) {
    if (message.isLearner) {
      return _LearnerBubble(message: message);
    }
    if (message.speakerName.isEmpty && !message.isLearner) {
      return _SystemMessage(message: message);
    }
    return _NpcBubble(message: message);
  }
}

class _NpcBubble extends StatelessWidget {
  const _NpcBubble({required this.message});

  final SimulationMessage message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppAvatar(
          radius: 20,
          backgroundColor: c.muted,
          child: Text(
            message.speakerName.isNotEmpty
                ? message.speakerName[0].toUpperCase()
                : '?',
            style: TextStyle(
              color: c.foreground,
              fontWeight: FontWeight.w600,
              fontSize: AppTypography.caption,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message.speakerName,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: c.mutedForeground,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                decoration: BoxDecoration(
                  color: c.card,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: c.border, width: 1),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
                child: Text(
                  message.content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: c.foreground,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LearnerBubble extends StatelessWidget {
  const _LearnerBubble({required this.message});

  final SimulationMessage message;

  bool get _hasFeedback {
    final feedback = message.feedback;
    if (feedback == null) return false;
    return feedback.corrections.isNotEmpty || feedback.reviewAvailable;
  }

  void _openFeedbackSheet(BuildContext context, {int? scrollToIndex}) {
    final feedback = message.feedback;
    if (feedback == null) return;

    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (context) => FeedbackBottomSheet(
        feedback: feedback,
        scrollToCorrectionIndex: scrollToIndex,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final feedback = message.feedback;
    final hasCorrections = feedback != null && feedback.corrections.isNotEmpty;

    final textWidget = hasCorrections
        ? RichText(
            text: TextSpan(
              children: CorrectionTextSpanBuilder.build(
                text: message.content,
                corrections: feedback.corrections,
                errorColor: c.error,
                warningColor: c.warning,
                baseStyle: theme.textTheme.bodyMedium!.copyWith(color: c.foreground),
                onCorrectionTap: _hasFeedback
                    ? (index) => _openFeedbackSheet(context, scrollToIndex: index)
                    : null,
              ),
            ),
          )
        : Text(
            message.content,
            style: theme.textTheme.bodyMedium?.copyWith(color: c.foreground),
          );

    return Align(
      alignment: Alignment.centerRight,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (_hasFeedback)
            GestureDetector(
              onTap: () => _openFeedbackSheet(context),
              child: Padding(
                padding: const EdgeInsets.only(right: AppSpacing.xs, bottom: 2),
                child: Icon(
                  Icons.feedback_outlined,
                  size: 16,
                  color: c.mutedForeground,
                ),
              ),
            ),
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            decoration: BoxDecoration(
              color: c.primary.withAlpha(25),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: textWidget,
          ),
        ],
      ),
    );
  }
}

class _SystemMessage extends StatelessWidget {
  const _SystemMessage({required this.message});

  final SimulationMessage message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Text(
          message.content,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            color: c.mutedForeground,
            fontStyle: FontStyle.italic,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _ComposeBar extends StatelessWidget {
  const _ComposeBar({
    required this.controller,
    required this.focusNode,
    required this.enabled,
    required this.isNpcTurn,
    required this.npcName,
    required this.onSend,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final bool isNpcTurn;
  final String npcName;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    final hint = isNpcTurn
        ? (npcName.isNotEmpty ? '$npcName đang nhập...' : 'Đang suy nghĩ...')
        : 'Lượt bạn';

    return Container(
      decoration: BoxDecoration(
        color: enabled ? c.muted.withAlpha(100) : c.muted.withAlpha(60),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.sm,
        top: AppSpacing.sm,
        bottom: AppSpacing.sm,
      ),
      margin: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.md + MediaQuery.of(context).viewPadding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: controller,
            focusNode: focusNode,
            enabled: enabled,
            maxLines: 5,
            minLines: 1,
            textCapitalization: TextCapitalization.sentences,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: enabled ? c.foreground : c.mutedForeground,
            ),
            decoration: InputDecoration(
              hintText: hint,
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
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: enabled
                ? GestureDetector(
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
                  )
                : SizedBox(
                    width: 36,
                    height: 36,
                    child: AppSpinner(
                      size: 20,
                      color: c.mutedForeground,
                      strokeWidth: 2,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _CompletedBanner extends StatelessWidget {
  const _CompletedBanner({required this.onViewResult});

  final VoidCallback onViewResult;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: c.card,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Phiên đã kết thúc',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
              ),
            ),
            AppButton(
              variant: AppButtonVariant.outline,
              label: 'Xem kết quả',
              onPressed: onViewResult,
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: c.card,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: SafeArea(
        top: false,
        child: Center(
          child: Text(
            'Phiên đã kết thúc',
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      ),
    );
  }
}
