import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../domain/lesson_models.dart';

class TextContentWidget extends StatelessWidget {
  const TextContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  Widget build(BuildContext context) {
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
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          if (content.translation != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                content.translation!,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
          if (content.notes != null) ...[
            const SizedBox(height: 16),
            Text(
              content.notes!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
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
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          if (widget.content.translation != null) ...[
            const SizedBox(height: 16),
            Text(
              widget.content.translation!,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 24),
          if (widget.content.audioUrl != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.play_arrow),
                    iconSize: 32,
                  ),
                  Expanded(
                    child: Slider(
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
              child: ActionChip(
                label: Text('${_speedPresets[_speedIndex]}x'),
                avatar: const Icon(Icons.speed, size: 18),
                onPressed: () {
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
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (content.imageUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: content.imageUrl!,
                placeholder: (_, __) => Shimmer.fromColors(
                  baseColor: theme.colorScheme.surfaceContainerHighest,
                  highlightColor: theme.colorScheme.surfaceContainerHigh,
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    color: Colors.white,
                  ),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.broken_image,
                    size: 48,
                    color: theme.colorScheme.onSurfaceVariant,
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
          if (content.translation != null) ...[
            const SizedBox(height: 8),
            Text(
              content.translation!,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
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
                borderRadius: BorderRadius.circular(12),
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
          if (widget.content.translation != null) ...[
            const SizedBox(height: 8),
            Text(
              widget.content.translation!,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class DialogueContentWidget extends StatelessWidget {
  const DialogueContentWidget({super.key, required this.content});
  final LessonContent content;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Dialogue',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  content.vietnameseText,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    height: 1.8,
                  ),
                ),
                if (content.translation != null) ...[
                  const SizedBox(height: 12),
                  Divider(color: theme.colorScheme.outlineVariant),
                  const SizedBox(height: 12),
                  Text(
                    content.translation!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      height: 1.6,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (content.audioUrl != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.headphones,
                      color: theme.colorScheme.onPrimaryContainer),
                  const SizedBox(width: 8),
                  Text(
                    'Listen to dialogue',
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(Icons.play_arrow,
                        color: theme.colorScheme.onPrimaryContainer),
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
