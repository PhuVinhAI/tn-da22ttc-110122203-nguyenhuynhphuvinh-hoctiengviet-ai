import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/widgets/widgets.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/image_discovery_notifier.dart';
import '../../domain/image_analysis_models.dart';

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

  Future<void> _send([String? prompt]) async {
    final text = (prompt ?? _inputController.text).trim();
    if (text.isEmpty) return;
    if (prompt == null) _inputController.clear();
    await ref.read(imageDiscoveryProvider.notifier).sendPrompt(text);
    _scrollToBottom();
  }

  Future<void> _sendQuickAction(String prompt) async {
    _inputController.text = prompt;
    _inputController.selection = TextSelection.collapsed(
      offset: _inputController.text.length,
    );
    await _send(prompt);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(imageDiscoveryProvider);
    final c = AppTheme.colors(context);

    ref.listen(imageDiscoveryProvider, (previous, next) {
      if (previous?.messages.length != next.messages.length ||
          previous?.isLoading != next.isLoading) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(title: const Text('Image Discovery')),
      body: SafeArea(
        top: false,
        bottom: false,
        child: Column(
          children: [
            _ImageActions(
              isLoading: state.isLoading,
              onCamera: () => _pick(ImageSource.camera),
              onGallery: () => _pick(ImageSource.gallery),
              canAddImages: state.canAddImages,
            ),
            if (state.images.isNotEmpty)
              _ImageGrid(
                images: state.images,
                onRemove: (id) => ref
                    .read(imageDiscoveryProvider.notifier)
                    .removeImage(id),
              )
            else
              Divider(color: c.border, height: 1),
            Expanded(
              child: _MessageList(
                state: state,
                scrollController: _scrollController,
              ),
            ),
            if (state.error != null) _ErrorBanner(message: state.error!),
            _QuickActions(
              enabled: state.hasImage && !state.isLoading,
              onPrompt: _sendQuickAction,
            ),
            _ComposeBar(
              controller: _inputController,
              focusNode: _focusNode,
              enabled: !state.isLoading,
              onSend: () => unawaited(_send()),
            ),
          ],
        ),
      ),
    );
  }
}

class _ImageActions extends StatelessWidget {
  const _ImageActions({
    required this.isLoading,
    required this.onCamera,
    required this.onGallery,
    required this.canAddImages,
  });

  final bool isLoading;
  final VoidCallback onCamera;
  final VoidCallback onGallery;
  final bool canAddImages;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: AppButton(
              variant: AppButtonVariant.secondary,
              icon: const Icon(Icons.camera_alt_outlined),
              label: 'Take Photo',
              onPressed: isLoading || !canAddImages ? null : onCamera,
              padding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: AppButton(
              variant: AppButtonVariant.secondary,
              icon: const Icon(Icons.image_outlined),
              label: 'Upload',
              onPressed: isLoading || !canAddImages ? null : onGallery,
              padding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageGrid extends StatelessWidget {
  const _ImageGrid({required this.images, required this.onRemove});

  final List<ImageDiscoveryImage> images;
  final ValueChanged<String> onRemove;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: GridView.builder(
        key: const ValueKey('image_discovery_image_grid'),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: images.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing: AppSpacing.sm,
          childAspectRatio: 1,
        ),
        itemBuilder: (context, index) {
          final image = images[index];

          return ClipRRect(
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
                      tooltip: 'Remove image',
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
          );
        },
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
    if (state.messages.isEmpty && !state.isLoading) {
      return const _EmptyImageDiscoveryState();
    }

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

class _EmptyImageDiscoveryState extends StatelessWidget {
  const _EmptyImageDiscoveryState();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Icon(
        Icons.photo_camera_outlined,
        size: 72,
        color: c.mutedForeground.withValues(alpha: 0.6),
      ),
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

class _AssistantMessage extends StatelessWidget {
  const _AssistantMessage({required this.message});

  final ImageDiscoveryMessage message;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MarkdownBody(data: message.text, selectable: true),
        if (message.vocabularies.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          ...message.vocabularies.map(
            (vocabulary) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _VocabularyCard(vocabulary: vocabulary),
            ),
          ),
        ],
      ],
    );
  }
}

class _VocabularyCard extends StatelessWidget {
  const _VocabularyCard({required this.vocabulary});

  final ImageAnalysisVocabulary vocabulary;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: c.border),
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, size: 18, color: c.primary),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  vocabulary.word,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (vocabulary.partOfSpeech != null)
                AppChip(
                  label: vocabulary.partOfSpeech!,
                  fontSize: AppTypography.caption,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 4,
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            vocabulary.translation,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: c.mutedForeground,
            ),
          ),
          if (vocabulary.phonetic != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              '/${vocabulary.phonetic}/',
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
          if (vocabulary.classifier != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Classifier: ${vocabulary.classifier}',
              style: theme.textTheme.bodySmall,
            ),
          ],
          if (vocabulary.exampleSentence != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              vocabulary.exampleSentence!,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontStyle: FontStyle.italic,
              ),
            ),
            if (vocabulary.exampleTranslation != null)
              Text(
                vocabulary.exampleTranslation!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.mutedForeground,
                ),
              ),
          ],
        ],
      ),
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
            'Analyzing image...',
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

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: c.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: c.error.withValues(alpha: 0.24)),
        ),
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: c.error, size: 18),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                message,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodySmall,
                  color: c.error,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.enabled, required this.onPrompt});

  final bool enabled;
  final Future<void> Function(String prompt) onPrompt;

  static const _actions = <({String label, String prompt})>[
    (
      label: 'Phân tích ảnh',
      prompt: 'Analyze these images and explain what they show.',
    ),
    (
      label: 'Tìm từ vựng',
      prompt: 'Find useful Vietnamese vocabulary in these images.',
    ),
    (
      label: 'Dịch text',
      prompt: 'Translate any visible Vietnamese text in these images.',
    ),
    (
      label: 'Giải thích nội dung',
      prompt: 'Explain the context and meaning of these images.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
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
        children: _actions
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
    required this.enabled,
    required this.onSend,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.sm,
      ),
      child: AppChatComposeField(
        controller: controller,
        focusNode: focusNode,
        hintText: enabled ? 'Ask about the image...' : 'Analyzing...',
        enabled: enabled,
        onSend: enabled ? onSend : null,
        onSubmitted: enabled ? (_) => onSend() : null,
      ),
    );
  }
}
