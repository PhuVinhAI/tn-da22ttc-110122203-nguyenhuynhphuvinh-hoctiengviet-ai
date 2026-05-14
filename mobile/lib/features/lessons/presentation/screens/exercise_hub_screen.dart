import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../data/lesson_providers.dart';
import '../../domain/exercise_set_models.dart';
import '../widgets/custom_practice_bottom_sheet.dart';

class ExerciseHubScreen extends ConsumerStatefulWidget {
  const ExerciseHubScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  ConsumerState<ExerciseHubScreen> createState() => _ExerciseHubScreenState();
}

enum _BusyAction { none, regenerate, delete, reset, create }

class _ExerciseHubScreenState extends ConsumerState<ExerciseHubScreen>
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
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _cleanupIncompleteSet();
    }
  }

  Future<void> _pushExercisePlay(String setId) async {
    await context.push('/lessons/${widget.lessonId}/exercises/play/$setId');
    if (!mounted) return;
    await ref.read(exerciseSetsProvider(widget.lessonId).notifier).refresh();
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
      final notifier = ref.read(exerciseSetsProvider(widget.lessonId).notifier);
      newSetId = await notifier.regenerateSet(setId, userPrompt: userPrompt);
      _regeneratingNewSetId = newSetId;

      final token = _newAiCancelToken();
      await notifier.generateSet(newSetId, userPrompt: userPrompt, cancelToken: token);
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
      final notifier = ref.read(exerciseSetsProvider(widget.lessonId).notifier);
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

  Future<void> _handleReset(String setId) async {
    setState(() {
      _busySetId = setId;
      _busyAction = _BusyAction.reset;
      _error = null;
    });
    try {
      final notifier = ref.read(exerciseSetsProvider(widget.lessonId).notifier);
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

  Future<void> _handleCreateCustom(CustomSetConfig config) async {
    setState(() {
      _isCreatingCustom = true;
      _busyAction = _BusyAction.create;
      _error = null;
    });
    String? setId;
    try {
      final notifier = ref.read(exerciseSetsProvider(widget.lessonId).notifier);
      final set = await notifier.createCustomSet(config);
      setId = set.id;
      _creatingSetId = setId;

      final token = _newAiCancelToken();
      await notifier.generateSet(setId, userPrompt: config.userPrompt, cancelToken: token);
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
              _handleReset(setId);
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

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final summaryAsync = ref.watch(exerciseSetsProvider(widget.lessonId));

    return Scaffold(
      appBar: const AppAppBar(title: Text('Practice')),
      body: summaryAsync.when(
        loading: () => const Center(child: AppSpinner()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Failed to load exercises', style: theme.textTheme.bodyLarge, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Retry',
                  variant: AppButtonVariant.primary,
                  onPressed: () => ref.read(exerciseSetsProvider(widget.lessonId).notifier).refresh(),
                ),
              ],
            ),
          ),
        ),
        data: (summary) {
          final defaultSets = summary.defaultSets;
          final customSets = summary.customSets;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (defaultSets.isNotEmpty) ...[
                Text(
                  'Lesson Exercises',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Practice with the lesson\'s built-in exercises',
                  style: theme.textTheme.bodyMedium?.copyWith(color: c.mutedForeground),
                ),
                const SizedBox(height: 16),
                ...defaultSets.map((set) => _SetCard(
                  progress: set,
                  isBusy: _busySetId == set.setId,
                  onPlay: () => _pushExercisePlay(set.setId),
                  onReset: () => _confirmReset(set.setId, set.title),
                )),
                const SizedBox(height: 32),
              ],
              Row(
                children: [
                  Icon(Icons.auto_awesome, color: c.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Custom Practice',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Generate AI-powered exercises tailored to your needs',
                style: theme.textTheme.bodyMedium?.copyWith(color: c.mutedForeground),
              ),
              const SizedBox(height: 16),
              if (_isCreatingCustom) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: AppButton(
                    label: 'Generating exercises...',
                    variant: AppButtonVariant.secondary,
                    onPressed: null,
                    icon: const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
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
                    label: 'Create custom set',
                    variant: AppButtonVariant.primary,
                    onPressed: _showCreationForm,
                    icon: const Icon(Icons.add),
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: theme.textTheme.bodySmall?.copyWith(color: c.error)),
              ],
              const SizedBox(height: 12),
              ...customSets.map((set) => _SetCard(
                progress: set,
                isBusy: _busySetId == set.setId,
                onPlay: () => _pushExercisePlay(set.setId),
                onReset: () => _confirmReset(set.setId, set.title),
                onRegenerate: () => _confirmRegenerate(set.setId, set.title, set.userPrompt),
                onDelete: () => _confirmDelete(set.setId),
                onCancel: (_busySetId == set.setId &&
                        _busyAction == _BusyAction.regenerate)
                    ? () => _aiCancelToken?.cancel()
                    : null,
                onInfo: () => _showInfoSheet(set),
                isCustom: true,
              )),
              if (customSets.isEmpty && defaultSets.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 32),
                  child: Center(
                    child: Text(
                      'No exercises yet. Create a custom set to start practicing!',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(color: c.mutedForeground),
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

class _SetCard extends StatelessWidget {
  const _SetCard({
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

  final SetProgress progress;
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
                        'Actions',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: c.foreground,
                            ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Close',
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
                  title: 'Regenerate exercises',
                  subtitle: 'Replace all questions with new AI content',
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
                  title: 'Reset progress',
                  subtitle: 'Clear your answers and start over',
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
                  title: 'Delete set',
                  subtitle: 'Remove from custom practice list',
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
    final theme = Theme.of(context);
    final color = isCustom ? c.accent : c.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: EdgeInsets.zero,
        child: Row(
          children: [
            Expanded(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: isCustom ? onInfo : onPlay,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isCustom ? Icons.auto_awesome : Icons.edit_note,
                            color: color,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                progress.title,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (progress.description != null &&
                                  progress.description!.isNotEmpty)
                                Text(
                                  progress.description!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: c.mutedForeground,
                                  ),
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
                                  color: c.mutedForeground,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (progress.isCompleted)
                          Icon(Icons.check_circle, color: color, size: 28)
                        else if (progress.isInProgress)
                          SizedBox(
                            width: 32,
                            height: 32,
                            child: AppProgress(
                              value: progress.percentComplete / 100,
                              color: color,
                            ),
                          )
                        else
                          Icon(Icons.play_circle_outline, color: color, size: 28),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SizedBox(
              width: isBusy && onCancel != null ? 72 : 48,
              height: 48,
              child: isBusy
                  ? (onCancel != null
                      ? Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: onCancel,
                            borderRadius: BorderRadius.circular(12),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const AppSpinner(size: 20, strokeWidth: 2),
                                const SizedBox(height: 2),
                                Text(
                                  'Cancel',
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: c.mutedForeground,
                                    fontSize: 10,
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
                      tooltip: 'Actions',
                      onPressed: () => _openActionsMenu(context),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
