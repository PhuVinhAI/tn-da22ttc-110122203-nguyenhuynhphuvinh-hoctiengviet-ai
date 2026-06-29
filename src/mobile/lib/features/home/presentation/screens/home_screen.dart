import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../widgets/continue_card.dart';
import '../../data/home_providers.dart';
import '../../../courses/data/courses_providers.dart';
import '../../../courses/domain/course_models.dart';
import '../../../daily_goals/presentation/widgets/daily_goal_progress_card.dart';
import '../../../simulation/data/simulation_providers.dart';
import '../../../simulation/domain/scenario_summary.dart';
import '../../../profile/data/profile_providers.dart';
import '../../../../core/network/media_url.dart';
import '../../../../l10n/app_localizations.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Future<void> _onRefresh() async {
    ref.read(coursesProvider.notifier).refresh();
    ref.read(continueLearningProvider.notifier).refresh();
    ref.read(simulationScenariosProvider.notifier).refresh();
  }

  String _getGreeting(BuildContext context) {
    final s = S.of(context);
    final hour = DateTime.now().hour;
    if (hour < 12) return s.goodMorning;
    if (hour < 17) return s.goodAfternoon;
    return s.goodEvening;
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final coursesAsync = ref.watch(coursesProvider);
    final scenariosAsync = ref.watch(simulationScenariosProvider);
    final userProfileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _onRefresh,
          child: ListView(
            padding: AppNavBar.scrollPadding(context),
            children: [
              _HeroSection(
                greeting: _getGreeting(context),
                userProfileAsync: userProfileAsync,
              ),
              const SizedBox(height: AppSpacing.xl),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: const ContinueCard(),
              ),
              const SizedBox(height: AppSpacing.lg),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: const DailyGoalProgressCard(),
              ),
              const SizedBox(height: AppSpacing.xxl),
              _SimulationSection(scenariosAsync: scenariosAsync),
              const SizedBox(height: AppSpacing.xxl),
              _CoursesSection(coursesAsync: coursesAsync),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Hero Section ───────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.greeting,
    required this.userProfileAsync,
  });

  final String greeting;
  final AsyncValue userProfileAsync;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final name = userProfileAsync.whenOrNull(
      data: (profile) =>
          profile.fullName.isNotEmpty ? profile.fullName as String : null,
    );

    return Container(
      margin: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        0,
      ),
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: c.border, width: 1),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  greeting,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.headlineSmall,
                    fontWeight: FontWeight.w700,
                    color: c.foreground,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  name ?? S.of(context).readyToLearnPrompt,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.mutedForeground,
                    height: 1.4,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          _HeroAvatar(userProfileAsync: userProfileAsync),
        ],
      ),
    );
  }
}

class _HeroAvatar extends StatelessWidget {
  const _HeroAvatar({required this.userProfileAsync});

  final AsyncValue userProfileAsync;

