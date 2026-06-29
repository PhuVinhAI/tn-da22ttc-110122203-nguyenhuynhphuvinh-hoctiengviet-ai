import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:linvnix/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/lesson_models.dart';

class GrammarStepWidget extends StatelessWidget {
  const GrammarStepWidget({super.key, required this.grammarRules});
  final List<GrammarRule> grammarRules;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    if (grammarRules.isEmpty) {
      return Center(
        child: Text(
          S.of(context).noGrammarRulesForLesson,
          style: GoogleFonts.inter(
            fontSize: AppTypography.bodyMedium,
            color: c.mutedForeground,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
      itemCount: grammarRules.length,
      itemBuilder: (context, index) {
        return _GrammarRuleCard(rule: grammarRules[index]);
      },
    );
  }
}

class _GrammarRuleCard extends StatelessWidget {
  const _GrammarRuleCard({required this.rule});
  final GrammarRule rule;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            rule.title,
            style: GoogleFonts.inter(
              fontSize: AppTypography.titleMedium,
              fontWeight: FontWeight.w700,
              color: c.foreground,
              height: 1.2,
            ),
          ),
          if (rule.structure != null) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: c.muted,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: c.border, width: 1),
              ),
              child: Text(
                rule.structure!,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyLarge,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Text(
            rule.explanation,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodyMedium,
              color: c.foreground,
              height: 1.6,
            ),
          ),
          if (rule.examples.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              S.of(context).examplesTitle,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                fontWeight: FontWeight.w700,
                color: c.foreground,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            ...rule.examples.map((ex) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: c.muted,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: c.border, width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ex.vi,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodyMedium,
                            fontWeight: FontWeight.w600,
                            color: c.foreground,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ex.en,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            color: c.mutedForeground,
                          ),
                        ),
                        if (ex.note != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            ex.note!,
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.bodySmall,
                              fontStyle: FontStyle.italic,
                              color: c.mutedForeground,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                )),
          ],
          if (rule.notes != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              rule.notes!,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.mutedForeground,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
