import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class TranslationRenderer extends ExerciseRenderer {
  const TranslationRenderer();

  @override
  ExerciseType get type => ExerciseType.translation;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    return answer is String && answer.trim().isNotEmpty;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'translation': (answer as String).trim()};
  }

  @override
  Widget buildQuestion(Exercise exercise, BuildContext context) {
    return Text(
      exercise.question,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }

  @override
  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = exercise.options as TranslationOptions;
    return _TranslationInput(
      exercise: exercise,
      options: options,
      currentAnswer: currentAnswer as String?,
      onAnswerChanged: onAnswerChanged,
    );
  }
}

class _TranslationInput extends StatefulWidget {
  const _TranslationInput({
    required this.exercise,
    required this.options,
    required this.currentAnswer,
    required this.onAnswerChanged,
  });

  final Exercise exercise;
  final TranslationOptions options;
  final String? currentAnswer;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_TranslationInput> createState() => _TranslationInputState();
}

class _TranslationInputState extends State<_TranslationInput> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.currentAnswer ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _languageLabel(String code) {
    return switch (code.toLowerCase()) {
      'vi' || 'vietnamese' => 'Tiếng Việt',
      'en' || 'english' => 'English',
      'fr' || 'french' => 'Français',
      'ja' || 'japanese' => '日本語',
      'ko' || 'korean' => '한국어',
      'zh' || 'chinese' => '中文',
      _ => code.isNotEmpty ? code : '?',
    };
  }

  String _languageShort(String code) {
    return switch (code.toLowerCase()) {
      'vi' || 'vietnamese' => 'VI',
      'en' || 'english' => 'EN',
      'fr' || 'french' => 'FR',
      'ja' || 'japanese' => 'JA',
      'ko' || 'korean' => 'KO',
      'zh' || 'chinese' => 'ZH',
      _ => code.isNotEmpty ? code.substring(0, 2).toUpperCase() : '??',
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final visuals = getExerciseVisuals(context, ExerciseType.translation);
    final theme = Theme.of(context);

    final srcLang = widget.options.sourceLanguage;
    final tgtLang = widget.options.targetLanguage;
    final hasBothLanguages = srcLang.isNotEmpty && tgtLang.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Language direction header
        if (hasBothLanguages)
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: visuals.surface,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(
                color: visuals.accent.withValues(alpha: 0.20),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Source language badge
                _LanguageBadge(
                  code: _languageShort(srcLang),
                  label: _languageLabel(srcLang),
                  color: visuals.accent,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Icon(
                    Icons.arrow_forward_rounded,
                    size: 18,
                    color: visuals.accent,
                  ),
                ),
                // Target language badge
                _LanguageBadge(
                  code: _languageShort(tgtLang),
                  label: _languageLabel(tgtLang),
                  color: visuals.accent,
                ),
              ],
            ),
          ),
        if (hasBothLanguages) const SizedBox(height: AppSpacing.lg),

        // Source text card
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: visuals.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.15),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (srcLang.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm + 2,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: visuals.accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                      child: Text(
                        _languageShort(srcLang),
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.caption,
                          fontWeight: FontWeight.w700,
                          color: visuals.accent,
                        ),
                      ),
                    ),
                  if (srcLang.isNotEmpty) const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Source text',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: visuals.accent.withValues(alpha: 0.7),
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              // Vietnamese text uses vnStyle, otherwise standard
              Text(
                widget.exercise.question,
                style: srcLang.toLowerCase() == 'vi' ||
                        srcLang.toLowerCase() == 'vietnamese'
                    ? AppTheme.vnStyle(
                        fontSize: AppTypography.titleSmall,
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                        height: 1.5,
                      )
                    : theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: c.foreground,
                        height: 1.5,
                      ),
              ),
            ],
          ),
        ),

        // Direction arrow
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Center(
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: visuals.accent.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.arrow_downward_rounded,
                size: 20,
                color: visuals.accent,
              ),
            ),
          ),
        ),

        // Translation input area
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.25),
              width: 1.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Target language label
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm + 2,
                ),
                decoration: BoxDecoration(
                  color: visuals.accent.withValues(alpha: 0.06),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppRadius.lg - 1),
                    topRight: Radius.circular(AppRadius.lg - 1),
                  ),
                ),
                child: Row(
                  children: [
                    if (tgtLang.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm + 2,
                          vertical: AppSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: visuals.accent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Text(
                          _languageShort(tgtLang),
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.caption,
                            fontWeight: FontWeight.w700,
                            color: visuals.accent,
                          ),
                        ),
                      ),
                    if (tgtLang.isNotEmpty) const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Your translation',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: visuals.accent.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Spacer(),
                    // Character count
                    Text(
                      '${_controller.text.length}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: c.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
              // Text input
              TextFormField(
                controller: _controller,
                onChanged: (value) {
                  widget.onAnswerChanged(value);
                  setState(() {}); // Update character count
                },
                maxLines: 4,
                minLines: 3,
                style: tgtLang.toLowerCase() == 'vi' ||
                        tgtLang.toLowerCase() == 'vietnamese'
                    ? AppTheme.vnStyle(
                        fontSize: AppTypography.bodyLarge,
                        fontWeight: FontWeight.w500,
                        color: c.foreground,
                        height: 1.6,
                      )
                    : GoogleFonts.inter(
                        fontSize: AppTypography.bodyLarge,
                        fontWeight: FontWeight.w500,
                        color: c.foreground,
                        height: 1.6,
                      ),
                decoration: InputDecoration(
                  hintText: 'Type your translation here...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.mutedForeground.withValues(alpha: 0.5),
                    fontStyle: FontStyle.italic,
                  ),
                  filled: false,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.all(AppSpacing.lg),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LanguageBadge extends StatelessWidget {
  const _LanguageBadge({
    required this.code,
    required this.label,
    required this.color,
  });

  final String code;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(AppRadius.xs + 2),
          ),
          child: Text(
            code,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodySmall,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }
}
