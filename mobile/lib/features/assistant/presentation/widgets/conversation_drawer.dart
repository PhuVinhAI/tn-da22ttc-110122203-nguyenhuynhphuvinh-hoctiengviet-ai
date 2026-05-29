import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../data/conversation_list_provider.dart';
import '../../data/conversation_model.dart';

class ConversationDrawer extends ConsumerStatefulWidget {
  const ConversationDrawer({
    super.key,
    required this.onConversationTap,
    required this.onNewConversation,
  });

  final void Function(String conversationId) onConversationTap;
  final VoidCallback onNewConversation;

  @override
  ConsumerState<ConversationDrawer> createState() =>
      _ConversationDrawerState();
}

class _ConversationDrawerState extends ConsumerState<ConversationDrawer> {
  String? _renamingId;
  final TextEditingController _renameController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final current = ref.read(conversationListProvider);
      if (!current.hasValue) {
        ref.read(conversationListProvider.notifier).refresh();
      }
    });
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.trim().toLowerCase());
    });
    _searchFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _renameController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final conversations = ref.watch(conversationListProvider);
    final activeId = ref.read(assistantChatNotifierProvider).conversationId;

    final filteredList = conversations.whenOrNull(
      data: (list) => _searchQuery.isEmpty
          ? list
          : list
              .where((conv) =>
                  conv.displayTitle.toLowerCase().contains(_searchQuery))
              .toList(),
    );

    final totalCount = conversations.whenOrNull(data: (l) => l.length) ?? 0;

    return Drawer(
      backgroundColor: c.card,
      elevation: 0,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Header(totalCount: totalCount),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: _NewConversationButton(
                onPressed: () => _createNew(context),
              ),
            ),
            _SearchField(
              controller: _searchController,
              focusNode: _searchFocus,
              hasFocus: _searchFocus.hasFocus,
              query: _searchQuery,
              onClear: _searchController.clear,
            ),
            const SizedBox(height: AppSpacing.sm),
            Expanded(
              child: conversations.when(
                loading: () => const _ConversationsLoading(),
                error: (e, _) => _ErrorState(
                  onRetry: () =>
                      ref.read(conversationListProvider.notifier).refresh(),
                ),
                data: (_) {
                  final list = filteredList ?? [];
                  if (list.isEmpty) {
                    return _EmptyState(searching: _searchQuery.isNotEmpty);
                  }
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(conversationListProvider.notifier).refresh(),
                    child: _GroupedList(
                      items: list,
                      activeId: activeId,
                      renamingId: _renamingId,
                      renameController: _renameController,
                      onTap: (id) {
                        Navigator.of(context).maybePop();
                        widget.onConversationTap(id);
                      },
                      onRename: _startRename,
                      onDelete: (conv) => _confirmDelete(context, conv),
                      onRenameSubmit: (id, title) =>
                          _submitRename(id, title),
                      onRenameCancel: () => setState(() {
                        _renamingId = null;
                        _renameController.clear();
                      }),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _createNew(BuildContext context) {
    Navigator.of(context).maybePop();
    widget.onNewConversation();
  }

  void _startRename(ConversationSummary conv) {
    setState(() {
      _renamingId = conv.id;
      _renameController.text = conv.displayTitle;
    });
  }

  Future<void> _submitRename(String id, String title) async {
    final trimmed = title.trim();
    if (trimmed.isEmpty) return;
    setState(() => _renamingId = null);
    await ref.read(conversationListProvider.notifier).rename(id, trimmed);
  }

  Future<void> _confirmDelete(
    BuildContext context,
    ConversationSummary conv,
  ) async {
    final confirmed = await AppDialog.show<bool>(
      context,
      barrierDismissible: true,
      builder: (ctx) => AppDialog(
        title: 'Delete conversation',
        content:
            'Are you sure you want to delete "${conv.displayTitle}"? This action cannot be undone.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.of(ctx).pop(false),
          ),
          AppDialogAction(
            label: 'Delete',
            isPrimary: true,
            onPressed: () => Navigator.of(ctx).pop(true),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(conversationListProvider.notifier).delete(conv.id);
    }
  }
}

// ─── Header ──────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.totalCount});

  final int totalCount;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xs,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: c.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              Icons.forum_outlined,
              size: 18,
              color: c.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Conversations',
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.titleSmall,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  totalCount == 0
                      ? 'No history yet'
                      : '$totalCount ${totalCount == 1 ? 'chat' : 'chats'}',
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.caption,
                    color: c.mutedForeground,
                    height: 1.1,
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

class _NewConversationButton extends StatelessWidget {
  const _NewConversationButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          decoration: BoxDecoration(
            color: c.primary,
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add, size: 18, color: c.primaryForeground),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'New conversation',
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    fontWeight: FontWeight.w600,
                    color: c.primaryForeground,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Search field ───────────────────────────────────────────────────────

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.controller,
    required this.focusNode,
    required this.hasFocus,
    required this.query,
    required this.onClear,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasFocus;
  final String query;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        decoration: BoxDecoration(
          color: c.muted,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: hasFocus ? c.primary : Colors.transparent,
            width: 1,
          ),
        ),
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            color: c.foreground,
          ),
          decoration: InputDecoration(
            hintText: 'Search conversations',
            hintStyle: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
            ),
            prefixIcon: Icon(
              Icons.search,
              size: 18,
              color: c.mutedForeground,
            ),
            prefixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 36,
            ),
            suffixIcon: query.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.close,
                        size: 16, color: c.mutedForeground),
                    onPressed: onClear,
                    splashRadius: 16,
                  )
                : null,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              vertical: AppSpacing.sm + 2,
            ),
            filled: false,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
      ),
    );
  }
}

