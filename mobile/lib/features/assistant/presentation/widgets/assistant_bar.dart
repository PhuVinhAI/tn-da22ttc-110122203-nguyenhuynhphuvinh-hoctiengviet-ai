import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../data/screen_context_provider.dart';
import 'assistant_question_sheet.dart';

/// Thin always-visible entry-point to the Trợ lý AI. Tapping it opens
/// the [AssistantQuestionSheet] in its Compose phase and drives the
/// state machine through the chat notifier; dismissing the sheet
/// collapses the state machine and drops the cached `conversationId`.
class AssistantBar extends ConsumerWidget {
  const AssistantBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final placeholder = ref.watch(
      currentScreenContextProvider.select((s) => s.barPlaceholder),
    );

    return Material(
      color: c.card,
      child: SafeArea(
        top: false,
        child: InkWell(
          onTap: () => _openSheet(context, ref),
          child: Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: c.border)),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.auto_awesome,
                  color: c.primary,
                  size: 20,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    placeholder,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: c.mutedForeground,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  Icons.keyboard_arrow_up,
                  color: c.mutedForeground,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openSheet(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(assistantChatNotifierProvider);
    notifier.openBar();
    AppBottomSheet.show<void>(
      context,
      isScrollControlled: true,
      builder: (ctx) => const AssistantQuestionSheet(),
    ).whenComplete(() {
      // Dismissed via backdrop, drag-down, or the "−" button. The state
      // machine collapses and the cached conversationId is dropped so the
      // next session starts a fresh Conversation.
      notifier.collapse();
    });
  }
}
