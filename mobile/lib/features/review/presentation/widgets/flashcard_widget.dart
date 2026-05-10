import 'package:flutter/material.dart';
import '../../domain/review_models.dart';

class FlashcardWidget extends StatefulWidget {
  const FlashcardWidget({
    super.key,
    required this.vocabulary,
    required this.onFlip,
    this.onAudioPlay,
  });

  final Vocabulary vocabulary;
  final VoidCallback onFlip;
  final VoidCallback? onAudioPlay;

  @override
  State<FlashcardWidget> createState() => _FlashcardWidgetState();
}

class _FlashcardWidgetState extends State<FlashcardWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _isFront = true;
  bool _reduceMotion = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reduceMotion = MediaQuery.of(context).disableAnimations;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _flip() {
    if (_reduceMotion) {
      setState(() {
        _isFront = !_isFront;
      });
      widget.onFlip();
      return;
    }

    if (_isFront) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
    setState(() {
      _isFront = !_isFront;
    });
    widget.onFlip();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _flip,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final angle = _controller.value * 3.14159;
          return Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001)
              ..rotateY(angle),
            child: angle < 3.14159 / 2
                ? _buildFront()
                : Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()..rotateY(3.14159),
                    child: _buildBack(),
                  ),
          );
        },
      ),
    );
  }

  Widget _buildFront() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 8,
      child: Semantics(
        label: 'Flashcard front: ${widget.vocabulary.word}',
        hint: 'Tap to reveal translation',
        button: true,
        child: Container(
          width: double.infinity,
          height: 300,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.vocabulary.word,
                style: theme.textTheme.headlineLarge,
                textAlign: TextAlign.center,
              ),
              if (widget.vocabulary.phonetic != null) ...[
                const SizedBox(height: 8),
                Text(
                  '/${widget.vocabulary.phonetic}/',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
              if (widget.vocabulary.audioUrl != null) ...[
                const SizedBox(height: 16),
                Semantics(
                  label: 'Play pronunciation audio',
                  button: true,
                  child: IconButton(
                    icon: Icon(
                      Icons.volume_up,
                      size: 32,
                      color: colorScheme.primary,
                    ),
                    onPressed: widget.onAudioPlay,
                    tooltip: 'Play pronunciation',
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Text(
                'Tap to flip',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBack() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 8,
      child: Semantics(
        label: 'Flashcard back: ${widget.vocabulary.translation}',
        hint: 'Tap to flip back',
        button: true,
        child: Container(
          width: double.infinity,
          height: 300,
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.vocabulary.translation,
                  style: theme.textTheme.headlineSmall,
                ),
                if (widget.vocabulary.partOfSpeech != null) ...[
                  const SizedBox(height: 8),
                  Semantics(
                    label: 'Part of speech: ${widget.vocabulary.partOfSpeech}',
                    child: Chip(
                      label: Text(widget.vocabulary.partOfSpeech!),
                      backgroundColor: colorScheme.primaryContainer,
                      labelStyle: TextStyle(color: colorScheme.onPrimaryContainer),
                    ),
                  ),
                ],
                if (widget.vocabulary.classifier != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Classifier: ${widget.vocabulary.classifier}',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
                if (widget.vocabulary.exampleSentence != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Example:',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.vocabulary.exampleSentence!,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  if (widget.vocabulary.exampleTranslation != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      widget.vocabulary.exampleTranslation!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