// ─── Grouped list ───────────────────────────────────────────────────────

class _GroupedList extends StatelessWidget {
  const _GroupedList({
    required this.items,
    required this.activeId,
    required this.renamingId,
    required this.renameController,
    required this.onTap,
    required this.onRename,
    required this.onDelete,
    required this.onRenameSubmit,
    required this.onRenameCancel,
  });

  final List<ConversationSummary> items;
  final String? activeId;
  final String? renamingId;
  final TextEditingController renameController;
  final void Function(String id) onTap;
  final void Function(ConversationSummary conv) onRename;
  final void Function(ConversationSummary conv) onDelete;
  final void Function(String id, String title) onRenameSubmit;
  final VoidCallback onRenameCancel;

  @override
  Widget build(BuildContext context) {
    final groups = _groupByDate(items);
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      itemCount: groups.length,
      itemBuilder: (ctx, i) {
        final g = groups[i];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _GroupHeader(label: g.label),
            ...g.items.map((conv) => _ConversationRow(
                  conversation: conv,
                  isActive: conv.id == activeId,
                  isRenaming: renamingId == conv.id,
                  renameController: renameController,
                  onTap: () => onTap(conv.id),
                  onRename: () => onRename(conv),
                  onDelete: () => onDelete(conv),
                  onRenameSubmit: (title) => onRenameSubmit(conv.id, title),
                  onRenameCancel: onRenameCancel,
                )),
          ],
        );
      },
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.xs,
      ),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: AppTypography.caption - 1,
          fontWeight: FontWeight.w600,
          color: c.mutedForeground,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _ConversationGroup {
  const _ConversationGroup(this.label, this.items);
  final String label;
  final List<ConversationSummary> items;
}

List<_ConversationGroup> _groupByDate(List<ConversationSummary> items) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final yesterday = today.subtract(const Duration(days: 1));
  final last7 = today.subtract(const Duration(days: 7));
  final last30 = today.subtract(const Duration(days: 30));

  final todayList = <ConversationSummary>[];
  final yesterdayList = <ConversationSummary>[];
  final weekList = <ConversationSummary>[];
  final monthList = <ConversationSummary>[];
  final olderList = <ConversationSummary>[];

  for (final conv in items) {
    final d = DateTime(
        conv.updatedAt.year, conv.updatedAt.month, conv.updatedAt.day);
    if (!d.isBefore(today)) {
      todayList.add(conv);
    } else if (!d.isBefore(yesterday)) {
      yesterdayList.add(conv);
    } else if (!d.isBefore(last7)) {
      weekList.add(conv);
    } else if (!d.isBefore(last30)) {
      monthList.add(conv);
    } else {
      olderList.add(conv);
    }
  }

  return [
    if (todayList.isNotEmpty) _ConversationGroup('Today', todayList),
    if (yesterdayList.isNotEmpty)
      _ConversationGroup('Yesterday', yesterdayList),
    if (weekList.isNotEmpty)
      _ConversationGroup('Previous 7 days', weekList),
    if (monthList.isNotEmpty)
      _ConversationGroup('Previous 30 days', monthList),
    if (olderList.isNotEmpty) _ConversationGroup('Older', olderList),
  ];
}

