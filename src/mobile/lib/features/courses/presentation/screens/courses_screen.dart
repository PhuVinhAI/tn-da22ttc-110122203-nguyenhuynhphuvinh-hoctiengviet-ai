import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/courses_providers.dart';
import '../../domain/course_models.dart';
import '../../../../l10n/app_localizations.dart';

Color _levelColor(String level, AppColors c) {
  return switch (level) {
    'A1' => const Color(0xFF22C55E),
    'A2' => const Color(0xFF84CC16),
    'B1' => const Color(0xFFF59E0B),
    'B2' => const Color(0xFFF97316),
    'C1' => const Color(0xFFEF4444),
    'C2' => const Color(0xFFDC2626),
    _ => c.mutedForeground,
  };
}

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);

    return Scaffold(
      appBar: AppAppBar(title: Text(S.of(context).coursesTitle)),
      body: coursesAsync.when(
        loading: () => const _CoursesLoading(),
        error: (error, stack) => _CoursesError(
          onRetry: () => ref.read(coursesProvider.notifier).refresh(),
        ),
        data: (courses) => _CoursesList(courses: courses),
      ),
    );
  }
}

class _CoursesList extends StatelessWidget {
  const _CoursesList({required this.courses});
  final List<Course> courses;

  @override
  Widget build(BuildContext context) {
    if (courses.isEmpty) return const _CoursesEmpty();

    return ListView.builder(
      padding: AppNavBar.scrollPadding(
        context,
        base: const EdgeInsets.all(AppSpacing.lg),
      ),
      itemCount: courses.length,
      itemBuilder: (context, index) {
        final course = courses[index];
        return _CourseCard(
          course: course,
          onTap: () => context.push('/courses/${course.id}'),
        );
      },
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course, required this.onTap});
  final Course course;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final levelColor = _levelColor(course.level, c);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: levelColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Text(
                        course.level,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          fontWeight: FontWeight.w800,
                          color: levelColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        course.title,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyLarge,
                          fontWeight: FontWeight.w700,
                          color: c.foreground,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Icon(Icons.chevron_right, color: c.mutedForeground, size: 22),
                  ],
                ),
                if (course.description.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    course.description,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: c.mutedForeground,
                      height: 1.45,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    _MetaChip(
                      icon: Icons.menu_book_outlined,
                      label: '${course.modules.length} modules',
                    ),
                    if (course.estimatedHours != null) ...[
                      const SizedBox(width: AppSpacing.sm),
                      _MetaChip(
                        icon: Icons.access_time_rounded,
                        label: '${course.estimatedHours}h',
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm + 2,
        vertical: AppSpacing.xs + 1,
      ),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c.mutedForeground),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: AppTypography.caption,
              fontWeight: FontWeight.w500,
              color: c.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _CoursesEmpty extends StatelessWidget {
  const _CoursesEmpty();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: c.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.xl),
              ),
              child: Icon(Icons.school_outlined, size: 30, color: c.primary),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              S.of(context).noCoursesAvailable,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyLarge,
                fontWeight: FontWeight.w600,
                color: c.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoursesLoading extends StatelessWidget {
  const _CoursesLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    Widget bar(double w, double h) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        );

    return ListView.builder(
      padding: AppNavBar.scrollPadding(
        context,
        base: const EdgeInsets.all(AppSpacing.lg),
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.md),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: c.card,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: c.muted,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  bar(160, 16),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              bar(double.infinity, 12),
              const SizedBox(height: AppSpacing.sm),
              bar(220, 12),
            ],
          ),
        );
      },
    );
  }
}

class _CoursesError extends StatelessWidget {
  const _CoursesError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: c.error.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.xl),
              ),
              child: Icon(Icons.error_outline, size: 30, color: c.error),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              S.of(context).failedToLoadCourses,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyLarge,
                fontWeight: FontWeight.w600,
                color: c.foreground,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            AppButton(
              variant: AppButtonVariant.primary,
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: S.of(context).retryButton,
            ),
          ],
        ),
      ),
    );
  }
}