  static const double _size = 64;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Material(
      color: Colors.transparent,
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go('/profile'),
        customBorder: const CircleBorder(),
        child: userProfileAsync.when(
          loading: () => Container(
            width: _size,
            height: _size,
            decoration: BoxDecoration(
              color: c.muted,
              shape: BoxShape.circle,
            ),
          ),
          error: (_, _) => _tinted(
            c,
            child: Icon(Icons.person_outline, size: 32, color: c.primary),
          ),
          data: (profile) {
            if (profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty) {
              return Container(
                width: _size,
                height: _size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: c.primary.withValues(alpha: 0.2),
                    width: 2,
                  ),
                  image: DecorationImage(
                    image: NetworkImage(resolveMediaUrl(profile.avatarUrl!)),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            }
            final fullName = profile.fullName as String;
            return _tinted(
              c,
              child: Text(
                fullName.isNotEmpty ? fullName[0].toUpperCase() : '?',
                style: GoogleFonts.inter(
                  fontSize: AppTypography.titleLarge,
                  fontWeight: FontWeight.w700,
                  color: c.primary,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _tinted(AppColors c, {required Widget child}) {
    return Container(
      width: _size,
      height: _size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.12),
        shape: BoxShape.circle,
        border: Border.all(
          color: c.primary.withValues(alpha: 0.2),
          width: 2,
        ),
      ),
      child: child,
    );
  }
}

// ─── Section header ─────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onSeeAll});

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.inter(
                fontSize: AppTypography.titleMedium,
                fontWeight: FontWeight.w700,
                color: c.foreground,
                height: 1.2,
              ),
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.xs,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    S.of(context).seeAll,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      color: c.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 16, color: c.primary),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Courses Section ────────────────────────────────────────────────────

class _CoursesSection extends StatelessWidget {
  const _CoursesSection({required this.coursesAsync});
  final AsyncValue<List<Course>> coursesAsync;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: S.of(context).coursesSection,
          onSeeAll: () => context.go('/courses'),
        ),
        const SizedBox(height: AppSpacing.md),
        coursesAsync.when(
          loading: () => const _HorizontalLoadingShimmer(),
          error: (_, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: _ErrorCard(
              message: S.of(context).failedToLoadCourses,
            ),
          ),
          data: (courses) {
            if (courses.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: _EmptyCard(
                  icon: Icons.school_outlined,
                  message: S.of(context).noCoursesAvailable,
                  onTap: () => context.go('/courses'),
                ),
              );
            }
            return SizedBox(
              height: 180,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: courses.length,
                itemBuilder: (ctx, i) => _CourseCard(
                  course: courses[i],
                  isFirst: i == 0,
                  isLast: i == courses.length - 1,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({
    required this.course,
    required this.isFirst,
    required this.isLast,
  });

  final Course course;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: EdgeInsets.only(
        right: isLast ? 0 : AppSpacing.md,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/courses/${course.id}'),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Ink(
            width: 280,
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: c.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          Icons.school_outlined,
                          color: c.primary,
                          size: 24,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.arrow_forward,
                        size: 20,
                        color: c.mutedForeground,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    course.title,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyLarge,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (course.description.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      course.description,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        color: c.mutedForeground,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Simulation Section ─────────────────────────────────────────────────

class _SimulationSection extends StatelessWidget {
  const _SimulationSection({required this.scenariosAsync});
  final AsyncValue<List<ScenarioSummary>> scenariosAsync;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: S.of(context).practiceSection,
          onSeeAll: () => context.go('/practice'),
        ),
        const SizedBox(height: AppSpacing.md),
        scenariosAsync.when(
          loading: () => const _HorizontalLoadingShimmer(),
          error: (_, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: _ErrorCard(
              message: S.of(context).unableToLoadScenarios,
            ),
          ),
          data: (scenarios) {
            if (scenarios.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: _EmptyCard(
                  icon: Icons.chat_bubble_outline,
                  message: S.of(context).startConversationPractice,
                  onTap: () => context.go('/practice'),
                ),
              );
            }
            return SizedBox(
              height: 180,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: scenarios.length,
                itemBuilder: (ctx, i) => _ScenarioCard(
                  scenario: scenarios[i],
                  isFirst: i == 0,
                  isLast: i == scenarios.length - 1,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _ScenarioCard extends StatelessWidget {
  const _ScenarioCard({
    required this.scenario,
    required this.isFirst,
    required this.isLast,
  });

  final ScenarioSummary scenario;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Padding(
      padding: EdgeInsets.only(
        right: isLast ? 0 : AppSpacing.md,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/practice/scenarios/${scenario.id}'),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Ink(
            width: 280,
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: c.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          Icons.chat_bubble_outline,
                          color: c.primary,
                          size: 24,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.arrow_forward,
                        size: 20,
                        color: c.mutedForeground,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    scenario.title,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyLarge,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (scenario.description.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      scenario.description,
                      style: GoogleFonts.inter(
                        fontSize: AppTypography.bodySmall,
                        color: c.mutedForeground,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Loading / Error / Empty States ─────────────────────────────────────

class _HorizontalLoadingShimmer extends StatelessWidget {
  const _HorizontalLoadingShimmer();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: 3,
        itemBuilder: (ctx, i) => Padding(
          padding: EdgeInsets.only(
            right: i == 2 ? 0 : AppSpacing.md,
          ),
          child: const AppShimmerBox(
            width: 280,
            height: 180,
            borderRadius: BorderRadius.all(Radius.circular(AppRadius.lg)),
          ),
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.error.withValues(alpha: 0.2), width: 1),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: c.error, size: 24),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodySmall,
                color: c.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.message,
    required this.onTap,
  });

  final IconData icon;
  final String message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            color: c.muted,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: c.border, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: c.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(icon, color: c.primary, size: 24),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    message,
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodyMedium,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward, color: c.mutedForeground, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
