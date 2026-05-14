import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_set_models.dart';
import '../../../lessons/presentation/widgets/custom_practice_bottom_sheet.dart';
import '../../../profile/data/profile_providers.dart';
import '../../data/courses_providers.dart';
import '../../domain/course_models.dart';

const _levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

bool _isLevelHigher(String userLevel, String courseLevel) {
  final userIndex = _levelOrder.indexOf(userLevel);
  final courseIndex = _levelOrder.indexOf(courseLevel);
  return userIndex > courseIndex;
}

Color _getLevelColor(String level, AppColors c) {
  return switch (level) {
    'A1' => const Color(0xFF22C55E),
    'A2' => const Color(0xFF84CC16),
    'B1' => const Color(0xFFF59E0B),
    'B2' => const Color(0xFFf97316),
    'C1' => const Color(0xFFEF4444),
    'C2' => const Color(0xFFDC2626),
    _ => c.mutedForeground,
  };
}

class CourseDetailScreen extends ConsumerStatefulWidget {
  const CourseDetailScreen({super.key, required this.courseId});
  final String courseId;

  @override
  ConsumerState<CourseDetailScreen> createState() =>
      _CourseDetailScreenState();
}

enum _BusyAction { none, create, regenerate, delete, reset, completeAll, resetCourse }

