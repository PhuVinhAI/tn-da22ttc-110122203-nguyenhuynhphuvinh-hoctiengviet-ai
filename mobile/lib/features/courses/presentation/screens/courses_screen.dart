import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/courses_providers.dart';
import '../../domain/course_models.dart';

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Courses')),
      body: coursesAsync.when(
        loading: () => const _CoursesLoading(),
        error: (error, stack) => _CoursesError(
          onRetry: () => ref.invalidate(coursesProvider),
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (courses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Semantics(
              label: 'No courses available icon',
              child: Icon(
                Icons.school_outlined,
                size: 64,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No courses available',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
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
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CourseThumbnail(thumbnailUrl: course.thumbnailUrl),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          course.title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _LevelBadge(level: course.level),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    course.description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        course.estimatedHours != null
                            ? '${course.estimatedHours}h'
                            : 'N/A',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.menu_book,
                        size: 16,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${course.modules.length} modules',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CourseThumbnail extends StatelessWidget {
  const _CourseThumbnail({this.thumbnailUrl});
  final String? thumbnailUrl;

  @override
  Widget build(BuildContext context) {
    if (thumbnailUrl == null || thumbnailUrl!.isEmpty) {
      return _buildPlaceholder(context);
    }

    return CachedNetworkImage(
      imageUrl: thumbnailUrl!,
      height: 160,
      width: double.infinity,
      fit: BoxFit.cover,
      placeholder: (context, url) => _buildShimmerPlaceholder(context),
      errorWidget: (context, url, error) => _buildPlaceholder(context),
    );
  }

  Widget _buildShimmerPlaceholder(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      highlightColor: Theme.of(context).colorScheme.surfaceContainerHigh,
      child: Container(
        height: 160,
        width: double.infinity,
        color: Colors.white,
      ),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      height: 160,
      width: double.infinity,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Icon(
        Icons.school,
        size: 64,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
  }
}

class _LevelBadge extends StatelessWidget {
  const _LevelBadge({required this.level});
  final String level;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = _getLevelColor(level, colorScheme);

    return Semantics(
      label: 'Course level: $level',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Text(
          level,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Color _getLevelColor(String level, ColorScheme colorScheme) {
    return switch (level) {
      'A1' => const Color(0xFF4CAF50),
      'A2' => const Color(0xFF8BC34A),
      'B1' => const Color(0xFFFFC107),
      'B2' => const Color(0xFFFF9800),
      'C1' => const Color(0xFFFF5722),
      'C2' => const Color(0xFFF44336),
      _ => colorScheme.outline,
    };
  }
}

class _CoursesLoading extends StatelessWidget {
  const _CoursesLoading();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Shimmer.fromColors(
                baseColor: colorScheme.surfaceContainerHighest,
                highlightColor: colorScheme.surfaceContainerHigh,
                child: Container(
                  height: 160,
                  width: double.infinity,
                  color: Colors.white,
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Shimmer.fromColors(
                      baseColor: colorScheme.surfaceContainerHighest,
                      highlightColor: colorScheme.surfaceContainerHigh,
                      child: Container(
                        height: 20,
                        width: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Shimmer.fromColors(
                      baseColor: colorScheme.surfaceContainerHighest,
                      highlightColor: colorScheme.surfaceContainerHigh,
                      child: Container(
                        height: 16,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Shimmer.fromColors(
                      baseColor: colorScheme.surfaceContainerHighest,
                      highlightColor: colorScheme.surfaceContainerHigh,
                      child: Container(
                        height: 14,
                        width: 120,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Semantics(
            label: 'Error loading courses',
            child: Icon(Icons.error_outline, size: 64, color: colorScheme.error),
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load courses',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Semantics(
            label: 'Retry loading courses',
            button: true,
            child: FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ),
        ],
      ),
    );
  }
}
