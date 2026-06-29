import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/network/media_url.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../profile/data/profile_providers.dart';
import '../../application/simulation_chat_notifier.dart';
import '../../application/simulation_tts_service.dart';
import '../../data/simulation_providers.dart';
import '../../data/simulation_repository.dart';
import '../../domain/simulation_message.dart';
import '../widgets/correction_text_span_builder.dart';
import '../widgets/feedback_bottom_sheet.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    super.key,
    required this.sessionId,
    this.isHistory = false,
    this.fromResult = false,
    this.fromCharacterSelection = false,
  });

  final String sessionId;
  final bool isHistory;
  final bool fromResult;
  final bool fromCharacterSelection;

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
  void didUpdateWidget(covariant ChatScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.sessionId != widget.sessionId) {
      _initialized = false;
      WidgetsBinding.instance.addPostFrameCallback((_) => _initSession());
    }
  }

  @override
  void dispose() {
    if (!widget.isHistory) {
      final notifier = ref.read(simulationChatProvider.notifier);
      if (notifier.isAwaitingAiResponse) {
        notifier.discardPendingOutboundMessage();
      }
    }
    _scrollController.dispose();
    _inputController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    if (_initialized) return;
    _initialized = true;

    ref.invalidate(simulationSessionProvider(widget.sessionId));

    try {
      final data = await ref
          .read(simulationRepositoryProvider)
          .getSession(widget.sessionId);
      if (!mounted) return;
      await _applySessionData(data);
    } catch (_) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: S.of(context).unableToCreateSessionMessage,
        type: AppToastType.error,
      );
    }
  }

  Future<void> _applySessionData(SessionWithMessages data) async {
    final enriched = await _enrichMessageSpeakerNames(
      data.messages,
      data.session.scenarioId,
      data.session.chosenCharacterId,
    );

    final notifier = ref.read(simulationChatProvider.notifier);
    if (widget.isHistory) {
      notifier.loadExistingSession(
        session: data.session,
        messages: enriched.messages,
        chosenCharacterName: enriched.chosenCharacterName,
      );
    } else {
      notifier.initSession(
        sessionId: data.session.id,
        chosenCharacterId: data.session.chosenCharacterId,
        chosenCharacterName: enriched.chosenCharacterName,
        initialMessages: enriched.messages,
        nextTurnCharacterId: data.session.nextTurnCharacterId,
        scenarioId: data.session.scenarioId,
      );
    }
    _scrollToBottom();
  }

  Future<({List<SimulationMessage> messages, String chosenCharacterName})>
      _enrichMessageSpeakerNames(
    List<SimulationMessage> messages,
    String scenarioId,
    String chosenCharacterId,
  ) async {
    final needsMessageEnrichment = messages.any(
      (m) =>
          m.speakerCharacterId != null &&
          m.speakerCharacterId!.isNotEmpty &&
          m.speakerName.isEmpty,
    );
    if (scenarioId.isEmpty || chosenCharacterId.isEmpty) {
      return (
        messages: messages,
        chosenCharacterName: _characterNameFromMessages(
          chosenCharacterId,
          messages,
        ),
      );
    }

    try {
      final scenario =
          await ref.read(simulationRepositoryProvider).getScenario(scenarioId);
      final characterNames = {
        for (final character in scenario.characters) character.id: character.name,
      };
      final chosenCharacterName = characterNames[chosenCharacterId] ?? '';

      if (!needsMessageEnrichment) {
        return (
          messages: messages,
          chosenCharacterName: chosenCharacterName.isNotEmpty
              ? chosenCharacterName
              : _characterNameFromMessages(chosenCharacterId, messages),
        );
      }

      final enrichedMessages = messages
          .map((message) => _withResolvedSpeakerName(message, characterNames))
          .toList();

      return (
        messages: enrichedMessages,
        chosenCharacterName: chosenCharacterName.isNotEmpty
            ? chosenCharacterName
            : _characterNameFromMessages(chosenCharacterId, enrichedMessages),
      );
    } catch (_) {
      return (
        messages: messages,
        chosenCharacterName: _characterNameFromMessages(
          chosenCharacterId,
          messages,
        ),
      );
    }
  }

  String _characterNameFromMessages(
    String characterId,
    List<SimulationMessage> messages,
  ) {
    if (characterId.isEmpty) return '';
    final match = messages
        .where(
          (m) =>
              m.speakerCharacterId == characterId && m.speakerName.isNotEmpty,
        )
        .lastOrNull;
    return match?.speakerName ?? '';
  }

  SimulationMessage _withResolvedSpeakerName(
    SimulationMessage message,
    Map<String, String> characterNames,
  ) {
    if (message.speakerName.isNotEmpty) return message;

    final characterId = message.speakerCharacterId;
    if (characterId == null || characterId.isEmpty) return message;

    final name = characterNames[characterId];
    if (name == null || name.isEmpty) return message;

    return SimulationMessage(
      id: message.id,
      speakerCharacterId: message.speakerCharacterId,
      speakerName: name,
      isLearner: message.isLearner,
      content: message.content,
      translation: message.translation,
      feedback: message.feedback,
      orderIndex: message.orderIndex,
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

  Future<void> _onBack() async {
    if (!widget.isHistory) {
      final notifier = ref.read(simulationChatProvider.notifier);
      if (notifier.isAwaitingAiResponse) {
        await notifier.discardPendingOutboundMessage();
      }
    }

    if (!mounted) return;
    ref.invalidate(pausedSessionProvider);
    if (widget.fromCharacterSelection) {
      context.go('/practice');
      return;
    }
    context.pop();
  }

  void _showSessionMenu() {
    final chatState = ref.read(simulationChatProvider);
    final c = AppTheme.colors(context);

    final items = <AppMenuBottomSheetItem>[
      AppMenuBottomSheetItem(
        label: S.of(context).endSession,
        icon: Icons.cancel_outlined,
        foregroundColor: c.error,
        onTap: _confirmCancelSession,
      ),
      if (chatState.scenarioId.isNotEmpty)
        AppMenuBottomSheetItem(
          label: S.of(context).viewScenario,
          icon: Icons.description_outlined,
          onTap: () => context.push(
            '/practice/scenarios/${chatState.scenarioId}?fromConversation=true',
          ),
        ),
    ];

    AppMenuBottomSheet.show(
      context,
      title: S.of(context).chatTitle,
      items: items,
    );
  }

  void _confirmCancelSession() {
    AppDialog.show(
      context,
      builder: (context) => AppDialog(
        title: S.of(context).endConversationQuestion,
        content: S.of(context).conversationProgressLost,
        actions: [
          AppDialogAction(
            label: S.of(context).noLabel,
            onPressed: () => Navigator.of(context).pop(),
          ),
          AppDialogAction(
            label: S.of(context).endSession,
            isPrimary: true,
            onPressed: () {
              Navigator.of(context).pop();
              _doCancelSession();
            },
          ),
        ],
      ),
    );
  }

  Future<void> _doCancelSession() async {
    final notifier = ref.read(simulationChatProvider.notifier);
    await notifier.cancelSession();
    ref.invalidate(pausedSessionProvider);
    if (!mounted) return;
    while (context.canPop()) {
      context.pop();
    }
    context.go('/practice');
  }

  void _navigateToResult() {
    final chatState = ref.read(simulationChatProvider);
    final resultId = chatState.resultId;
    if (resultId != null && resultId.isNotEmpty) {
      ref.invalidate(pausedSessionProvider);
      context.replace(
        '/practice/results/$resultId?fromConversation=true',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(simulationChatProvider);

    ref.listen(simulationChatProvider, (prev, next) {
      if (prev?.messages.length != next.messages.length) {
        _scrollToBottom();
      }
      if (prev?.status == SimulationChatStatus.sending &&
          next.status == SimulationChatStatus.idle) {
        final failedContent = next.failedOutboundContent;
        if (failedContent != null && failedContent.isNotEmpty) {
          _inputController.text = failedContent;
          _inputController.selection = TextSelection.collapsed(
            offset: failedContent.length,
          );
          _inputFocusNode.requestFocus();
        }
      }
      if (next.error != null && next.error != prev?.error) {
        AppToast.show(
          context,
          message: S.of(context).unableToCreateSessionMessage,
          type: AppToastType.error,
        );
      }
    });

    final isCompleted = chatState.sessionEnded && !widget.isHistory;
    final showCompletedBanner = isCompleted;
    final showHistoryBanner = widget.isHistory;
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        unawaited(_onBack());
      },
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        appBar: AppBar(
          title: Text(S.of(context).chatTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _onBack,
          ),
          actions: [
            if (!widget.isHistory && !chatState.sessionEnded)
              IconButton(
                icon: const Icon(Icons.more_vert),
                onPressed: _showSessionMenu,
              ),
          ],
        ),
        body: SafeArea(
          top: false,
          bottom: !keyboardOpen,
          child: Column(
            children: [
              Expanded(
                child: chatState.sessionId.isEmpty
                    ? const Center(child: AppSpinner())
                    : _MessageList(
                        messages: chatState.messages,
                        isWaitingForResponse:
                            chatState.status == SimulationChatStatus.sending,
                        scrollController: _scrollController,
                      ),
              ),
              if (showCompletedBanner)
                _CompletedBanner(onViewResult: _navigateToResult),
              if (showHistoryBanner)
                _HistoryBanner(
                  showViewResult: !widget.fromResult,
                  onViewResult: _navigateToResult,
                ),
              if (!chatState.sessionEnded && !widget.isHistory)
                _ComposeBar(
                  controller: _inputController,
                  focusNode: _inputFocusNode,
                  enabled: chatState.isLearnerTurn &&
                      chatState.status == SimulationChatStatus.idle,
                  isSending: chatState.status == SimulationChatStatus.sending,
                  onSend: _onSend,
                  onStop: () => ref
                      .read(simulationChatProvider.notifier)
                      .discardPendingOutboundMessage(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageList extends StatefulWidget {
  const _MessageList({
    required this.messages,
    required this.isWaitingForResponse,
    required this.scrollController,
  });

  final List<SimulationMessage> messages;
  final bool isWaitingForResponse;
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
      itemCount: widget.messages.length + (widget.isWaitingForResponse ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == widget.messages.length && widget.isWaitingForResponse) {
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppAvatar(
            radius: 20,
            backgroundColor: c.muted,
            child: Icon(Icons.smart_toy_outlined, size: 20, color: c.mutedForeground),
          ),
          const SizedBox(width: AppSpacing.sm),
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
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppSpinner(size: 16, color: c.mutedForeground),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  S.of(context).thinking,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
        ],
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
    final characterId = message.speakerCharacterId;
    if (characterId == null || characterId.isEmpty) {
      return _SystemMessage(message: message);
    }
    return _NpcBubble(message: message);
  }
}

class _NpcBubble extends ConsumerWidget {
  const _NpcBubble({required this.message});

  final SimulationMessage message;

  void _showOptions(BuildContext context, WidgetRef ref) {
    final tts = ref.read(simulationTtsServiceProvider);
    final hasTranslation =
        message.translation != null && message.translation!.isNotEmpty;

    AppMenuBottomSheet.show(
      context,
      title: message.speakerName,
      items: [
        AppMenuBottomSheetItem(
          label: S.of(context).readAloudVietnamese,
          icon: Icons.volume_up_outlined,
          onTap: () => tts.speak(message.id, message.content),
        ),
        AppMenuBottomSheetItem(
          label: S.of(context).copyVietnamese,
          icon: Icons.content_copy_outlined,
          onTap: () {
            Clipboard.setData(ClipboardData(text: message.content));
            AppToast.show(
              context,
              message: S.of(context).copiedToast,
              type: AppToastType.success,
            );
          },
        ),
        if (hasTranslation)
          AppMenuBottomSheetItem(
            label: S.of(context).copyTranslation,
            icon: Icons.translate_outlined,
            onTap: () {
              Clipboard.setData(ClipboardData(text: message.translation!));
              AppToast.show(
                context,
                message: S.of(context).copiedToast,
                type: AppToastType.success,
              );
            },
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final hasTranslation =
        message.translation != null && message.translation!.isNotEmpty;
    final playingId = ref.watch(ttsPlayingMessageIdProvider);
    final isPlaying = playingId == message.id;

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
            style: GoogleFonts.inter(
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
                style: GoogleFonts.inter(
                  fontSize: AppTypography.caption,
                  fontWeight: FontWeight.w600,
                  color: c.mutedForeground,
                ),
              ),
              const SizedBox(height: 2),
              GestureDetector(
                onLongPress: () => _showOptions(context, ref),
                child: Container(
                  decoration: BoxDecoration(
                    color: c.card,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    border: Border.all(color: c.border, width: 1),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              message.content,
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.bodyMedium,
                                color: c.foreground,
                                height: 1.4,
                              ),
                            ),
                          ),
                          if (isPlaying) ...[
                            const SizedBox(width: AppSpacing.xs),
                            Icon(
                              Icons.volume_up,
                              size: 16,
                              color: c.primary,
                            ),
                          ],
                        ],
                      ),
                      if (hasTranslation) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          message.translation!,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            color: c.mutedForeground,
                            fontStyle: FontStyle.italic,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
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

class _LearnerBubble extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final chatState = ref.watch(simulationChatProvider);
    final profile = ref.watch(userProfileProvider).value;
    final youLabel = S.of(context).youLabel;
    final rawDisplayName = message.speakerName.isNotEmpty
        ? message.speakerName
        : (chatState.chosenCharacterName.isNotEmpty
            ? chatState.chosenCharacterName
            : youLabel);
    final displayName = rawDisplayName == defaultLearnerName ? youLabel : rawDisplayName;
    final avatarUrl = profile?.avatarUrl;
    final feedback = message.feedback;
    final hasCorrections = feedback != null && feedback.corrections.isNotEmpty;
    final bodyStyle = GoogleFonts.inter(
      fontSize: AppTypography.bodyMedium,
      color: c.foreground,
      height: 1.4,
    );

    final textWidget = hasCorrections
        ? RichText(
            text: TextSpan(
              children: CorrectionTextSpanBuilder.build(
                text: message.content,
                corrections: feedback.corrections,
                errorColor: c.error,
                warningColor: c.warning,
                baseStyle: bodyStyle,
                onCorrectionTap: _hasFeedback
                    ? (index) => _openFeedbackSheet(context, scrollToIndex: index)
                    : null,
              ),
            ),
          )
        : Text(message.content, style: bodyStyle);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                displayName,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.caption,
                  fontWeight: FontWeight.w600,
                  color: c.mutedForeground,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (_hasFeedback)
                    GestureDetector(
                      onTap: () => _openFeedbackSheet(context),
                      child: Padding(
                        padding: const EdgeInsets.only(
                          right: AppSpacing.xs,
                          bottom: 2,
                        ),
                        child: Icon(
                          Icons.feedback_outlined,
                          size: 16,
                          color: c.mutedForeground,
                        ),
                      ),
                    ),
                  Flexible(
                    child: GestureDetector(
                      onTap: _hasFeedback
                          ? () => _openFeedbackSheet(context)
                          : null,
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        decoration: BoxDecoration(
                          color: c.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                          border: Border.all(
                            color: c.primary.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                          vertical: AppSpacing.md,
                        ),
                        child: textWidget,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        AppAvatar(
          radius: 20,
          backgroundColor: c.muted,
          backgroundImage:
              avatarUrl != null ? NetworkImage(resolveMediaUrl(avatarUrl)) : null,
          child: avatarUrl == null
              ? Text(
                  displayName.isNotEmpty
                      ? displayName[0].toUpperCase()
                      : '?',
                  style: GoogleFonts.inter(
                    color: c.foreground,
                    fontWeight: FontWeight.w600,
                    fontSize: AppTypography.caption,
                  ),
                )
              : null,
        ),
      ],
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
    required this.isSending,
    required this.onSend,
    required this.onStop,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final bool isSending;
  final VoidCallback onSend;
  final VoidCallback onStop;

  @override
  Widget build(BuildContext context) {
    final hint = enabled ? S.of(context).yourTurn : S.of(context).thinking;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: isSending
          ? _StopBar(hint: S.of(context).stopLabel, onStop: onStop)
          : AppChatComposeField(
              controller: controller,
              focusNode: focusNode,
              hintText: hint,
              enabled: enabled,
              onSend: enabled ? onSend : null,
              onSubmitted: enabled ? (_) => onSend() : null,
            ),
    );
  }
}

class _StopBar extends StatelessWidget {
  const _StopBar({required this.hint, required this.onStop});

  final String hint;
  final VoidCallback onStop;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      decoration: BoxDecoration(
        color: c.muted.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              hint,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.mutedForeground,
              ),
            ),
          ),
          GestureDetector(
            onTap: onStop,
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
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
        border: Border.all(color: c.border, width: 1),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Text(
                S.of(context).sessionEndedMessage,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
              ),
            ),
            AppButton(
              variant: AppButtonVariant.outline,
              label: S.of(context).viewResultsButton,
              onPressed: onViewResult,
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryBanner extends StatelessWidget {
  const _HistoryBanner({
    this.showViewResult = true,
    this.onViewResult,
  });

  final bool showViewResult;
  final VoidCallback? onViewResult;

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
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
        border: Border.all(color: c.border, width: 1),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Text(
                S.of(context).sessionEndedMessage,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.mutedForeground,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
            if (showViewResult && onViewResult != null)
              AppButton(
                variant: AppButtonVariant.outline,
                label: S.of(context).viewResultsButton,
                onPressed: onViewResult,
              ),
          ],
        ),
      ),
    );
  }
}
