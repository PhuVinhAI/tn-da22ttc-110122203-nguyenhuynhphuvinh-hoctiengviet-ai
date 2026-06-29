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
import '../../../../l10n/app_localizations.dart';

const _levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

bool _isLevelHigher(String userLevel, String contentLevel) {
  final userIndex = _levelOrder.indexOf(userLevel);
  final contentIndex = _levelOrder.indexOf(contentLevel);
  return userIndex > contentIndex;
}

class ModuleDetailScreen extends ConsumerStatefulWidget {
  const ModuleDetailScreen({super.key, required this.moduleId});
  final String moduleId;

  @override
  ConsumerState<ModuleDetailScreen> createState() =>
      _ModuleDetailScreenState();
}

enum _BusyAction { none, create, regenerate, delete, reset, completeAll, resetModule }

class _ModuleDetailScreenState extends ConsumerState<ModuleDetailScreen>
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

  bool _moduleHasAnyProgress(
      CourseModule module, Map<String, UserProgress> progressMap) {
    for (final lesson in module.lessons) {
      if (progressMap.containsKey(lesson.id)) return true;
    }
    return false;
  }

  Future<void> _pushExercisePlay(String exerciseId) async {
    await context.push('/modules/${widget.moduleId}/exercises/play/$exerciseId');
    if (!mounted) return;
    await ref
        .read(moduleExercisesProvider(widget.moduleId).notifier)
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
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
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
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
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
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
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

  Future<void> _handleReset(String exerciseId) async {
    setState(() {
      _busyExerciseId = exerciseId;
      _busyAction = _BusyAction.reset;
      _error = null;
    });
    try {
      final notifier =
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
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
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
      await notifier.completeAllModuleProgress();
      ref.invalidate(userProgressProvider);
      ref.invalidate(moduleDetailProvider(widget.moduleId));
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

  Future<void> _handleResetModule() async {
    setState(() {
      _busyAction = _BusyAction.resetModule;
      _error = null;
    });
    try {
      final notifier =
          ref.read(moduleExercisesProvider(widget.moduleId).notifier);
      await notifier.resetModuleProgress();
      ref.invalidate(userProgressProvider);
      ref.invalidate(moduleDetailProvider(widget.moduleId));
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
              _handleReset(exerciseId);
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
            S.of(context).markModuleCompleteWarning,
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

  void _confirmResetModule() {
    AppDialog.show(
      context,
      builder: (dialogCtx) => AppDialog(
        title: S.of(context).resetAllProgressQuestion,
        content:
            S.of(context).resetModuleProgressWarning,
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
              _handleResetModule();
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final moduleAsync = ref.watch(moduleDetailProvider(widget.moduleId));
    final progressAsync = ref.watch(userProgressProvider);
    final userProfileAsync = ref.watch(userProfileProvider);
    final exercisesAsync =
        ref.watch(moduleExercisesProvider(widget.moduleId));

    return Scaffold(
      body: moduleAsync.when(
        loading: () => const _ModuleDetailLoading(),
        error: (error, stack) => _ModuleDetailError(
          onRetry: () => ref.invalidate(moduleDetailProvider(widget.moduleId)),
        ),
        data: (module) {
          final progressMap = _buildProgressMap(progressAsync);
          final userLevel = userProfileAsync.whenOrNull(
              data: (profile) => profile.currentLevel);
          final moduleLevel = module.course?.level;
          final showCompleteAll = userLevel != null &&
              moduleLevel != null &&
              _isLevelHigher(userLevel, moduleLevel);
          final hasProgress = _moduleHasAnyProgress(module, progressMap);
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                title: Text(module.title),
              ),
              SliverToBoxAdapter(child: _ModuleInfoSection(module: module)),
              _buildListHeaderSliver(
                exercisesAsync,
                showCompleteAll,
                hasProgress,
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final lesson = module.lessons[index];
                    final progress = progressMap[lesson.id];
                    return _LessonCard(lesson: lesson, progress: progress);
                  },
                  childCount: module.lessons.length,
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
    AsyncValue<ModuleExerciseSummary> exercisesAsync,
    bool showCompleteAll,
    bool hasProgress,
  ) {
    return exercisesAsync.when(
      loading: () => SliverToBoxAdapter(
        child: ContentListHeader(title: S.of(context).lessonsTitle),
      ),
      error: (_, _) => SliverToBoxAdapter(
        child: ContentListHeader(title: S.of(context).lessonsTitle),
      ),
      data: (summary) {
        final hasBypassProgress = summary.completedLessonsCount > 0;
        final shouldShowReset = hasProgress || hasBypassProgress;

        return SliverToBoxAdapter(
          child: ContentListHeader(
            title: S.of(context).lessonsTitle,
            progressText: S.of(context).completedCountParam(
                  summary.completedLessonsCount,
                  summary.totalLessonsCount,
                ),
            showCompleteAll: showCompleteAll,
            showReset: shouldShowReset,
            isCompletingAll: _busyAction == _BusyAction.completeAll,
            isResetting: _busyAction == _BusyAction.resetModule,
            onCompleteAll: _confirmCompleteAll,
            onReset: _confirmResetModule,
          ),
        );
      },
    );
  }

  Widget _buildCustomPracticeSliver(
    BuildContext context,
    AsyncValue<ModuleExerciseSummary> exercisesAsync,
  ) {
    return exercisesAsync.when(
      loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
      error: (_, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
      data: (summary) {
        final customExercises = summary.moduleExercises;

        return SliverToBoxAdapter(
          child: CustomPracticeSection(
            eligible: summary.eligible,
            lockedMessage:
                S.of(context).unlockCustomPracticeModuleHint,
            emptyMessage:
                S.of(context).noCustomExercisesYet,
            isCreating: _isCreatingCustom,
            error: _error,
            onCreate: _showCreationForm,
            onCancelCreate: () => _aiCancelToken?.cancel(),
            exerciseCards: customExercises
                .map(
                  (exercise) => _ModuleExerciseCard(
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

class _ModuleInfoSection extends StatelessWidget {
  const _ModuleInfoSection({required this.module});

  final CourseModule module;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

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
            Text(
              module.description,
              style: GoogleFonts.inter(
                fontSize: AppTypography.bodyMedium,
                color: c.foreground,
                height: 1.5,
              ),
            ),
            if (module.estimatedHours != null || module.course != null) ...[
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.xs,
                children: [
                  if (module.estimatedHours != null)
                    _ModuleMetaChip(
                      icon: Icons.access_time_rounded,
                      label: '${module.estimatedHours}h',
                    ),
                  if (module.course != null)
                    _ModuleMetaChip(
                      icon: Icons.school_outlined,
                      label: module.course!.title,
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ModuleMetaChip extends StatelessWidget {
  const _ModuleMetaChip({required this.icon, required this.label});
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

class _ModuleExerciseCard extends StatelessWidget {
  const _ModuleExerciseCard({
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
                _ModuleExerciseTrailing(
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

class _ModuleExerciseTrailing extends StatelessWidget {
  const _ModuleExerciseTrailing({
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

class _LessonCard extends StatelessWidget {
  const _LessonCard({required this.lesson, this.progress});

  final Lesson lesson;
  final UserProgress? progress;

  Color _statusColor(String? status, AppColors c) {
    return switch (status) {
      'completed' => c.success,
      'in_progress' => c.warning,
      _ => c.mutedForeground,
    };
  }

  IconData _statusIcon(String? status) {
    return switch (status) {
      'completed' => Icons.check_circle,
      'in_progress' => Icons.play_circle,
      _ => Icons.radio_button_unchecked,
    };
  }

  String _statusLabel(BuildContext context, String? status) {
    return switch (status) {
      'completed' => S.of(context).completedLabel,
      'in_progress' => S.of(context).inProgressLabel,
      _ => S.of(context).notStartedLabel,
    };
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '${minutes}m';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final statusColor = _statusColor(progress?.status, c);

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
          onTap: () => context.push('/lessons/${lesson.id}'),
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
                _LessonOrderBadge(orderIndex: lesson.orderIndex),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lesson.title,
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
                        lesson.description,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodySmall,
                          color: c.mutedForeground,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: AppSpacing.xs + 2),
                      Row(
                        children: [
                          if (lesson.estimatedDuration != null) ...[
                            Icon(Icons.access_time_rounded,
                                size: 12, color: c.mutedForeground),
                            const SizedBox(width: AppSpacing.xs),
                            Text(
                              _formatDuration(lesson.estimatedDuration!),
                              style: GoogleFonts.inter(
                                fontSize: AppTypography.caption,
                                color: c.mutedForeground,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                          ],
                          Icon(_statusIcon(progress?.status),
                              size: 13, color: statusColor),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            _statusLabel(context, progress?.status),
                            style: GoogleFonts.inter(
                              fontSize: AppTypography.caption,
                              fontWeight: FontWeight.w500,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
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

class _LessonOrderBadge extends StatelessWidget {
  const _LessonOrderBadge({required this.orderIndex});
  final int orderIndex;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      alignment: Alignment.center,
      child: Text(
        '$orderIndex',
        style: GoogleFonts.inter(
          fontSize: AppTypography.bodyLarge,
          fontWeight: FontWeight.w700,
          color: c.primary,
        ),
      ),
    );
  }
}

class _ModuleDetailLoading extends StatelessWidget {
  const _ModuleDetailLoading();

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
                    width: 100,
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
                                borderRadius:
                                    BorderRadius.circular(AppRadius.sm),
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
                                borderRadius:
                                    BorderRadius.circular(AppRadius.sm),
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
            childCount: 5,
          ),
        ),
      ],
    );
  }
}

class _ModuleDetailError extends StatelessWidget {
  const _ModuleDetailError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Scaffold(
      appBar: AppAppBar(title: Text(S.of(context).moduleDetailTitle)),
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
                S.of(context).failedToLoadModule,
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
