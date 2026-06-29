import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../lessons/domain/exercise_models.dart';
import '../../../lessons/presentation/widgets/custom_practice_bottom_sheet.dart';
import '../../../profile/data/profile_providers.dart';
import '../../data/courses_providers.dart';
import '../../domain/course_models.dart';
import '../widgets/course_content_sections.dart';
import '../../../../core/providers/providers.dart';
import '../../../user/domain/user_profile.dart';
import '../../../../l10n/app_localizations.dart';

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
  String? _busyExerciseId;
  _BusyAction _busyAction = _BusyAction.none;
  String? _error;
  bool _isCreatingCustom = false;
  String? _creatingExerciseId;
  String? _regeneratingNewExerciseId;
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
    _cleanupIncompleteExercise();
    super.deactivate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _aiCancelToken?.cancel();
    _cleanupIncompleteExercise();
    super.dispose();
  }

  void _cleanupIncompleteExercise() {
    try {
      final repo = ref.read(lessonRepositoryProvider);
      if (_creatingExerciseId != null) {
        final id = _creatingExerciseId!;
        _creatingExerciseId = null;
        repo.deleteCustomExercise(id).catchError((_) {});
      }
      if (_regeneratingNewExerciseId != null) {
        final id = _regeneratingNewExerciseId!;
        _regeneratingNewExerciseId = null;
        repo.deleteCustomExercise(id).catchError((_) {});
      }
    } catch (_) {
      _creatingExerciseId = null;
      _regeneratingNewExerciseId = null;
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _cleanupIncompleteExercise();
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

  Future<void> _pushExercisePlay(String exerciseId) async {
    await context.push('/courses/${widget.courseId}/exercises/play/$exerciseId');
    if (!mounted) return;
    await ref
        .read(courseExercisesProvider(widget.courseId).notifier)
        .refresh();
  }

  Future<void> _handleCreateCustom(CustomExerciseConfig config) async {
    setState(() {
      _isCreatingCustom = true;
      _busyAction = _BusyAction.create;
      _error = null;
    });
    String? exerciseId;
    try {
      final notifier =
          ref.read(courseExercisesProvider(widget.courseId).notifier);
      final exercise = await notifier.createCustomExercise(config);
      exerciseId = exercise.id;
      _creatingExerciseId = exerciseId;

      final token = _newAiCancelToken();
      await notifier.generateExercise(exerciseId,
          userPrompt: config.userPrompt, cancelToken: token);
      _creatingExerciseId = null;
      if (mounted) {
        setState(() {
          _isCreatingCustom = false;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;

      if (e is RequestCancelledException) {
        if (exerciseId != null) {
          final repo = ref.read(lessonRepositoryProvider);
          await repo.deleteCustomExercise(exerciseId).catchError((_) {});
        }
        _creatingExerciseId = null;
        setState(() {
          _isCreatingCustom = false;
          _busyAction = _BusyAction.none;
        });
        return;
      }

      if (exerciseId != null) {
        final repo = ref.read(lessonRepositoryProvider);
        await repo.deleteCustomExercise(exerciseId).catchError((_) {});
      }
      _creatingExerciseId = null;
      setState(() {
        _isCreatingCustom = false;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleRegenerate(String exerciseId, {String? userPrompt}) async {
    setState(() {
      _busyExerciseId = exerciseId;
      _busyAction = _BusyAction.regenerate;
      _error = null;
      _regeneratingNewExerciseId = null;
    });
    String? newExerciseId;
    try {
      final notifier =
          ref.read(courseExercisesProvider(widget.courseId).notifier);
      newExerciseId = await notifier.regenerateExercise(exerciseId, userPrompt: userPrompt);
      _regeneratingNewExerciseId = newExerciseId;

      final token = _newAiCancelToken();
      await notifier.generateExercise(newExerciseId,
          userPrompt: userPrompt, cancelToken: token);
      _regeneratingNewExerciseId = null;
      if (mounted) {
        setState(() {
          _busyExerciseId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;

      if (newExerciseId != null) {
        final repo = ref.read(lessonRepositoryProvider);
        await repo.deleteCustomExercise(newExerciseId).catchError((_) {});
      }
      _regeneratingNewExerciseId = null;

      if (e is RequestCancelledException) {
        setState(() {
          _busyExerciseId = null;
          _busyAction = _BusyAction.none;
        });
        return;
      }
      setState(() {
        _busyExerciseId = null;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleDelete(String exerciseId) async {
    setState(() {
      _busyExerciseId = exerciseId;
      _busyAction = _BusyAction.delete;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExercisesProvider(widget.courseId).notifier);
      await notifier.deleteExercise(exerciseId);
      if (mounted) {
        setState(() {
          _busyExerciseId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busyExerciseId = null;
        _busyAction = _BusyAction.none;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleResetExercise(String exerciseId) async {
    setState(() {
      _busyExerciseId = exerciseId;
      _busyAction = _BusyAction.reset;
      _error = null;
    });
    try {
      final notifier =
          ref.read(courseExercisesProvider(widget.courseId).notifier);
      await notifier.resetExerciseProgress(exerciseId);
      await ref.read(questionSessionServiceProvider).delete(exerciseId);
      if (mounted) {
        setState(() {
          _busyExerciseId = null;
          _busyAction = _BusyAction.none;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busyExerciseId = null;
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
          ref.read(courseExercisesProvider(widget.courseId).notifier);
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
          ref.read(courseExercisesProvider(widget.courseId).notifier);
      await notifier.resetCourseProgress();
      ref.invalidate(userProgressProvider);
      ref.invalidate(courseDetailProvider(widget.courseId));
      
      final prefs = ref.read(preferencesProvider).value;
      if (prefs != null) {
        await prefs.setLevelUpPrompted(widget.courseId, false);
      }

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

  String _getTargetLevel(String courseLevel) {
    final index = _levelOrder.indexOf(courseLevel);
    if (index == -1) return courseLevel;
    if (index < _levelOrder.length - 1) {
      return _levelOrder[index + 1];
    }
    return courseLevel;
  }

  void _checkAndShowLevelUpDialog({
    required Course course,
    required CourseExerciseSummary summary,
    required UserProfile profile,
  }) {
    final isCompleted = summary.completedModulesCount == summary.totalModulesCount &&
        summary.totalModulesCount > 0;
    if (!isCompleted) return;

    final prefs = ref.read(preferencesProvider).value;
    if (prefs == null) return;
    if (prefs.isLevelUpPrompted(widget.courseId)) return;

    final userLevel = profile.currentLevel;
    final isUserLevelLowerOrEqual = userLevel == null ||
        !_isLevelHigher(userLevel, course.level) ||
        userLevel == course.level;

    if (!isUserLevelLowerOrEqual) return;

    final targetLevel = _getTargetLevel(course.level);

    prefs.setLevelUpPrompted(widget.courseId, true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _showLevelUpDialog(course, targetLevel);
    });
  }

  void _showLevelUpDialog(Course course, String targetLevel) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: S.of(context).levelUpProfileQuestion,
        content: S.of(context).congratulationsCompleteCourseParam(course.title, targetLevel),
        actions: [
          AppDialogAction(
            label: S.of(context).noThanks,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).updateLevel,
            isPrimary: true,
            onPressed: () async {
              Navigator.pop(dialogCtx);
              try {
                await ref
                    .read(userProfileProvider.notifier)
                    .updateProfile(currentLevel: targetLevel);
                if (mounted) {
                  AppToast.show(
                    context,
                    message: S.of(context).successfullyUpdatedProfileLevelParam(targetLevel),
                    type: AppToastType.success,
                  );
                }
              } catch (e) {
                if (mounted) {
                  AppToast.show(
                    context,
                    message: S.of(context).failedToUpdateLevelParam(e.toString()),
                    type: AppToastType.error,
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  } // Note: level-up dialog, keeping as is (not in key mapping)

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

  void _showInfoSheet(ExerciseProgress exercise) {
    final isRegenerating = _busyExerciseId == exercise.exerciseId &&
        _busyAction == _BusyAction.regenerate;

    AppBottomSheet.show(
      context,
      isScrollControlled: true,
      builder: (ctx) => CustomPracticeBottomSheet.info(
        progress: exercise,
        onPlay: () {
          Navigator.of(ctx).pop();
          _pushExercisePlay(exercise.exerciseId);
        },
        onRegenerate: () {
          Navigator.of(ctx).pop();
          _confirmRegenerate(exercise.exerciseId, exercise.title, exercise.userPrompt);
        },
        onReset: () {
          Navigator.of(ctx).pop();
          _confirmReset(exercise.exerciseId, exercise.title);
        },
        onDelete: () {
          Navigator.of(ctx).pop();
          _confirmDelete(exercise.exerciseId);
        },
        onCancel: isRegenerating ? () => _aiCancelToken?.cancel() : null,
      ),
    );
  }

  void _confirmDelete(String exerciseId) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: S.of(context).deleteCustomExerciseQuestion,
        content:
            S.of(context).deleteCustomPracticeExerciseWarning,
        actions: [
          AppDialogAction(
            label: S.of(context).cancelButton2,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).deleteLabel,
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleDelete(exerciseId);
            },
          ),
        ],
      ),
    );
  }

  void _confirmReset(String exerciseId, String title) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: S.of(context).resetProgressQuestion,
        content: S.of(context).clearAnswersWarningParam(title),
        actions: [
          AppDialogAction(
            label: S.of(context).cancelButton2,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).resetLabel,
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleResetExercise(exerciseId);
            },
          ),
        ],
      ),
    );
  }

  void _confirmRegenerate(String exerciseId, String title, String? userPrompt) {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: S.of(context).regenerateExercisesQuestion,
        content: S.of(context).freshAiQuestionsWarningParam(title),
        actions: [
          AppDialogAction(
            label: S.of(context).cancelButton2,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).regenerateLabel,
            isPrimary: true,
            onPressed: () {
              Navigator.pop(dialogCtx);
              _handleRegenerate(exerciseId, userPrompt: userPrompt);
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
        title: S.of(context).markAllLessonsCompletedQuestion,
        content:
            S.of(context).markCourseCompleteWarning,
        actions: [
          AppDialogAction(
            label: S.of(context).cancelButton2,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).completeAll,
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
        title: S.of(context).resetAllProgressQuestion,
        content:
            S.of(context).resetCourseProgressWarning,
        actions: [
          AppDialogAction(
            label: S.of(context).cancelButton2,
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          AppDialogAction(
            label: S.of(context).resetLabel,
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
    final exercisesAsync =
        ref.watch(courseExercisesProvider(widget.courseId));
    final userProfileAsync = ref.watch(userProfileProvider);

    if (courseAsync.hasValue && exercisesAsync.hasValue && userProfileAsync.hasValue) {
      _checkAndShowLevelUpDialog(
        course: courseAsync.requireValue,
        summary: exercisesAsync.requireValue,
        profile: userProfileAsync.requireValue,
      );
    }

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
              _buildListHeaderSliver(
                exercisesAsync,
                showCompleteAll,
                hasProgress,
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final module = course.modules[index];
                    return _ModuleCard(
                      module: module,
                      index: index,
                      progressMap: progressMap,
                      onTap: () => context.push('/modules/${module.id}'),
                    );
                  },
                  childCount: course.modules.length,
                ),
              ),
              _buildCustomPracticeSliver(context, exercisesAsync),
              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildListHeaderSliver(
    AsyncValue<CourseExerciseSummary> exercisesAsync,
    bool showCompleteAll,
    bool hasProgress,
  ) {
    return exercisesAsync.when(
      loading: () => SliverToBoxAdapter(
        child: ContentListHeader(title: S.of(context).modulesTitle),
      ),
      error: (_, _) => SliverToBoxAdapter(
        child: ContentListHeader(title: S.of(context).modulesTitle),
      ),
      data: (summary) {
        final hasBypassProgress = summary.completedModulesCount > 0;
        final shouldShowReset = hasProgress || hasBypassProgress;

        return SliverToBoxAdapter(
          child: ContentListHeader(
            title: S.of(context).modulesTitle,
            progressText: S.of(context).completedCountParam(
                  summary.completedModulesCount,
                  summary.totalModulesCount,
                ),
            showCompleteAll: showCompleteAll,
            showReset: shouldShowReset,
            isCompletingAll: _busyAction == _BusyAction.completeAll,
            isResetting: _busyAction == _BusyAction.resetCourse,
            onCompleteAll: _confirmCompleteAll,
            onReset: _confirmResetCourse,
          ),
        );
      },
    );
  }

  Widget _buildCustomPracticeSliver(
    BuildContext context,
    AsyncValue<CourseExerciseSummary> exercisesAsync,
  ) {
    return exercisesAsync.when(
      loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
      error: (_, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
      data: (summary) {
        final customExercises = summary.courseExercises;

        return SliverToBoxAdapter(
          child: CustomPracticeSection(
            eligible: summary.eligible,
            lockedMessage:
                S.of(context).unlockCustomPracticeCourseHint,
            emptyMessage:
                S.of(context).noCustomExercisesYet,
            isCreating: _isCreatingCustom,
            error: _error,
            onCreate: _showCreationForm,
            onCancelCreate: () => _aiCancelToken?.cancel(),
            exerciseCards: customExercises
                .map(
                  (exercise) => _CourseExerciseCard(
                    progress: exercise,
                    isBusy: _busyExerciseId == exercise.exerciseId,
                    isRegenerating: _busyExerciseId == exercise.exerciseId &&
                        _busyAction == _BusyAction.regenerate,
                    onTap: () => _showInfoSheet(exercise),
                    onCancel: () => _aiCancelToken?.cancel(),
                  ),
                )
                .toList(),
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
    final levelColor = _getLevelColor(course.level, c);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
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
                      fontSize: AppTypography.titleSmall,
                      fontWeight: FontWeight.w700,
                      color: c.foreground,
                      height: 1.25,
                    ),
                  ),
                ),
              ],
            ),
            if (course.description.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                course.description,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyMedium,
                  color: c.mutedForeground,
                  height: 1.5,
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                _CourseMetaChip(
                  icon: Icons.menu_book_outlined,
                  label: '${course.modules.length} modules',
                ),
                if (course.estimatedHours != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  _CourseMetaChip(
                    icon: Icons.access_time_rounded,
                    label: '${course.estimatedHours}h',
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CourseMetaChip extends StatelessWidget {
  const _CourseMetaChip({required this.icon, required this.label});
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

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({
    required this.module,
    required this.index,
    required this.progressMap,
    required this.onTap,
  });
  final CourseModule module;
  final int index;
  final Map<String, UserProgress> progressMap;
  final VoidCallback onTap;

  bool get _isCompleted {
    if (module.lessons.isEmpty) return false;
    return module.lessons.every(
        (l) => progressMap.containsKey(l.id) && progressMap[l.id]!.status == 'completed');
  }

  bool get _hasProgress {
    return module.lessons.any((l) => progressMap.containsKey(l.id));
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final completed = _isCompleted;
    final inProgress = !completed && _hasProgress;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.md,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md + 2),
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Row(
              children: [
                _ModuleIndexBadge(
                  index: index,
                  completed: completed,
                  inProgress: inProgress,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        module.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyLarge,
                          fontWeight: FontWeight.w600,
                          color: c.foreground,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        module.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          color: c.mutedForeground,
                          height: 1.4,
                        ),
                      ),
                      if (module.estimatedHours != null) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Row(
                          children: [
                            Icon(Icons.access_time_rounded,
                                size: 12, color: c.mutedForeground),
                            const SizedBox(width: AppSpacing.xs),
                            Text(
                              '${module.estimatedHours}h',
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.caption,
                                color: c.mutedForeground,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Icon(Icons.chevron_right, color: c.mutedForeground, size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModuleIndexBadge extends StatelessWidget {
  const _ModuleIndexBadge({
    required this.index,
    required this.completed,
    required this.inProgress,
  });

  final int index;
  final bool completed;
  final bool inProgress;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final success = const Color(0xFF22C55E);

    final Color bg;
    final Color fg;
    if (completed) {
      bg = success.withValues(alpha: 0.12);
      fg = success;
    } else if (inProgress) {
      bg = c.primary.withValues(alpha: 0.12);
      fg = c.primary;
    } else {
      bg = c.muted;
      fg = c.foreground;
    }

    return Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: completed
          ? Icon(Icons.check_rounded, color: fg, size: 22)
          : Text(
              '${index + 1}',
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                fontWeight: FontWeight.w700,
                color: fg,
              ),
            ),
    );
  }
}

class _CourseExerciseCard extends StatelessWidget {
  const _CourseExerciseCard({
    required this.progress,
    this.isBusy = false,
    this.isRegenerating = false,
    this.onTap,
    this.onCancel,
  });

  final ExerciseProgress progress;
  final bool isBusy;
  final bool isRegenerating;
  final VoidCallback? onTap;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isBusy ? null : onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md + 2),
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: c.border, width: 1),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: c.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(Icons.auto_awesome, color: c.primary, size: 22),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        progress.title,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyLarge,
                          fontWeight: FontWeight.w600,
                          color: c.foreground,
                          height: 1.25,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (progress.description != null &&
                          progress.description!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          progress.description!,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodySmall,
                            color: c.mutedForeground,
                            height: 1.4,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 2),
                      Text(
                        progress.isCompleted
                            ? '${progress.percentCorrect.round()}%'
                            : progress.isInProgress
                                ? '${progress.percentComplete.round()}%'
                                : '${progress.totalQuestions} questions',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.caption,
                          color: c.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                _CourseExerciseTrailing(
                  progress: progress,
                  isBusy: isBusy,
                  isRegenerating: isRegenerating,
                  onCancel: onCancel,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CourseExerciseTrailing extends StatelessWidget {
  const _CourseExerciseTrailing({
    required this.progress,
    required this.isBusy,
    required this.isRegenerating,
    this.onCancel,
  });

  final ExerciseProgress progress;
  final bool isBusy;
  final bool isRegenerating;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    if (isBusy) {
      return SizedBox(
        width: 44,
        height: 44,
        child: isRegenerating && onCancel != null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const AppSpinner(size: 20, strokeWidth: 2),
                  const SizedBox(height: 2),
                  Text(
                    S.of(context).cancelButton2,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: c.mutedForeground,
                    ),
                  ),
                ],
              )
            : const Center(child: AppSpinner(size: 22)),
      );
    }
    if (progress.isCompleted) {
      return Icon(Icons.check_circle, color: c.primary, size: 26);
    }
    if (progress.isInProgress) {
      return SizedBox(
        width: 28,
        height: 28,
        child: AppProgress(
          value: progress.percentComplete / 100,
          color: c.primary,
        ),
      );
    }
    return Icon(Icons.play_circle_outline, color: c.primary, size: 26);
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
              return Container(
                margin: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  0,
                  AppSpacing.lg,
                  AppSpacing.md,
                ),
                padding: const EdgeInsets.all(AppSpacing.md + 2),
                decoration: BoxDecoration(
                  color: c.card,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: c.border, width: 1),
                ),
                child: Row(
                  children: [
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Shimmer.fromColors(
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
                          const SizedBox(height: AppSpacing.sm),
                          Shimmer.fromColors(
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
                        ],
                      ),
                    ),
                  ],
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
      appBar: AppAppBar(title: Text(S.of(context).courseDetailTitle)),
      body: Center(
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
                S.of(context).failedToLoadCourse,
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
      ),
    );
  }
}