class _CourseDetailScreenState extends ConsumerState<CourseDetailScreen>
    with WidgetsBindingObserver {
  String? _busySetId;
  _BusyAction _busyAction = _BusyAction.none;
  String? _error;
  bool _isCreatingCustom = false;
  String? _creatingSetId;
  String? _regeneratingNewSetId;
  CancelToken? _aiCancelToken;

  CancelToken _newAiCancelToken() {
    _aiCancelToken?.cancel();
    final next = CancelToken();
    _aiCancelToken = next;
    return next;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void deactivate() {
    _aiCancelToken?.cancel();
    _cleanupIncompleteSet();
    super.deactivate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _aiCancelToken?.cancel();
    _cleanupIncompleteSet();
    super.dispose();
  }

  void _cleanupIncompleteSet() {
    try {
      final repo = ref.read(lessonRepositoryProvider);
      if (_creatingSetId != null) {
        final id = _creatingSetId!;
        _creatingSetId = null;
        repo.deleteCustomExerciseSet(id).catchError((_) {});
      }
      if (_regeneratingNewSetId != null) {
        final id = _regeneratingNewSetId!;
        _regeneratingNewSetId = null;
        repo.deleteCustomExerciseSet(id).catchError((_) {});
      }
    } catch (_) {
      _creatingSetId = null;
      _regeneratingNewSetId = null;
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _cleanupIncompleteSet();
    }
  }

  Map<String, UserProgress> _buildProgressMap(
      AsyncValue<List<UserProgress>> progressAsync) {
    return progressAsync.whenOrNull(
          data: (progressList) {
            return {for (final p in progressList) p.lessonId: p};
          },
        ) ??
        {};
  }

  bool _courseHasAnyProgress(
      Course course, Map<String, UserProgress> progressMap) {
    for (final module in course.modules) {
      for (final lesson in module.lessons) {
        if (progressMap.containsKey(lesson.id)) return true;
      }
    }
    return false;
  }

  Future<void> _pushExercisePlay(String setId) async {
    await context.push('/courses/${widget.courseId}/exercises/play/$setId');
    if (!mounted) return;
    await ref
        .read(courseExerciseSetsProvider(widget.courseId).notifier)
        .refresh();
  }

  Future<void> _handleCreateCustom(CustomSetConfig config) async {
    setState(() {
      _isCreatingCustom = true;
      _busyAction = _BusyAction.create;
      _error = null;
    });
    String? setId;
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      final set = await notifier.createCustomSet(config);
      setId = set.id;
      _creatingSetId = setId;

      final token = _newAiCancelToken();
      await notifier.generateSet(setId,
          userPrompt: config.userPrompt, cancelToken: token);
      _creatingSetId = null;
      if (mounted) {
        setState(() {
          _isCreatingCustom = false;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;

      if (e is RequestCancelledException) {
        if (setId != null) {
          final repo = ref.read(lessonRepositoryProvider);
          await repo.deleteCustomExerciseSet(setId).catchError((_) {});
        }
        _creatingSetId = null;
        setState(() {
          _isCreatingCustom = false;
          _busyAction = _BusyAction.none;
        });
        return;
      }

      if (setId != null) {
        final repo = ref.read(lessonRepositoryProvider);
        await repo.deleteCustomExerciseSet(setId).catchError((_) {});
      }
      _creatingSetId = null;
      setState(() {
        _isCreatingCustom = false;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleRegenerate(String setId, {String? userPrompt}) async {
    setState(() {
      _busySetId = setId;
      _busyAction = _BusyAction.regenerate;
      _error = null;
      _regeneratingNewSetId = null;
    });
    String? newSetId;
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      newSetId = await notifier.regenerateSet(setId, userPrompt: userPrompt);
      _regeneratingNewSetId = newSetId;

      final token = _newAiCancelToken();
      await notifier.generateSet(newSetId,
          userPrompt: userPrompt, cancelToken: token);
      _regeneratingNewSetId = null;
      if (mounted) {
        setState(() {
          _busySetId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;

      if (newSetId != null) {
        final repo = ref.read(lessonRepositoryProvider);
        await repo.deleteCustomExerciseSet(newSetId).catchError((_) {});
      }
      _regeneratingNewSetId = null;

      if (e is RequestCancelledException) {
        setState(() {
          _busySetId = null;
          _busyAction = _BusyAction.none;
        });
        return;
      }
      setState(() {
        _busySetId = null;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleDelete(String setId) async {
    setState(() {
      _busySetId = setId;
      _busyAction = _BusyAction.delete;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      await notifier.deleteSet(setId);
      if (mounted) {
        setState(() {
          _busySetId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busySetId = null;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleResetSet(String setId) async {
    setState(() {
      _busySetId = setId;
      _busyAction = _BusyAction.reset;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      await notifier.resetSetProgress(setId);
      await ref.read(exerciseSessionServiceProvider).delete(setId);
      if (mounted) {
        setState(() {
          _busySetId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busySetId = null;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleCompleteAll() async {
    setState(() {
      _busyAction = _BusyAction.completeAll;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      await notifier.completeAllCourseProgress();
      ref.invalidate(userProgressProvider);
      ref.invalidate(courseDetailProvider(widget.courseId));
      if (mounted) {
        setState(() {
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleResetCourse() async {
    setState(() {
      _busyAction = _BusyAction.resetCourse;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExerciseSetsProvider(widget.courseId).notifier);
      await notifier.resetCourseProgress();
      ref.invalidate(userProgressProvider);
      ref.invalidate(courseDetailProvider(widget.courseId));
      if (mounted) {
        setState(() {
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  void _showCreationForm({String? initialUserPrompt}) {
    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (ctx) => CustomPracticeBottomSheet.creation(
        initialUserPrompt: initialUserPrompt,
        onSubmit: (config) async {
          Navigator.of(ctx).pop();
          await _handleCreateCustom(config);
        },
      ),
    );
  }

  void _showInfoSheet(SetProgress set) {
    final isRegenerating = _busySetId == set.setId &&
        _busyAction == _BusyAction.regenerate;

    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (ctx) => CustomPracticeBottomSheet.info(
        progress: set,
        onPlay: () {
          Navigator.of(ctx).pop();
          _pushExercisePlay(set.setId);
        },
        onRegenerate: () {
          Navigator.of(ctx).pop();
          _confirmRegenerate(set.setId, set.title, set.userPrompt);
        },
        onReset: () {
          Navigator.of(ctx).pop();
          _confirmReset(set.setId, set.title);
        },
        onDelete: () {
          Navigator.of(ctx).pop();
          _confirmDelete(set.setId);
        },
        onCancel: isRegenerating ? () => _aiCancelToken?.cancel() : null,
      ),
    );
  }

  void _confirmDelete(String setId) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Delete custom set?',
        content:
            'This set will be removed from your list. You can create a new one anytime.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Delete',
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleDelete(setId);
            },
          ),
        ],
      ),
    );
  }

  void _confirmReset(String setId, String title) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Reset progress?',
        content:
            'Your answers for "$title" will be cleared. You can start over anytime.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Reset',
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleResetSet(setId);
            },
          ),
        ],
      ),
    );
  }

  void _confirmRegenerate(String setId, String title, String? userPrompt) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Regenerate exercises?',
        content:
            'This will create a new set replacing "$title" with fresh AI-generated questions.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Regenerate',
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleRegenerate(setId, userPrompt: userPrompt);
            },
          ),
        ],
      ),
    );
  }

  void _confirmCompleteAll() {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Mark all lessons as completed?',
        content:
            'All lessons in this course will be marked as completed. You can reset later if needed.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Complete All',
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleCompleteAll();
            },
          ),
        ],
      ),
    );
  }

  void _confirmResetCourse() {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: 'Reset all progress?',
        content:
            'Reset all progress? This cannot be undone. All lesson progress, exercise results, and custom practice sets will be removed.',
        actions: [
          AppDialogAction(
            label: 'Cancel',
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: 'Reset',
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleResetCourse();
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final courseAsync = ref.watch(courseDetailProvider(widget.courseId));
    final progressAsync = ref.watch(userProgressProvider);
    final exerciseSetsAsync =
        ref.watch(courseExerciseSetsProvider(widget.courseId));
    final userProfileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      body: courseAsync.when(
        loading: () => const _CourseDetailLoading(),
        error: (error, stack) => _CourseDetailError(
          onRetry: () => ref.invalidate(courseDetailProvider(widget.courseId)),
        ),
        data: (course) {
          final progressMap = _buildProgressMap(progressAsync);
          final userLevel = userProfileAsync.whenOrNull(
              data: (profile) => profile.currentLevel);
          final showCompleteAll = userLevel != null &&
              _isLevelHigher(userLevel, course.level);
          final hasProgress = _courseHasAnyProgress(course, progressMap);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                title: Text(
                  course.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SliverToBoxAdapter(
                child: _CourseInfoSection(course: course),
              ),
              _buildCustomPracticeSliver(
                  context, exerciseSetsAsync, course, showCompleteAll, hasProgress),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg,
                      AppSpacing.xl, AppSpacing.lg, AppSpacing.sm),
                  child: Text(
                    'Modules',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final module = course.modules[index];
                    return _ModuleCard(
                      module: module,
                      index: index,
                      onTap: () => context.push('/modules/${module.id}'),
                    );
                  },
                  childCount: course.modules.length,
                ),
              ),
              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCustomPracticeSliver(
    BuildContext context,
    AsyncValue<CourseExerciseSummary> exerciseSetsAsync,
    Course course,
    bool showCompleteAll,
    bool hasProgress,
  ) {
    return exerciseSetsAsync.when(
      loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
      error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
      data: (summary) {
        final c = AppTheme.colors(context);
        final theme = Theme.of(context);
        final customSets = summary.courseSets;
        final hasBypassProgress = summary.completedModulesCount > 0;
        final shouldShowReset = hasProgress || hasBypassProgress;

        if (!summary.eligible && !showCompleteAll && !shouldShowReset) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        return SliverToBoxAdapter(
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: AppSpacing.xl),
                Row(
                  children: [
                    Icon(Icons.auto_awesome, color: c.primary, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Custom Practice',
                      style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${summary.completedModulesCount}/${summary.totalModulesCount} modules completed',
                  style: theme.textTheme.bodyMedium?.copyWith(
                      color: c.mutedForeground),
                ),
                const SizedBox(height: AppSpacing.md),
                if (summary.eligible) ...[
                  if (_isCreatingCustom) ...[
                    SizedBox(
                      width: double.infinity,
                      child: AppButton(
                        label: 'Generating exercises...',
                        variant: AppButtonVariant.secondary,
                        onPressed: null,
                        icon: const SizedBox(
                          width: 18,
                          height: 18,
                          child:
                              CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SizedBox(
                      width: double.infinity,
                      child: AppButton(
                        label: 'Cancel',
                        variant: AppButtonVariant.outline,
                        onPressed: () => _aiCancelToken?.cancel(),
                      ),
                    ),
                  ] else
                    SizedBox(
                      width: double.infinity,
                      child: AppButton(
                        label: 'Create Custom Practice',
                        variant: AppButtonVariant.primary,
                        onPressed: _showCreationForm,
                        icon: const Icon(Icons.add),
                      ),
                    ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    _error!,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: c.error),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                ...customSets.map((set) => _CourseSetCard(
                      progress: set,
                      isBusy: _busySetId == set.setId,
                      isRegenerating: _busySetId == set.setId &&
                          _busyAction == _BusyAction.regenerate,
                      onTap: () => _showInfoSheet(set),
                      onCancel: () => _aiCancelToken?.cancel(),
                    )),
                if (showCompleteAll) ...[
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      label: _busyAction == _BusyAction.completeAll
                          ? 'Completing all...'
                          : 'Complete All',
                      variant: AppButtonVariant.secondary,
                      onPressed: _busyAction == _BusyAction.completeAll
                          ? null
                          : _confirmCompleteAll,
                      icon: _busyAction == _BusyAction.completeAll
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          : const Icon(Icons.done_all),
                    ),
                  ),
                ],
                if (shouldShowReset) ...[
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      label: _busyAction == _BusyAction.resetCourse
                          ? 'Resetting...'
                          : 'Reset',
                      variant: AppButtonVariant.outline,
                      onPressed: _busyAction == _BusyAction.resetCourse
                          ? null
                          : _confirmResetCourse,
                      icon: _busyAction == _BusyAction.resetCourse
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          : const Icon(Icons.restart_alt),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _CourseInfoSection extends StatelessWidget {
  const _CourseInfoSection({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppBadge(
                label: course.level,
                color: _getLevelColor(course.level, c),
              ),
              const SizedBox(width: AppSpacing.md),
              if (course.estimatedHours != null) ...[
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: c.mutedForeground,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '${course.estimatedHours}h',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: c.mutedForeground,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            course.description,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Modules',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({
    required this.module,
    required this.index,
    required this.onTap,
  });
  final CourseModule module;
  final int index;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return AppCard(
      variant: AppCardVariant.outlined,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 6),
      padding: const EdgeInsets.only(left: 12, right: 4, top: 6, bottom: 6),
      child: AppListItem(
        onTap: onTap,
        leading: AppAvatar(
          backgroundColor: c.muted,
          child: Text(
            '${index + 1}',
            style: TextStyle(
              color: c.foreground,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        titleWidget: Text(
          module.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitleWidget: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (module.topic != null) ...[
              Text(
                module.topic!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: c.primary,
                ),
              ),
            ],
            Text(
              module.description,
              style: theme.textTheme.bodySmall?.copyWith(
                color: c.mutedForeground,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (module.estimatedHours != null) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 12,
                    color: c.mutedForeground,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    '${module.estimatedHours}h',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: c.mutedForeground,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: c.mutedForeground,
        ),
      ),
    );
  }
}

class _CourseSetCard extends StatelessWidget {
  const _CourseSetCard({
    required this.progress,
    this.isBusy = false,
    this.isRegenerating = false,
    this.onTap,
    this.onCancel,
  });

  final SetProgress progress;
  final bool isBusy;
  final bool isRegenerating;
  final VoidCallback? onTap;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        variant: AppCardVariant.outlined,
        padding: EdgeInsets.zero,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isBusy ? null : onTap,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: c.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.auto_awesome,
                        color: c.accent, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          progress.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (progress.description != null &&
                            progress.description!.isNotEmpty)
                          Text(
                            progress.description!,
                            style: theme.textTheme.bodySmall?.copyWith(
                                color: c.mutedForeground),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        else
                          const SizedBox(height: 4),
                        const SizedBox(height: 2),
                        Text(
                          progress.isCompleted
                              ? '${progress.percentCorrect.round()}%'
                              : progress.isInProgress
                                  ? '${progress.percentComplete.round()}%'
                                  : '${progress.totalExercises} questions',
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: c.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                  if (isBusy)
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: isRegenerating && onCancel != null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const AppSpinner(
                                    size: 20, strokeWidth: 2),
                                const SizedBox(height: 2),
                                Text(
                                  'Cancel',
                                  style: theme.textTheme.labelSmall
                                      ?.copyWith(
                                    color: c.mutedForeground,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            )
                          : const Center(
                              child: AppSpinner(size: 22),
                            ),
                    )
                  else if (progress.isCompleted)
                    Icon(Icons.check_circle, color: c.accent, size: 28)
                  else if (progress.isInProgress)
                    SizedBox(
                      width: 32,
                      height: 32,
                      child: AppProgress(
                        value: progress.percentComplete / 100,
                        color: c.accent,
                      ),
                    )
                  else
                    Icon(Icons.play_circle_outline,
                        color: c.accent, size: 28),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CourseDetailLoading extends StatelessWidget {
  const _CourseDetailLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          title: Shimmer.fromColors(
            baseColor: c.muted,
            highlightColor: c.card,
            child: Container(
              height: 20,
              width: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 24,
                    width: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 16,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 16,
                    width: 250,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                Shimmer.fromColors(
                  baseColor: c.muted,
                  highlightColor: c.card,
                  child: Container(
                    height: 24,
                    width: 120,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              return AppCard(
                variant: AppCardVariant.outlined,
                margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 6),
                padding: const EdgeInsets.only(left: 12, right: 4, top: 6, bottom: 6),
                child: AppListItem(
                  leading: Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: AppAvatar(backgroundColor: Colors.white),
                  ),
                  titleWidget: Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      height: 16,
                      width: 150,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                  subtitleWidget: Shimmer.fromColors(
                    baseColor: c.muted,
                    highlightColor: c.card,
                    child: Container(
                      height: 12,
                      width: 200,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                ),
              );
            },
            childCount: 4,
          ),
        ),
      ],
    );
  }
}

class _CourseDetailError extends StatelessWidget {
  const _CourseDetailError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Scaffold(
      appBar: AppAppBar(title: const Text('Course')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: c.mutedForeground),
              const SizedBox(height: AppSpacing.lg),
              const Text('Failed to load course', textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.sm),
              AppButton(
                variant: AppButtonVariant.primary,
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: 'Retry',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
