import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/widgets/widgets.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../../application/image_discovery_notifier.dart';
import '../../domain/image_analysis_models.dart';
import '../widgets/vocabulary_card.dart';

class ImageDiscoveryScreen extends ConsumerStatefulWidget {
  const ImageDiscoveryScreen({super.key});

  @override
  ConsumerState<ImageDiscoveryScreen> createState() =>
      _ImageDiscoveryScreenState();
}

class _ImageDiscoveryScreenState extends ConsumerState<ImageDiscoveryScreen> {
  final _inputController = TextEditingController();
  final _focusNode = FocusNode();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _inputController.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _pick(ImageSource source) async {
    await ref.read(imageDiscoveryProvider.notifier).pickImage(source);
  }

  void _openAddImageSheet() {
    AppMenuBottomSheet.show(
      context,
      title: S.of(context).addPhotoTitle,
      items: [
        AppMenuBottomSheetItem(
          label: S.of(context).takePhotoOption,
          icon: Icons.camera_alt_outlined,
          onTap: () => unawaited(_pick(ImageSource.camera)),
        ),
        AppMenuBottomSheetItem(
          label: S.of(context).uploadFromLibraryOption,
          icon: Icons.image_outlined,
          onTap: () => unawaited(_pick(ImageSource.gallery)),
        ),
      ],
    );
  }

  Future<void> _send([String? prompt]) async {
    final text = (prompt ?? _inputController.text).trim();
    if (text.isEmpty) return;
    if (!ref.read(imageDiscoveryProvider).hasImage) return;
    if (prompt == null) _inputController.clear();
    await ref.read(imageDiscoveryProvider.notifier).sendPrompt(text);
    _scrollToBottom();
  }