// ─── Row ────────────────────────────────────────────────────────────────

class _ConversationRow extends StatelessWidget {
  const _ConversationRow({
    required this.conversation,
    required this.isActive,
    required this.isRenaming,
    required this.renameController,
    required this.onTap,
    required this.onRename,
    required this.onDelete,
    required this.onRenameSubmit,
    required this.onRenameCancel,
  });

  final ConversationSummary conversation;
  final bool isActive;
  final bool isRenaming;
  final TextEditingController renameController;
  final VoidCallback onTap;
  final VoidCallback onRename;
  final VoidCallback onDelete;
  final void Function(String title) onRenameSubmit;
  final VoidCallback onRenameCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    if (isRenaming) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: renameController,
                autofocus: true,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.foreground,
                ),
                decoration: InputDecoration(
                  isDense: true,
                  filled: true,
                  fillColor: c.muted,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm + 2,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    borderSide: BorderSide(color: c.primary, width: 1),
                  ),
                ),
                onSubmitted: onRenameSubmit,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            IconButton(
              icon: Icon(Icons.check, size: 18, color: c.primary),
              splashRadius: 18,
              onPressed: () => onRenameSubmit(renameController.text),
            ),
            IconButton(
              icon: Icon(Icons.close, size: 18, color: c.mutedForeground),
              splashRadius: 18,
              onPressed: onRenameCancel,
            ),
          ],
        ),
      );
    }

    final bg = isActive ? c.muted : Colors.transparent;
    final titleColor = isActive ? c.primary : c.cardForeground;
    final titleWeight = isActive ? FontWeight.w600 : FontWeight.w500;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 2,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Ink(
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm + 2,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          conversation.displayTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            fontWeight: titleWeight,
                            color: titleColor,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _formatDate(conversation.updatedAt),
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.caption,
                            color: c.mutedForeground,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _RowMenu(
                    onRename: onRename,
                    onDelete: onDelete,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) {
      final m = diff.inMinutes;
      return '$m ${m == 1 ? 'minute' : 'minutes'} ago';
    }
    if (diff.inDays < 1) {
      final h = diff.inHours;
      return '$h ${h == 1 ? 'hour' : 'hours'} ago';
    }
    if (diff.inDays < 7) {
      final d = diff.inDays;
      return '$d ${d == 1 ? 'day' : 'days'} ago';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _RowMenu extends StatelessWidget {
  const _RowMenu({required this.onRename, required this.onDelete});

  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return PopupMenuButton<String>(
      tooltip: 'More',
      icon: Icon(Icons.more_horiz, size: 18, color: c.mutedForeground),
      padding: EdgeInsets.zero,
      splashRadius: 18,
      color: c.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: BorderSide(color: c.border, width: 1),
      ),
      onSelected: (value) {
        switch (value) {
          case 'rename':
            onRename();
          case 'delete':
            onDelete();
        }
      },
      itemBuilder: (ctx) => [
        PopupMenuItem(
          value: 'rename',
          height: 40,
          child: Row(
            children: [
              Icon(Icons.edit_outlined, size: 16, color: c.foreground),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Rename',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.foreground,
                ),
              ),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'delete',
          height: 40,
          child: Row(
            children: [
              Icon(Icons.delete_outline, size: 16, color: c.error),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Delete',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.error,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Empty / Error / Loading states ─────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.searching});

  final bool searching;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: c.muted,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Icon(
                searching
                    ? Icons.search_off
                    : Icons.chat_bubble_outline_rounded,
                size: 24,
                color: c.mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              searching ? 'No matches' : 'No conversations yet',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                fontWeight: FontWeight.w600,
                color: c.foreground,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              searching
                  ? 'Try a different search term'
                  : 'Start a new chat to see it here',
              textAlign: TextAlign.center,
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

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: c.error, size: 32),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Could not load conversations',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            AppButton(
              label: 'Retry',
              onPressed: onRetry,
              variant: AppButtonVariant.outline,
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationsLoading extends StatelessWidget {
  const _ConversationsLoading();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      itemCount: 8,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppShimmerBox(
                width: index.isEven ? 200 : 160,
                height: 14,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              const SizedBox(height: 6),
              const AppShimmerBox(
                width: 72,
                height: 10,
                borderRadius: BorderRadius.all(Radius.circular(AppRadius.sm)),
              ),
            ],
          ),
        );
      },
    );
  }
}
