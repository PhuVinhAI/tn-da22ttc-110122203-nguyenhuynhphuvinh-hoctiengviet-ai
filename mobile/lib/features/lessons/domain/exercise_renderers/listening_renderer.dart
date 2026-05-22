import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';

import '../../../../core/network/media_url.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class ListeningRenderer extends ExerciseRenderer {
  const ListeningRenderer();

  @override
  ExerciseType get type => ExerciseType.listening;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    return answer is String && answer.trim().isNotEmpty;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'transcript': (answer as String).trim()};
  }

  @override
  Widget buildQuestion(Exercise exercise, BuildContext context) {
    return Text(
      exercise.question,
      style: Theme.of(
        context,
      ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
    );
  }

  @override
  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = exercise.options as ListeningOptions;
    return _ListeningInput(
      exerciseId: exercise.id,
      audioUrl: options.audioUrl,
      currentAnswer: currentAnswer is String ? currentAnswer : '',
      onAnswerChanged: onAnswerChanged,
    );
  }
}

class _ListeningInput extends StatefulWidget {
  const _ListeningInput({
    required this.exerciseId,
    required this.audioUrl,
    required this.currentAnswer,
    required this.onAnswerChanged,
  });

  final String exerciseId;
  final String audioUrl;
  final String currentAnswer;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_ListeningInput> createState() => _ListeningInputState();
}

class _ListeningInputState extends State<_ListeningInput> {
  final _player = AudioPlayer();
  late final TextEditingController _transcriptController;

  StreamSubscription<PlayerState>? _playerStateSub;
  StreamSubscription<Duration>? _positionSub;
  StreamSubscription<Duration?>? _durationSub;

  bool _isPlaying = false;
  bool _isLoading = true;
  bool _hasError = false;
  int _playCount = 0;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;

  @override
  void initState() {
    super.initState();
    _transcriptController = TextEditingController(text: widget.currentAnswer);
    _playerStateSub = _player.playerStateStream.listen(_handlePlayerState);
    _positionSub = _player.positionStream.listen((p) {
      if (mounted) setState(() => _position = p);
    });
    _durationSub = _player.durationStream.listen((d) {
      if (mounted && d != null) setState(() => _duration = d);
    });
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    try {
      await _player.setUrl(resolveMediaUrl(widget.audioUrl));
      if (mounted) setState(() => _isLoading = false);
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _playerStateSub?.cancel();
    _positionSub?.cancel();
    _durationSub?.cancel();
    _player.dispose();
    _transcriptController.dispose();
    super.dispose();
  }

  void _handlePlayerState(PlayerState state) {
    if (!mounted) return;
    final playing =
        state.playing && state.processingState != ProcessingState.completed;
    if (_isPlaying != playing) {
      setState(() => _isPlaying = playing);
    }
    if (state.processingState == ProcessingState.completed) {
      unawaited(_player.seek(Duration.zero));
      unawaited(_player.pause());
    }
  }

  Future<void> _togglePlay() async {
    if (_hasError) return;
    if (_isPlaying) {
      await _player.pause();
      return;
    }
    if (_player.processingState == ProcessingState.completed) {
      await _player.seek(Duration.zero);
    }
    await _player.play();
    if (mounted) setState(() => _playCount++);
  }

  Future<void> _replay() async {
    if (_hasError) return;
    await _player.seek(Duration.zero);
    await _player.play();
    if (mounted) setState(() => _playCount++);
  }

  String _formatTime(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final visuals = getExerciseVisuals(context, ExerciseType.listening);

    final progress = _duration.inMilliseconds == 0
        ? 0.0
        : (_position.inMilliseconds / _duration.inMilliseconds).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Instruction header
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            color: visuals.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.20),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.headphones_rounded,
                size: 20,
                color: visuals.accent,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  'Listen carefully and type what you hear',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: visuals.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (_playCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: visuals.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text(
                    '×$_playCount',
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.caption,
                      fontWeight: FontWeight.w700,
                      color: visuals.accent,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // Audio player card
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xl,
          ),
          decoration: BoxDecoration(
            color: visuals.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.25),
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              // Big circular play button with progress ring
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox.square(
                    dimension: 96,
                    child: CircularProgressIndicator(
                      value: progress == 0 && !_isPlaying ? null : progress,
                      strokeWidth: 4,
                      color: visuals.accent,
                      backgroundColor: visuals.accent.withValues(alpha: 0.15),
                    ),
                  ),
                  Material(
                    color: visuals.accent,
                    shape: const CircleBorder(),
                    elevation: 0,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: _isLoading || _hasError ? null : _togglePlay,
                      child: SizedBox.square(
                        dimension: 76,
                        child: _isLoading
                            ? const Padding(
                                padding: EdgeInsets.all(22),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : Icon(
                                _isPlaying
                                    ? Icons.pause_rounded
                                    : Icons.play_arrow_rounded,
                                color: Colors.white,
                                size: 40,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),

              // Time row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _formatTime(_position),
                    style: GoogleFonts.robotoMono(
                      fontSize: AppTypography.bodySmall,
                      fontWeight: FontWeight.w600,
                      color: visuals.accent,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                    ),
                    child: Text(
                      '/',
                      style: GoogleFonts.robotoMono(
                        fontSize: AppTypography.bodySmall,
                        color: c.mutedForeground,
                      ),
                    ),
                  ),
                  Text(
                    _formatTime(_duration),
                    style: GoogleFonts.robotoMono(
                      fontSize: AppTypography.bodySmall,
                      color: c.mutedForeground,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              // Replay button
              if (!_isLoading && !_hasError)
                TextButton.icon(
                  onPressed: _replay,
                  icon: Icon(
                    Icons.replay_rounded,
                    size: 18,
                    color: visuals.accent,
                  ),
                  label: Text(
                    'Play again',
                    style: GoogleFonts.inter(
                      fontSize: AppTypography.bodySmall,
                      fontWeight: FontWeight.w600,
                      color: visuals.accent,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                  ),
                ),
              if (_hasError)
                Text(
                  'Could not load audio',
                  style: theme.textTheme.bodySmall?.copyWith(color: c.error),
                ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // Transcription input
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.30),
              width: 1.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Label header
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm + 2,
                ),
                decoration: BoxDecoration(
                  color: visuals.accent.withValues(alpha: 0.08),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppRadius.lg - 1),
                    topRight: Radius.circular(AppRadius.lg - 1),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.edit_note_rounded,
                      size: 18,
                      color: visuals.accent,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Your transcription',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: visuals.accent.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_transcriptController.text.length}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: c.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
              // Input
              TextFormField(
                controller: _transcriptController,
                onChanged: (value) {
                  widget.onAnswerChanged(value);
                  setState(() {});
                },
                maxLines: 4,
                minLines: 3,
                style: GoogleFonts.inter(
                  fontSize: AppTypography.bodyLarge,
                  fontWeight: FontWeight.w500,
                  color: c.foreground,
                  height: 1.5,
                ),
                decoration: InputDecoration(
                  hintText: 'Type what you hear...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: AppTypography.bodyMedium,
                    color: c.mutedForeground.withValues(alpha: 0.5),
                    fontStyle: FontStyle.italic,
                  ),
                  filled: false,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.all(AppSpacing.lg),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
