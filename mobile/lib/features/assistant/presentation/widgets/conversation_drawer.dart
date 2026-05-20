import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
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
  ConsumerState<ConversationDrawer> createState() => _ConversationDrawerState();
}

class _ConversationDrawerState extends ConsumerState<ConversationDrawer> {
  String? _renamingId;
  final TextEditingController _renameController = TextEditingController();

  @override
  void dispose() {
    _renameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final conversations = ref.watch(conversationListProvider);

    return Drawer(
      backgroundColor: c.card,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Conversations',
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.titleSmall,
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _createNew(context),
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(
                      'New',
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Divider(color: c.border, height: 1),
            Expanded(
              child: conversations.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
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
                        TextButton(
                          onPressed: () =>
                              ref.invalidate(conversationListProvider),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return Center(
                      child: Text(
                        'No conversations yet',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          color: c.mutedForeground,
                        ),
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(conversationListProvider.notifier).refresh(),
                    child: ListView.builder(
                      itemCount: list.length,
                      itemBuilder: (ctx, i) => _ConversationRow(
                        conversation: list[i],
                        isRenaming: _renamingId == list[i].id,
                        renameController: _renameController,
                        onTap: () {
                          Navigator.of(context).maybePop();
                          widget.onConversationTap(list[i].id);
                        },
                        onRename: () => _startRename(list[i]),
                        onDelete: () => _confirmDelete(context, list[i]),
                        onRenameSubmit: (title) =>
                            _submitRename(list[i].id, title),
                        onRenameCancel: () => setState(() {
                          _renamingId = null;
                          _renameController.clear();
                        }),
                      ),
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
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete conversation'),
        content: Text('Are you sure you want to delete "${conv.displayTitle}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.colors(context).error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(conversationListProvider.notifier).delete(conv.id);
    }
  }
}

class _ConversationRow extends StatelessWidget {
  const _ConversationRow({
    required this.conversation,
    required this.isRenaming,
    required this.renameController,
    required this.onTap,
    required this.onRename,
    required this.onDelete,
    required this.onRenameSubmit,
    required this.onRenameCancel,
  });

  final ConversationSummary conversation;
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
          horizontal: AppSpacing.lg,
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
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                ),
                onSubmitted: onRenameSubmit,
              ),
            ),
            IconButton(
              icon: Icon(Icons.check, size: 18, color: c.primary),
              onPressed: () => onRenameSubmit(renameController.text),
            ),
            IconButton(
              icon: Icon(Icons.close, size: 18, color: c.mutedForeground),
              onPressed: onRenameCancel,
            ),
          ],
        ),
      );
    }

    return ListTile(
      title: Text(
        conversation.displayTitle,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: GoogleFonts.inter(
          fontSize: AppTypography.bodySmall,
          color: c.foreground,
        ),
      ),
      subtitle: Text(
        _formatDate(conversation.updatedAt),
        style: GoogleFonts.inter(
          fontSize: AppTypography.caption,
          color: c.mutedForeground,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(Icons.edit, size: 16, color: c.mutedForeground),
            tooltip: 'Rename',
            onPressed: onRename,
          ),
          IconButton(
            icon: Icon(Icons.delete_outline, size: 16, color: c.error),
            tooltip: 'Delete',
            onPressed: onDelete,
          ),
        ],
      ),
      onTap: onTap,
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
