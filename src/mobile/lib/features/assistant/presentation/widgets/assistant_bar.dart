import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../application/assistant_chat_notifier.dart';
import '../../application/assistant_state_machine.dart';
import '../../data/screen_context_provider.dart';
import '../../data/screen_context_registry.dart';
import '../../domain/assistant_state.dart';
import 'assistant_question_sheet.dart';

/// Thin always-visible entry-point to the Trợ lý AI with inverted-U shape
/// (rounded top corners). Tapping it opens the [AssistantQuestionSheet] in
/// its Compose phase and drives the state machine through the chat notifier;
/// dismissing the sheet collapses the state machine and drops the cached
/// `conversationId`.
class AssistantBar extends ConsumerWidget {
  const AssistantBar({super.key, this.onOpen});

  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppTheme.colors(context);
    final placeholder = ref.watch(
      currentScreenContextProvider.select((s) => s.barPlaceholder),
    );
    final displayPlaceholder = placeholder == genericBarPlaceholder
        ? S.of(context).askAnythingHint
        : placeholder;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: c.card,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppRadius.xl),
          ),
          border: Border(
            top: BorderSide(color: c.border, width: 1),
            left: BorderSide(color: c.border, width: 1),
            right: BorderSide(color: c.border, width: 1),
          ),
        ),
        child: SafeArea(
          top: false,
          child: InkWell(
            onTap: () => _openSheet(context, ref),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              ),
              child: Row(
                children: [
                  Icon(Icons.auto_awesome, color: c.primary, size: 20),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      displayPlaceholder,
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
      ),
    );
  }

  void _openSheet(BuildContext context, WidgetRef ref) {
    // Guard: if the state machine is not Collapsed the sheet is already open
    // (or opening). Bail early to prevent multiple sheets stacking on rapid
    // taps. openBar() inside the notifier is idempotent on its own, but
    // AppBottomSheet.show must also be skipped.
    final state = ref.read(assistantStateMachineProvider);
    if (state is! AssistantCollapsed) return;

    onOpen?.call();
    final notifier = ref.read(assistantChatNotifierProvider);
    notifier.openBar();
    final navKey = ref.read(rootNavigatorKeyProvider);
    final sheetContext = navKey.currentContext ?? context;
    AppBottomSheet.show<void>(
      sheetContext,
      isScrollControlled: true,
      builder: (ctx) => const AssistantQuestionSheet(),
    ).whenComplete(() {
      // Delay collapse to let the sheet dismiss animation complete
      Future.delayed(const Duration(milliseconds: 100), () {
        notifier.collapse();
      });
    });
  }
}