  void _resetSession() {
    _inputController.clear();
    _focusNode.unfocus();
    ref.read(imageDiscoveryProvider.notifier).reset();
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  bool _canReset(ImageDiscoveryState state) =>
      state.hasImage || state.messages.isNotEmpty || state.error != null;

  void _openImagesViewer(List<ImageDiscoveryImage> images) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _ImagesViewerScreen(images: images),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(imageDiscoveryProvider);
    final c = AppTheme.colors(context);
    final preSend = state.messages.isEmpty;
    final showImageStrip = preSend && state.hasImage;
    final showCenteredPlaceholder = preSend && !state.hasImage;
    final showHeaderImagesIcon = !preSend && state.hasImage;

    ref.listen(imageDiscoveryProvider, (previous, next) {
      if (previous?.messages.length != next.messages.length ||
          previous?.isLoading != next.isLoading) {
        _scrollToBottom();
      }
      // Restore text when stopped (no error) or on error
      if (previous?.isLoading == true && !next.isLoading) {
        final failed = next.failedOutboundContent;
        if (failed != null && failed.isNotEmpty) {
          _inputController.text = failed;
          _inputController.selection =
              TextSelection.collapsed(offset: failed.length);
          _focusNode.requestFocus();
        }
      }
      if (next.error != null && next.error != previous?.error) {
        final localizedMsg = switch (next.error!) {
          ImageDiscoveryError.unableToLoadImage => S.of(context).unableToLoadImage,
          ImageDiscoveryError.maxImagesReached => S.of(context).maxImagesAnalysisWarning,
          ImageDiscoveryError.addPhotoFirst => S.of(context).addPhotoFirst,
          ImageDiscoveryError.unableToAnalyzeImage => S.of(context).unableToAnalyzeImage,
          ImageDiscoveryError.unableToSaveVocabulary => S.of(context).unableToSaveVocabulary,
        };
        AppToast.show(
          context,
          message: localizedMsg,
          type: AppToastType.error,
        );
      }
    });

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Text(S.of(context).imageDiscoveryTitle),
        actions: [
          if (showHeaderImagesIcon)
            _HeaderImagesAction(
              count: state.images.length,
              onTap: () => _openImagesViewer(state.images),
            ),
          if (_canReset(state))
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: S.of(context).resetSessionButton,
              onPressed: _resetSession,
            ),
        ],
      ),
      body: SafeArea(
        top: false,
        bottom: false,
        child: Column(
          children: [
            if (showImageStrip)
              _ImageStrip(
                images: state.images,
                canAddImages: state.canAddImages,
                isLoading: state.isLoading,
                onAdd: _openAddImageSheet,
                onRemove: (id) =>
                    ref.read(imageDiscoveryProvider.notifier).removeImage(id),
              )
            else if (!showCenteredPlaceholder)
              Divider(color: c.border, height: 1),
            Expanded(
              child: showCenteredPlaceholder
                  ? _CenteredPlaceholder(
                      enabled: !state.isLoading,
                      onTap: _openAddImageSheet,
                    )
                  : _MessageList(
                      state: state,
                      scrollController: _scrollController,
                    ),
            ),
            if (showImageStrip)
              _QuickActions(
                enabled: !state.isLoading,
                onPrompt: _send,
              ),
            _ComposeBar(
              controller: _inputController,
              focusNode: _focusNode,
              isLoading: state.isLoading,
              hasImage: state.hasImage,
              onSend: () => unawaited(_send()),
              onStop: () =>
                  ref.read(imageDiscoveryProvider.notifier).cancelAnalysis(),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderImagesAction extends StatelessWidget {
  const _HeaderImagesAction({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return IconButton(
      tooltip: S.of(context).viewAttachedPhotosParam(count.toString()),
      onPressed: onTap,
      icon: SizedBox(
        width: 28,
        height: 24,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Positioned(
              left: 0,
              top: 0,
              child: Icon(Icons.photo_library_outlined),
            ),
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                constraints: const BoxConstraints(
                  minWidth: 16,
                  minHeight: 16,
                ),
                decoration: BoxDecoration(
                  color: c.primary,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: c.background, width: 1.5),
                ),
                alignment: Alignment.center,
                child: Text(
                  '$count',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: c.primaryForeground,
                    height: 1.1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CenteredPlaceholder extends StatelessWidget {
  const _CenteredPlaceholder({required this.enabled, required this.onTap});

  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: GestureDetector(
          onTap: enabled ? onTap : null,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: c.muted.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1.5),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_rounded, size: 56, color: c.mutedForeground),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  S.of(context).addPhotoTitle,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.mutedForeground,
                    fontWeight: FontWeight.w500,
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

class _ImageStrip extends StatelessWidget {
  const _ImageStrip({
    required this.images,
    required this.canAddImages,
    required this.isLoading,
    required this.onAdd,
    required this.onRemove,
  });

  static const _thumbnailSize = 96.0;

  final List<ImageDiscoveryImage> images;
  final bool canAddImages;
  final bool isLoading;
  final VoidCallback onAdd;
  final ValueChanged<String> onRemove;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final itemCount = images.length + (canAddImages ? 1 : 0);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: SizedBox(
        height: _thumbnailSize,
        child: ListView.separated(
          key: const ValueKey('image_discovery_image_strip'),
          scrollDirection: Axis.horizontal,
          itemCount: itemCount,
          separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (context, index) {
            if (index >= images.length) {
              return _AddTile(
                size: _thumbnailSize,
                enabled: !isLoading,
                onTap: onAdd,
              );
            }

            final image = images[index];

            return SizedBox(
              width: _thumbnailSize,
              height: _thumbnailSize,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.memory(image.bytes, fit: BoxFit.cover),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: c.card.withValues(alpha: 0.88),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: Icon(Icons.close, color: c.foreground),
                          tooltip: S.of(context).removeImage,
                          iconSize: 18,
                          constraints: const BoxConstraints.tightFor(
                            width: 32,
                            height: 32,
                          ),
                          padding: EdgeInsets.zero,
                          onPressed: () => onRemove(image.id),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _AddTile extends StatelessWidget {
  const _AddTile({
    required this.size,
    required this.enabled,
    required this.onTap,
  });

  final double size;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: c.muted.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: c.border, width: 1.5),
        ),
        child: Icon(Icons.add_rounded, size: 32, color: c.mutedForeground),
      ),
    );
  }
}

class _MessageList extends StatelessWidget {
  const _MessageList({required this.state, required this.scrollController});

  final ImageDiscoveryState state;
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      itemCount: state.messages.length + (state.isLoading ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == state.messages.length && state.isLoading) {
          return const _LoadingMessage();
        }

        return _MessageBubble(message: state.messages[index]);
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ImageDiscoveryMessage message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final isUser = message.isUser;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: isUser
            ? BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78)
            : const BoxConstraints(),
        width: isUser ? null : double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: isUser
            ? const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              )
            : EdgeInsets.zero,
        decoration: isUser
            ? BoxDecoration(
                color: c.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.lg),
              )
            : null,
        child: isUser
            ? Text(
                message.text,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  color: c.foreground,
                ),
              )
            : _AssistantMessage(message: message),
      ),
    );
  }
}

class _AssistantMessage extends ConsumerWidget {
  const _AssistantMessage({required this.message});

  final ImageDiscoveryMessage message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MarkdownBody(data: message.text, selectable: true),
        if (message.vocabularies.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          ...message.vocabularies.map(
            (vocabulary) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: VocabularyCard(
                vocabulary: vocabulary,
                onAdd: (vocabulary) => ref
                    .read(imageDiscoveryProvider.notifier)
                    .addVocabularyFromAnalysis(vocabulary),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _LoadingMessage extends StatelessWidget {
  const _LoadingMessage();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          const AppSpinner(size: 18),
          const SizedBox(width: AppSpacing.sm),
          Text(
            S.of(context).imageDiscoveryTitle,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.enabled, required this.onPrompt});

  final bool enabled;
  final Future<void> Function(String prompt) onPrompt;

  @override
  Widget build(BuildContext context) {
    final actions = <({String label, String prompt})>[
      (
        label: S.of(context).analyzeImage,
        prompt: S.of(context).analyzeImagesPrompt,
      ),
      (
        label: S.of(context).findVocabulary,
        prompt: S.of(context).findVocabularyPrompt,
      ),
      (
        label: S.of(context).translateText,
        prompt: S.of(context).translateTextPrompt,
      ),
      (
        label: S.of(context).explainContent,
        prompt: S.of(context).explainContextPrompt,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        0,
      ),
      child: Wrap(
        spacing: AppSpacing.sm,
        runSpacing: AppSpacing.sm,
        children: actions
            .map(
              (action) => AppChip(
                label: action.label,
                onTap: enabled
                    ? () => unawaited(onPrompt(action.prompt))
                    : null,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _ComposeBar extends StatelessWidget {
  const _ComposeBar({
    required this.controller,
    required this.focusNode,
    required this.isLoading,
    required this.hasImage,
    required this.onSend,
    required this.onStop,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isLoading;
  final bool hasImage;
  final VoidCallback onSend;
  final VoidCallback onStop;

  bool get canSend => hasImage && !isLoading;

  String _getHintText(BuildContext context) {
    if (isLoading) return S.of(context).analyzingStatus;
    if (!hasImage) return S.of(context).addPhotoFirst;
    return S.of(context).askAboutImageHint;
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.sm,
      ),
      child: isLoading
          ? Container(
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
                      _getHintText(context),
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
            )
          : AppChatComposeField(
              controller: controller,
              focusNode: focusNode,
              hintText: _getHintText(context),
              enabled: !isLoading,
              onSend: canSend ? onSend : null,
              onSubmitted: canSend ? (_) => onSend() : null,
            ),
    );
  }
}

class _ImagesViewerScreen extends StatelessWidget {
  const _ImagesViewerScreen({required this.images});

  final List<ImageDiscoveryImage> images;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${S.of(context).attachedPhotosTitle} (${images.length})')),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.lg),
          itemCount: images.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) {
            final image = images[index];
            return ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: Image.memory(image.bytes, fit: BoxFit.cover),
            );
          },
        ),
      ),
    );
  }
}
