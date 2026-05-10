import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/lesson_models.dart';
import '../../data/lesson_providers.dart';

class VocabularyStepWidget extends ConsumerWidget {
  const VocabularyStepWidget({
    super.key,
    required this.vocabularies,
    required this.lessonId,
  });
  final List<LessonVocabulary> vocabularies;
  final String lessonId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (vocabularies.isEmpty) {
      return const Center(child: Text('No vocabulary for this lesson'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vocabularies.length,
      itemBuilder: (context, index) {
        return _VocabularyCard(
          vocabulary: vocabularies[index],
          onLearn: () => _learnWord(ref, vocabularies[index].id),
        );
      },
    );
  }

  Future<void> _learnWord(WidgetRef ref, String vocabularyId) async {
    final repo = ref.read(lessonRepositoryProvider);
    await repo.learnVocabulary(vocabularyId);
  }
}

class _VocabularyCard extends StatefulWidget {
  const _VocabularyCard({required this.vocabulary, required this.onLearn});
  final LessonVocabulary vocabulary;
  final VoidCallback onLearn;

  @override
  State<_VocabularyCard> createState() => _VocabularyCardState();
}

class _VocabularyCardState extends State<_VocabularyCard> {
  bool _learned = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final vocab = widget.vocabulary;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        vocab.word,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (vocab.phonetic != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          vocab.phonetic!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                FilledButton.tonal(
                  onPressed: _learned
                      ? null
                      : () {
                          widget.onLearn();
                          setState(() => _learned = true);
                        },
                  child: Text(_learned ? 'Learned' : 'Learn'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              vocab.translation,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                if (vocab.partOfSpeech != null)
                  Chip(
                    label: Text(vocab.partOfSpeech!),
                    visualDensity: VisualDensity.compact,
                    labelStyle: theme.textTheme.labelSmall,
                  ),
                if (vocab.classifier != null)
                  Chip(
                    label: Text('CL: ${vocab.classifier}'),
                    visualDensity: VisualDensity.compact,
                    labelStyle: theme.textTheme.labelSmall,
                  ),
              ],
            ),
            if (vocab.dialectVariants != null &&
                vocab.dialectVariants!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Dialect variants:',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                children: vocab.dialectVariants!.entries.map((e) {
                  return Chip(
                    label: Text('${e.key}: ${e.value}'),
                    visualDensity: VisualDensity.compact,
                    labelStyle: theme.textTheme.labelSmall,
                  );
                }).toList(),
              ),
            ],
            if (vocab.exampleSentence != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      vocab.exampleSentence!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (vocab.exampleTranslation != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        vocab.exampleTranslation!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
