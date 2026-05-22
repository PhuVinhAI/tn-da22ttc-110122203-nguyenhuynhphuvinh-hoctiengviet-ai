import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../widgets/continue_card.dart';
import '../../data/home_providers.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../../daily_goals/presentation/widgets/daily_goal_progress_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Future<void> _onRefresh() async {
    ref.read(coursesProvider.notifier).refresh();
    ref.read(continueLearningProvider.notifier).refresh();
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final coursesAsync = ref.watch(coursesProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          padding: AppNavBar.scrollPadding(context),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.xl,
                AppSpacing.xl,
                AppSpacing.lg,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getGreeting(),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: c.foreground,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Ready to learn?',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: const ContinueCard(),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: const DailyGoalProgressCard(),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: _CoursesSection(coursesAsync: coursesAsync),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}

class _CoursesSection extends StatelessWidget {
  const _CoursesSection({required this.coursesAsync});
  final AsyncValue<List<Course>> coursesAsync;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Explore',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/courses'),
              child: Text(
                'See all',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        coursesAsync.when(
          loading: () => const _HomeCoursesLoading(),
          error: (_, _) => Center(
            child: Text(
              'Unable to load courses',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: c.mutedForeground,
              ),
            ),
          ),
          data: (courses) {
            if (courses.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Text(
                    'No courses available yet',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: c.mutedForeground,
                    ),
                  ),
                ),
              );
            }
            return Column(
              children: courses.take(3).map((course) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: AppCard(
                    variant: AppCardVariant.outlined,
                    borderRadius: AppRadius.lg,
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    onTap: () => context.push('/courses/${course.id}'),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: c.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Icon(
                            Icons.school_outlined,
                            color: c.primary,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                course.title,
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (course.description.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  course.description,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: c.mutedForeground,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: c.mutedForeground,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class _HomeCoursesLoading extends StatelessWidget {
  const _HomeCoursesLoading();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(3, (index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: AppCard(
            variant: AppCardVariant.outlined,
            borderRadius: AppRadius.lg,
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              children: [
                const AppShimmerBox(
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppShimmerBox(
                        width: index == 0 ? 180 : 160,
                        height: 18,
                        borderRadius:
                            BorderRadius.circular(AppRadius.sm),
                      ),
                      const SizedBox(height: 6),
                      AppShimmerBox(
                        width: index == 1 ? 220 : 140,
                        height: 12,
                        borderRadius:
                            BorderRadius.circular(AppRadius.sm),
                      ),
                    ],
                  ),
                ),
                const AppShimmerBox(
                  width: 20,
                  height: 20,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}
