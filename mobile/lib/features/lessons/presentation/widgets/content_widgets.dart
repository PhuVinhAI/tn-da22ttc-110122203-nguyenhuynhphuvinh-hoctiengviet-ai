import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../domain/lesson_models.dart';

class TextContentWidget extends StatelessWidget {
  const TextContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            content.vietnameseText,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.6,
            ),
          ),
          if (content.phonetic != null) ...[
            const SizedBox(height: 8),
            Text(
              content.phonetic!,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: c.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          if (content.translation != null)
            _ContentTranslation(text: content.translation!),
          if (content.notes != null) ...[
            const SizedBox(height: 16),
            Text(
              content.notes!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class AudioContentWidget extends StatefulWidget {
  const AudioContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  State<AudioContentWidget> createState() => _AudioContentWidgetState();
}

class _AudioContentWidgetState extends State<AudioContentWidget> {
  static const _speedPresets = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  int _speedIndex = 2;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.content.vietnameseText,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.6,
            ),
          ),
          if (widget.content.phonetic != null) ...[
            const SizedBox(height: 8),
            Text(
              widget.content.phonetic!,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: c.mutedForeground,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          if (widget.content.translation != null)
            _ContentTranslation(text: widget.content.translation!),
          const SizedBox(height: 24),
          if (widget.content.audioUrl != null) ...[
            AppCard(
              variant: AppCardVariant.muted,
              padding: const EdgeInsets.all(AppSpacing.lg),
              borderRadius: AppRadius.lg,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.play_arrow),
                    iconSize: 32,
                  ),
                  Expanded(
                    child: AppSlider(
                      value: 0,
                      onChanged: (v) {},
                    ),
                  ),
                  const Text('0:00'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: AppChip(
                label: '${_speedPresets[_speedIndex]}x',
                onTap: () {
                  setState(() {
                    _speedIndex = (_speedIndex + 1) % _speedPresets.length;
                  });
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class ImageContentWidget extends StatelessWidget {
  const ImageContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (content.imageUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              child: CachedNetworkImage(
                imageUrl: content.imageUrl!,
                placeholder: (_, _) => Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    color: c.card,
                  ),
                ),
                errorWidget: (_, _, _) => AppCard(
                  variant: AppCardVariant.muted,
                  borderRadius: AppRadius.lg,
                  child: SizedBox(
                    height: 200,
                    width: double.infinity,
                    child: Icon(
                      Icons.broken_image,
                      size: 48,
                      color: c.mutedForeground,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Text(
            content.vietnameseText,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.6,
            ),
          ),
          if (content.translation != null)
            _ContentTranslation(text: content.translation!, topSpacing: 8),
        ],
      ),
    );
  }
}

class VideoContentWidget extends StatefulWidget {
  const VideoContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  State<VideoContentWidget> createState() => _VideoContentWidgetState();
}

class _VideoContentWidgetState extends State<VideoContentWidget> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.content.videoUrl != null) ...[
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: const Center(
                child: Icon(Icons.play_circle_fill,
                    size: 64, color: Colors.white70),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Text(
            widget.content.vietnameseText,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.6,
            ),
          ),
          if (widget.content.translation != null)
            _ContentTranslation(
              text: widget.content.translation!,
              topSpacing: 8,
            ),
        ],
      ),
    );
  }
}

class DialogueContentWidget extends StatelessWidget {
  const DialogueContentWidget({super.key, required this.content});
  final LessonContent content;

  List<_DialogueLine> _parseLines() {
    final viLines = content.vietnameseText.split('\n');
    final trLines =
        content.translation?.split('\n') ?? List.filled(viLines.length, '');

    final lines = <_DialogueLine>[];
    for (var i = 0; i < viLines.length; i++) {
      final vi = viLines[i].trim();
      if (vi.isEmpty) continue;
      final tr = i < trLines.length ? trLines[i].trim() : '';
      final isSpeaker1 = lines.length.isEven;
      lines.add(_DialogueLine(
        vietnamese: vi,
        translation: tr.isNotEmpty ? tr : null,
        isSpeaker1: isSpeaker1,
      ));
    }
    return lines;
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final lines = _parseLines();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline, size: 20, color: c.primary),
              const SizedBox(width: 8),
              Text(
                'Dialogue',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: c.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...lines.map((line) => _ChatBubble(line: line)),
          if (content.audioUrl != null) ...[
            const SizedBox(height: 16),
            AppCard(
              variant: AppCardVariant.muted,
              padding: const EdgeInsets.all(AppSpacing.md),
              borderRadius: AppRadius.md,
              child: Row(
                children: [
                  Icon(Icons.headphones, color: c.foreground),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Listen to dialogue',
                    style: TextStyle(color: c.foreground),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(Icons.play_arrow, color: c.foreground),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DialogueLine {
  const _DialogueLine({
    required this.vietnamese,
    this.translation,
    required this.isSpeaker1,
  });

  final String vietnamese;
  final String? translation;
  final bool isSpeaker1;
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.line});
  final _DialogueLine line;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final isLeft = line.isSpeaker1;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: isLeft ? Alignment.centerLeft : Alignment.centerRight,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.78,
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            decoration: BoxDecoration(
              color: isLeft ? c.card : c.primary,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(AppRadius.lg),
                topRight: const Radius.circular(AppRadius.lg),
                bottomLeft:
                    isLeft ? const Radius.circular(2) : const Radius.circular(AppRadius.lg),
                bottomRight:
                    isLeft ? const Radius.circular(AppRadius.lg) : const Radius.circular(2),
              ),
              border: isLeft
                  ? Border.all(color: c.border, width: 1)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.vietnamese,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                    color: isLeft ? c.foreground : c.primaryForeground,
                  ),
                ),
                if (line.translation != null && line.translation!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    line.translation!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isLeft
                          ? c.mutedForeground
                          : c.primaryForeground.withValues(alpha: 0.8),
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// English translation line below Vietnamese lesson content (no card chrome).
class _ContentTranslation extends StatelessWidget {
  const _ContentTranslation({
    required this.text,
    this.topSpacing = 12,
  });

  final String text;
  final double topSpacing;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.only(top: topSpacing),
      child: Text(
        text,
        style: theme.textTheme.bodyLarge?.copyWith(
          color: c.mutedForeground,
          height: 1.5,
        ),
      ),
    );
  }
}
