import 'package:linvnix/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../application/assistant_state_machine.dart';
import '../../data/ai_api_provider.dart';
import '../../data/conversation_list_provider.dart';
import '../../data/conversation_model.dart';
import '../../data/screen_context_provider.dart';
import '../../domain/assistant_state.dart';
import 'conversation_drawer.dart';

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
  bool _drawerOpen = false;
  String? _loadedConversationId;

  @override
  void initState() {
    super.initState();
    // If we entered Full while a turn was already in-flight from Mid
    // (e.g. user tapped the expand button while AI was thinking), the
    // local _fullTurnInFlight flag must be true so _buildBody renders
    // _LiveAssistantTurn immediately instead of showing an empty screen.
    final initialState = ref.read(assistantStateMachineProvider);
    if (_isTurnInFlight(initialState)) {
      _fullTurnInFlight = true;
    }
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
              .where((m) => m.isVisibleInConversationHistory)
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

    // Refresh sidebar immediately so the conversation shows up in the
    // list even before the AI has replied.
    ref.invalidate(conversationListProvider);

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
      // Refresh sidebar after AI finishes responding so the
      // conversation's updatedAt and preview are up-to-date.
      ref.invalidate(conversationListProvider);
    });
  }

  void _replaceLiveTurn(AssistantState state) {
    if (state is AssistantMidLoading) {
      return;
    }

    setState(() {
      _messages = [..._messages, _buildLiveTurnMessage(state)];
      _fullTurnInFlight = false;
    });
    _scrollToBottom();
  }

  ConversationMessage _buildLiveTurnMessage(AssistantState state) {
    return switch (state) {
      AssistantMidReading(
        :final partial,
        :final interrupted,
        :final messageId,
      ) =>
        ConversationMessage(
          id: messageId ?? 'local-${DateTime.now().millisecondsSinceEpoch}',
          role: 'assistant',
          content: partial,
          interrupted: interrupted,
        ),
      AssistantMidError() => ConversationMessage(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        role: 'assistant',
        content: '',
        interrupted: true,
      ),
      _ => ConversationMessage(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        role: 'assistant',
        content: '',
        interrupted: true,
      ),
    };
  }

  /// Returns true when the state machine has an active in-flight AI turn
  /// (Loading or streaming Reading), regardless of whether we are in
  /// Full or Mid wrapper state.
  bool _isTurnInFlight(AssistantState state) {
    final active = state is AssistantFull
        ? (state.priorState ?? const AssistantCollapsed())
        : state;
    return active is AssistantMidLoading ||
        (active is AssistantMidReading && active.streaming);
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final assistantState = ref.watch(assistantStateMachineProvider);
    final displayName = ref.watch(
      currentScreenContextProvider.select((s) => s.displayName),
    );

    // If state machine exits Full, pop this screen.
    ref.listen(assistantStateMachineProvider, (prev, next) {
      if (prev is AssistantFull && next is! AssistantFull) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            Navigator.of(context).maybePop();
          }
        });
      }
      if (next is AssistantFull) {
        final activeState = next.priorState;
        // If a turn just became in-flight (e.g. user entered Full while
        // Mid was already loading), sync the local flag.
        if (_isTurnInFlight(next) && !_fullTurnInFlight) {
          setState(() => _fullTurnInFlight = true);
          _scrollToBottom();
        }
        if (_fullTurnInFlight &&
            activeState is AssistantMidReading &&
            activeState.isDone) {
          if (activeState.interrupted) {
            _replaceLiveTurn(activeState);
          } else {
            _reloadAfterCurrentTurn();
          }
        } else if (_fullTurnInFlight) {
          _scrollToBottom();
        }
      }
    });

    return PopScope(
      canPop: assistantState is! AssistantFull || _drawerOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || assistantState is! AssistantFull) return;
        ref.read(assistantChatNotifierProvider).exitFull();
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: c.background,
        onDrawerChanged: _onDrawerChanged,
        drawer: ConversationDrawer(
          onConversationTap: _onConversationTap,
          onNewConversation: _onNewConversation,
        ),
        body: SafeArea(
          child: Column(
            children: [
              _Header(
                displayName: displayName,
                onDrawerTap: () => _scaffoldKey.currentState?.openDrawer(),
                onClose: () {
                  final notifier = ref.read(assistantChatNotifierProvider);
                  if (!notifier.exitFull()) {
                    Navigator.of(context).maybePop();
                  }
                },
                onReset: _onReset,
              ),
              Divider(color: c.border, height: 1),
              Expanded(child: _buildBody(c)),
              _ComposeBar(
                controller: _controller,
                onSend: _onSend,
                onStop: () => ref.read(assistantChatNotifierProvider).stop(),
                inFlight: _isFullTurnInFlight(assistantState),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onDrawerChanged(bool isOpened) {
    setState(() => _drawerOpen = isOpened);
  }

  Future<void> _onNewConversation() async {
    await _onReset();
  }

  Future<void> _onRegenerate(int assistantMessageIndex) async {
    // Find the preceding user message.
    int? userMessageIndex;
    for (int i = assistantMessageIndex - 1; i >= 0; i--) {
      if (_messages[i].isUser) {
        userMessageIndex = i;
        break;
      }
    }
    if (userMessageIndex == null) return;

    final precedingUserMessage = _messages[userMessageIndex].content;
    final userMessageId = _messages[userMessageIndex].id;

    // Skip if the user message is a local-only bubble (not yet persisted).
    if (userMessageId.startsWith('local-')) return;

    final hasMessagesAfter = assistantMessageIndex < _messages.length - 1;

    if (hasMessagesAfter) {
      final confirmed = await AppDialog.show<bool>(
        context,
        builder: (ctx) => AppDialog(
          title: S.of(context).regenerateResponseQuestion,
          content: S.of(context).deleteMessageChainQuestion,
          actions: [
            AppDialogAction(
              label: S.of(context).cancelButton2,
              onPressed: () => Navigator.of(ctx).pop(false),
            ),
            AppDialogAction(
              label: S.of(context).deleteAndRegenerate,
              isPrimary: true,
              onPressed: () => Navigator.of(ctx).pop(true),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    // Keep the user message visible during thinking/streaming.
    // Cut everything from the assistant message onward; the user message
    // stays so the UI shows it above the spinner.
    setState(() {
      _messages = _messages.sublist(0, userMessageIndex! + 1);
      _fullTurnInFlight = true;
    });
    _scrollToBottom();

    await ref.read(assistantChatNotifierProvider).regenerateFrom(
          messageId: userMessageId,
          precedingUserMessage: precedingUserMessage,
        );
  }

  bool _isFullTurnInFlight(AssistantState state) {
    if (state is! AssistantFull) return false;
    final activeState = state.priorState;
    return activeState is AssistantMidLoading ||
        (activeState is AssistantMidReading && activeState.streaming);
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
      return const _AssistantChatLoading();
    }

    if (_messages.isEmpty && !showLiveTurn) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: c.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.forum_outlined,
                  size: 80,
                  color: c.primary,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                S.of(context).aiAssistantTitle,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: c.foreground,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                S.of(context).assistantWelcomeMessage,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: c.mutedForeground,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
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
          final msg = _messages[i];
          return _MessageBubble(
            message: msg,
            onRegenerate: msg.isAssistant && !msg.id.startsWith('local-')
                ? () => _onRegenerate(i)
                : null,
          );
        }
        return _LiveAssistantTurn(
          state: activeFullState!,
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

  String _localizeDisplayName(BuildContext context, String name) {
    final s = S.of(context);
    return switch (name) {
      'Bookmarks' => s.bookmarksTitle,
      'Saved Words' => s.savedWordsTitle,
      'Exercise' => s.exercisePlayTitle,
      'Practice' => s.practiceSection,
      'Lesson' => s.lessonTitle,
      'Module' => s.moduleDetailTitle,
      'Course' => s.courseDetailTitle,
      'Conversation history' => s.conversationHistoryTitle,
      'Simulation result' => s.simulationResultTitle,
      _ => name,
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final localizedName = _localizeDisplayName(context, displayName);
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
            tooltip: S.of(context).conversationList,
            onPressed: onDrawerTap,
          ),
          Expanded(
            child: Text(
              '${S.of(context).aiAssistantTitle} · $localizedName',
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
            tooltip: S.of(context).resetConversation,
            onPressed: onReset,
          ),
          IconButton(
            icon: const Icon(Icons.close),
            color: c.mutedForeground,
            tooltip: S.of(context).closeButton,
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, this.onRegenerate});

  final ConversationMessage message;
  final VoidCallback? onRegenerate;

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
            else if (!message.interrupted)
              Text(
                S.of(context).noResponseLabel,
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
                  S.of(context).stoppedLabel,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.caption,
                    color: c.mutedForeground,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            _MessageActionBar(
              content: message.content,
              createdAt: message.createdAt,
              onRegenerate: onRegenerate,
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
    required this.onRetry,
  });

  final AssistantState state;
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
                  statusText == AssistantMidLoading.defaultStatusText
                      ? S.of(context).thinking
                      : statusText,
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
            :final streaming,
            :final toolStatusText,
          ) =>
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (partial.isNotEmpty)
                  MarkdownBody(data: partial, selectable: true),
                if (interrupted)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text(
                      S.of(context).stoppedLabel,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.caption,
                        color: c.mutedForeground,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                if (toolStatusText != null)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.sm),
                    child: Row(
                      children: [
                        const AppSpinner(),
                        const SizedBox(width: AppSpacing.md),
                        Flexible(
                          child: Text(
                            toolStatusText,
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.bodyMedium,
                              color: c.mutedForeground,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                // Show action bar only when streaming is done.
                if (!streaming && partial.isNotEmpty)
                  _MessageActionBar(
                    content: partial,
                    createdAt: null,
                    onRegenerate: null,
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
                label: S.of(context).retryButton,
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
  const _ComposeBar({
    required this.controller,
    required this.onSend,
    required this.onStop,
    required this.inFlight,
  });

  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback onStop;
  final bool inFlight;

  @override
  Widget build(BuildContext context) {
    // Outer wrapper: no background, no border — just keyboard-aware padding.
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: AppChatComposeField(
        controller: controller,
        hintText: S.of(context).typeMessageHint,
        enabled: !inFlight,
        showMic: !inFlight,
        onSend: inFlight ? onStop : onSend,
        onSubmitted: (_) {
          if (!inFlight) onSend();
        },
        trailingIcon:
            inFlight ? Icons.stop_rounded : Icons.arrow_upward_rounded,
        trailingColor: inFlight ? AppTheme.colors(context).error : null,
        trailingIconColor:
            inFlight ? AppTheme.colors(context).errorForeground : null,
        trailingEnabled: true,
      ),
    );
  }
}

class _AssistantChatLoading extends StatelessWidget {
  const _AssistantChatLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Shimmer.fromColors(
      baseColor: c.muted,
      highlightColor: c.card,
      child: ListView(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const SizedBox(height: AppSpacing.md),
          // User bubble (right-aligned)
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              width: 180,
              height: 44,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
            ),
          ),
          // AI response skeleton (left-aligned)
          Align(
            alignment: Alignment.centerLeft,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 240,
                  height: 18,
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                Container(
                  width: double.infinity,
                  height: 14,
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                Container(
                  width: 280,
                  height: 14,
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                Container(
                  width: 150,
                  height: 14,
                  margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
              ],
            ),
          ),
          // User bubble (right-aligned)
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              width: 140,
              height: 44,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
            ),
          ),
          // AI response skeleton (left-aligned)
          Align(
            alignment: Alignment.centerLeft,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 200,
                  height: 18,
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                Container(
                  width: double.infinity,
                  height: 14,
                  margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                Container(
                  width: 220,
                  height: 14,
                  margin: const EdgeInsets.only(bottom: AppSpacing.md),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
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

class _MessageActionBar extends StatefulWidget {
  const _MessageActionBar({
    required this.content,
    required this.createdAt,
    required this.onRegenerate,
  });

  final String content;
  final DateTime? createdAt;
  final VoidCallback? onRegenerate;

  @override
  State<_MessageActionBar> createState() => _MessageActionBarState();
}

class _MessageActionBarState extends State<_MessageActionBar> {
  bool _copied = false;

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return S.of(context).justNowLabel;
    if (diff.inMinutes < 60) return S.of(context).minutesAgoParam(diff.inMinutes);
    if (diff.inHours < 24) return S.of(context).hoursAgoParam(diff.inHours);
    return DateFormat('dd/MM/yyyy HH:mm').format(dt);
  }

  Future<void> _onCopy() async {
    await Clipboard.setData(ClipboardData(text: widget.content));
    setState(() => _copied = true);
    await Future<void>.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  void _onShare() {
    Share.share(widget.content);
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final timeLabel =
        widget.createdAt != null ? _formatTime(widget.createdAt!) : null;

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: Wrap(
        spacing: AppSpacing.xs,
        runSpacing: AppSpacing.xs,
        children: [
          _ActionChip(
            icon: _copied ? Icons.check : Icons.copy_outlined,
            tooltip: _copied ? S.of(context).copiedToast : S.of(context).copyLabel,
            color: _copied ? c.primary : c.mutedForeground,
            onTap: _onCopy,
          ),
          if (widget.onRegenerate != null)
            _ActionChip(
              icon: Icons.refresh,
              tooltip: S.of(context).regenerateLabel,
              color: c.mutedForeground,
              onTap: widget.onRegenerate!,
            ),
          _ActionChip(
            icon: Icons.share_outlined,
            tooltip: S.of(context).shareLabel,
            color: c.mutedForeground,
            onTap: _onShare,
          ),
          if (timeLabel != null)
            _TimeChip(
              label: timeLabel,
              color: c.mutedForeground,
            ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            border: Border.all(color: c.border),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  const _TimeChip({
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: AppTypography.caption,
          color: color,
        ),
      ),
    );
  }
}
