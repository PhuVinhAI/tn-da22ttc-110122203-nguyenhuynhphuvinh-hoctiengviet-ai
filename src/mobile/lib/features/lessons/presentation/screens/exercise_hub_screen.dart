import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/lesson_providers.dart';
import '../../data/lesson_repository.dart';
import '../../data/lesson_time_tracker.dart';
import '../../domain/exercise_models.dart';
import '../widgets/custom_practice_bottom_sheet.dart';
import '../../../assistant/data/exercise_hub_view_state_provider.dart';

class ExerciseHubScreen extends ConsumerStatefulWidget {
  const ExerciseHubScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  ConsumerState<ExerciseHubScreen> createState() => _ExerciseHubScreenState();
}

enum _BusyAction { none, regenerate, delete, reset, create }

String? _busyActionName(_BusyAction action) => switch (action) {
      _BusyAction.none => null,
      _BusyAction.regenerate => 'regenerate',
      _BusyAction.delete => 'delete',
      _BusyAction.reset => 'reset',
      _BusyAction.create => 'create',
    };

class _ExerciseHubScreenState extends ConsumerState<ExerciseHubScreen>
    with WidgetsBindingObserver {
  String? _busyExerciseId;
  _BusyAction _busyAction = _BusyAction.none;
  String? _error;
  bool _isCreatingCustom = false;

  void _publishHubViewState() {
    final next = ExerciseHubViewState(
      isCreatingCustom: _isCreatingCustom,
      busyExerciseId: _busyExerciseId,
      busyAction: _busyActionName(_busyAction),
      actionError: _error,
    );
    ref.read(exerciseHubViewStateProvider.notifier).set(next);
  }
  String? _creatingExerciseId;
  String? _regeneratingNewExerciseId;
  CancelToken? _aiCancelToken;
  LessonTimeTracker? _lessonTimeTracker;
  // Cached so cleanup paths that run during/after dispose don't touch `ref`.
  late final LessonRepository _lessonRepo;
  LessonProgressNotifier? _progressNotifier;

  void _bindLessonTimeTracker() {
    if (_lessonTimeTracker != null) {
      if (!_lessonTimeTracker!.isRunning) _lessonTimeTracker!.start();
      return;
    }
    _progressNotifier ??=
        ref.read(lessonProgressProvider(widget.lessonId).notifier);
    final notifier = _progressNotifier!;
    _lessonTimeTracker = LessonTimeTracker(
      onFlush: (seconds) => notifier.addTimeSpent(seconds),
    );
    _lessonTimeTracker!.start();
  }

  CancelToken _newAiCancelToken() {
    _aiCancelToken?.cancel();
    final next = CancelToken();
    _aiCancelToken = next;
    return next;
  }

  @override
  void initState() {
    super.initState();
    _lessonRepo = ref.read(lessonRepositoryProvider);
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _bindLessonTimeTracker();
    });
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
    unawaited(_lessonTimeTracker?.stop());
    try {
      ref.read(exerciseHubViewStateProvider.notifier).clear();
    } catch (_) {}
    super.dispose();
  }

  void _cleanupIncompleteExercise() {
    if (_creatingExerciseId != null) {
      final id = _creatingExerciseId!;
      _creatingExerciseId = null;
      _lessonRepo.deleteCustomExercise(id).catchError((_) {});
    }
    if (_regeneratingNewExerciseId != null) {
      final id = _regeneratingNewExerciseId!;
      _regeneratingNewExerciseId = null;
      _lessonRepo.deleteCustomExercise(id).catchError((_) {});
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        _cleanupIncompleteExercise();
        unawaited(_lessonTimeTracker?.pauseAndFlush());
      case AppLifecycleState.resumed:
        _lessonTimeTracker?.resume();
    }
  }

  Future<void> _pushExercisePlay(String exerciseId) async {
    await _lessonTimeTracker?.pauseAndFlush();
    if (!mounted) return;
    await context.push('/lessons/${widget.lessonId}/exercises/play/$exerciseId');
    if (!mounted) return;
    _lessonTimeTracker?.start();
    await ref.read(exercisesProvider(widget.lessonId).notifier).refresh();
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
      final notifier = ref.read(exercisesProvider(widget.lessonId).notifier);
      newExerciseId = await notifier.regenerateExercise(exerciseId, userPrompt: userPrompt);
      _regeneratingNewExerciseId = newExerciseId;

      final token = _newAiCancelToken();
      await notifier.generateExercise(newExerciseId, userPrompt: userPrompt, cancelToken: token);
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
      final notifier = ref.read(exercisesProvider(widget.lessonId).notifier);
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
      final notifier = ref.read(exercisesProvider(widget.lessonId).notifier);
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

  Future<void> _handleCreateCustom(CustomExerciseConfig config) async {
    setState(() {
      _isCreatingCustom = true;
      _busyAction = _BusyAction.create;
      _error = null;
    });
    String? exerciseId;
    try {
      final notifier = ref.read(exercisesProvider(widget.lessonId).notifier);
      final exercise = await notifier.createCustomExercise(config);
      exerciseId = exercise.id;
      _creatingExerciseId = exerciseId;

      final token = _newAiCancelToken();
      await notifier.generateExercise(exerciseId, userPrompt: config.userPrompt, cancelToken: token);
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

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final summaryAsync = ref.watch(exercisesProvider(widget.lessonId));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _publishHubViewState();
    });

    return Scaffold(
      appBar: AppAppBar(title: Text(S.of(context).questionsTitle)),
      body: summaryAsync.when(
        loading: () => const _ExerciseHubLoading(),
        error: (e, _) => Center(
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
                  S.of(context).failedToLoadLesson,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodyLarge,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  e.toString(),
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.mutedForeground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.lg),
                AppButton(
                  label: S.of(context).retryButton,
                  variant: AppButtonVariant.primary,
                  icon: const Icon(Icons.refresh),
                  onPressed: () => ref.read(exercisesProvider(widget.lessonId).notifier).refresh(),
                ),
              ],
            ),
          ),
        ),
        data: (summary) {
          final defaultExercises = summary.defaultExercises;
          final customExercises = summary.customExercises;

          return ListView(
            padding: AppNavBar.scrollPadding(
              context,
              base: const EdgeInsets.all(AppSpacing.lg),
            ),
            children: [
              if (defaultExercises.isNotEmpty) ...[
                _HubSectionHeader(
                  title: S.of(context).lessonExercisesTitle,
                  subtitle: S.of(context).practiceWithLessonDesc,
                ),
                const SizedBox(height: AppSpacing.md),
                ...defaultExercises.map((exercise) => _ExerciseCard(
                  progress: exercise,
                  isBusy: _busyExerciseId == exercise.exerciseId,
                  onPlay: () => _pushExercisePlay(exercise.exerciseId),
                  onReset: () => _confirmReset(exercise.exerciseId, exercise.title),
                )),
                const SizedBox(height: AppSpacing.xl),
              ],
              _HubSectionHeader(
                title: S.of(context).customPracticeLabel,
                subtitle: S.of(context).generateAiExercisesTailored,
                icon: Icons.auto_awesome,
              ),
              const SizedBox(height: AppSpacing.md),
              if (_isCreatingCustom) ...[
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    label: S.of(context).generatingExercises,
                    variant: AppButtonVariant.secondary,
                    onPressed: null,
                    icon: const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    label: S.of(context).cancelButton2,
                    variant: AppButtonVariant.outline,
                    onPressed: () => _aiCancelToken?.cancel(),
                  ),
                ),
              ] else
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    label: S.of(context).createCustomExercise,
                    variant: AppButtonVariant.primary,
                    onPressed: _showCreationForm,
                    icon: const Icon(Icons.add),
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  _error!,
                  style: GoogleFonts.inter(
                    fontSize: AppTypography.bodySmall,
                    color: c.error,
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              ...customExercises.map((exercise) => _ExerciseCard(
                progress: exercise,
                isBusy: _busyExerciseId == exercise.exerciseId,
                onPlay: () => _pushExercisePlay(exercise.exerciseId),
                onReset: () => _confirmReset(exercise.exerciseId, exercise.title),
                onRegenerate: () => _confirmRegenerate(exercise.exerciseId, exercise.title, exercise.userPrompt),
                onDelete: () => _confirmDelete(exercise.exerciseId),
                onCancel: (_busyExerciseId == exercise.exerciseId &&
                        _busyAction == _BusyAction.regenerate)
                    ? () => _aiCancelToken?.cancel()
                    : null,
                onInfo: () => _showInfoSheet(exercise),
                isCustom: true,
              )),
              if (customExercises.isEmpty && defaultExercises.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 48),
                  child: Center(
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
                          child: Icon(
                            Icons.edit_note_rounded,
                            size: 30,
                            color: c.primary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text(
                          S.of(context).noExercisesYet,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodyLarge,
                            fontWeight: FontWeight.w600,
                            color: c.foreground,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          S.of(context).createCustomExercisePrompt,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: AppTypography.bodyMedium,
                            color: c.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _HubSectionHeader extends StatelessWidget {
  const _HubSectionHeader({
    required this.title,
    this.subtitle,
    this.icon,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: c.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.sm + 2),
                ),
                child: Icon(icon, color: c.primary, size: 18),
              ),
              const SizedBox(width: AppSpacing.sm),
            ],
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
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: AppTypography.bodySmall,
              color: c.mutedForeground,
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }
}

class _ExerciseHubLoading extends StatelessWidget {
  const _ExerciseHubLoading();

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);

    Widget buildCardShimmer() {
      return Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.md),
        child: Container(
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
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 120,
                        height: 16,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 200,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Shimmer.fromColors(
                      baseColor: c.muted,
                      highlightColor: c.card,
                      child: Container(
                        width: 80,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Shimmer.fromColors(
                baseColor: c.muted,
                highlightColor: c.card,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Shimmer.fromColors(
          baseColor: c.muted,
          highlightColor: c.card,
          child: Container(
            width: 160,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Shimmer.fromColors(
          baseColor: c.muted,
          highlightColor: c.card,
          child: Container(
            width: 280,
            height: 14,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        ),
        const SizedBox(height: 16),
        buildCardShimmer(),
        buildCardShimmer(),
        const SizedBox(height: 24),
        Row(
          children: [
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Shimmer.fromColors(
              baseColor: c.muted,
              highlightColor: c.card,
              child: Container(
                width: 160,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Shimmer.fromColors(
          baseColor: c.muted,
          highlightColor: c.card,
          child: Container(
            width: 280,
            height: 14,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Shimmer.fromColors(
          baseColor: c.muted,
          highlightColor: c.card,
          child: Container(
            width: double.infinity,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
          ),
        ),
      ],
    );
  }
}

class _ExerciseCard extends StatelessWidget {
  const _ExerciseCard({
    required this.progress,
    required this.isBusy,
    this.onPlay,
    this.onReset,
    this.onRegenerate,
    this.onDelete,
    this.onCancel,
    this.onInfo,
    this.isCustom = false,
  });

  final ExerciseProgress progress;
  final bool isBusy;
  final VoidCallback? onPlay;
  final VoidCallback? onReset;
  final VoidCallback? onRegenerate;
  final VoidCallback? onDelete;
  final VoidCallback? onCancel;
  final VoidCallback? onInfo;
  final bool isCustom;

  void _openActionsMenu(BuildContext context) {
    final c = AppTheme.colors(context);
    AppBottomSheet.show(
      context,
      builder: (sheetCtx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.md,
                  AppSpacing.sm,
                  AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        S.of(context).actionsTitle,
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.titleMedium,
                          fontWeight: FontWeight.w700,
                          color: c.foreground,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: S.of(context).closeButton,
                      onPressed: () => Navigator.pop(sheetCtx),
                      icon: Icon(Icons.close, color: c.mutedForeground),
                      style: IconButton.styleFrom(
                        foregroundColor: c.mutedForeground,
                        minimumSize: const Size(48, 48),
                        fixedSize: const Size(48, 48),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: c.border),
              if (isCustom && onRegenerate != null)
                AppListItem(
                  leading: Icon(Icons.auto_awesome, color: c.primary, size: 22),
                  title: S.of(context).regenerateExercises,
                  subtitle: S.of(context).replaceAllQuestionsAI,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    onRegenerate!();
                  },
                ),
              if (onReset != null)
                AppListItem(
                  leading: Icon(Icons.replay, color: c.warning, size: 22),
                  title: S.of(context).resetProgress,
                  subtitle: S.of(context).clearAnswersStartOver,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    onReset!();
                  },
                ),
              if (isCustom && onDelete != null)
                AppListItem(
                  leading: Icon(Icons.delete_outline, color: c.error, size: 22),
                  title: S.of(context).deleteExercise,
                  subtitle: S.of(context).removeFromCustomPracticeList,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    onDelete!();
                  },
                ),
              const SizedBox(height: AppSpacing.sm),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final color = c.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          color: c.card,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: c.border, width: 1),
        ),
        child: Row(
          children: [
            Expanded(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: isCustom ? onInfo : onPlay,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md + 2),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Icon(
                            isCustom ? Icons.auto_awesome : Icons.edit_note,
                            color: color,
                            size: 22,
                          ),
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
                        if (progress.isCompleted)
                          Icon(Icons.check_circle, color: color, size: 26)
                        else if (progress.isInProgress)
                          SizedBox(
                            width: 28,
                            height: 28,
                            child: AppProgress(
                              value: progress.percentComplete / 100,
                              color: color,
                            ),
                          )
                        else
                          Icon(Icons.play_circle_outline, color: color, size: 26),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            if (isCustom && isBusy && onCancel != null)
              SizedBox(
                width: 72,
                height: 48,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onCancel,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    child: Column(
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
                    ),
                  ),
                ),
              )
            else if (!isCustom)
              SizedBox(
                width: isBusy && onCancel != null ? 72 : 48,
                height: 48,
                child: isBusy
                    ? (onCancel != null
                        ? Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: onCancel,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                              child: Column(
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
                              ),
                            ),
                          )
                        : const Center(
                            child: AppSpinner(size: 22),
                          ))
                    : IconButton(
                        icon: Icon(Icons.keyboard_arrow_down_rounded,
                            color: c.mutedForeground, size: 26),
                        tooltip: S.of(context).actionsTitle,
                        onPressed: () => _openActionsMenu(context),
                      ),
              ),
          ],
        ),
      ),
    );
  }
}
