import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../../../core/network/media_url.dart';
import '../../../../core/services/speech_recognizer.dart';
import '../../../../core/theme/app_theme.dart';
import '../exercise_models.dart';
import '../exercise_renderer.dart';
import '../exercise_theme_helper.dart';

class SpeakingRenderer extends ExerciseRenderer {
  const SpeakingRenderer();

  @override
  ExerciseType get type => ExerciseType.speaking;

  @override
  bool get showsQuestion => false;

  @override
  bool validateAnswer(Exercise exercise, dynamic answer) {
    return answer is String && answer.trim().isNotEmpty;
  }

  @override
  Map<String, dynamic> buildAnswerPayload(dynamic answer) {
    return {'transcript': (answer as String).trim()};
  }

  @override
  Widget buildQuestion(Exercise exercise, BuildContext context) =>
      const SizedBox.shrink();

  @override
  Widget buildInput(
    Exercise exercise,
    BuildContext context,
    dynamic currentAnswer,
    ValueChanged<dynamic> onAnswerChanged,
  ) {
    final options = exercise.options as SpeakingOptions;
    return _SpeakingInput(
      exerciseId: exercise.id,
      promptText: options.promptText,
      promptAudioUrl: exercise.questionAudioUrl ?? options.promptAudioUrl,
      currentAnswer: currentAnswer is String ? currentAnswer : '',
      onAnswerChanged: onAnswerChanged,
    );
  }
}

class _SpeakingInput extends StatefulWidget {
  const _SpeakingInput({
    required this.exerciseId,
    required this.currentAnswer,
    required this.onAnswerChanged,
    this.promptText,
    this.promptAudioUrl = '',
  });

  final String exerciseId;
  final String? promptText;
  final String promptAudioUrl;
  final String currentAnswer;
  final ValueChanged<dynamic> onAnswerChanged;

  @override
  State<_SpeakingInput> createState() => _SpeakingInputState();
}

class _SpeakingInputState extends State<_SpeakingInput>
    with SingleTickerProviderStateMixin {
  final _recognizer = AppSpeechRecognizer.instance;
  final _promptPlayer = AudioPlayer();
  late final TextEditingController _transcriptController;
  late final AnimationController _pulseController;

  StreamSubscription<String>? _statusSub;
  StreamSubscription<String>? _errorSub;
  StreamSubscription<PlayerState>? _playerSub;

  bool _isListening = false;
  bool _isPlayingPrompt = false;
  String? _error;
  String _lastCommittedTranscript = '';

  bool get _hasPromptAudio => widget.promptAudioUrl.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    _transcriptController = TextEditingController(text: widget.currentAnswer);
    _lastCommittedTranscript = widget.currentAnswer.trim();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _statusSub = _recognizer.statuses.listen(_handleStatus);
    _errorSub = _recognizer.errors.listen(_handleError);
    _playerSub = _promptPlayer.playerStateStream.listen(_handlePlayerState);
  }

  @override
  void didUpdateWidget(covariant _SpeakingInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.exerciseId != widget.exerciseId ||
        oldWidget.currentAnswer != widget.currentAnswer) {
      _lastCommittedTranscript = widget.currentAnswer.trim();
      _setTranscript(widget.currentAnswer);
      _error = null;
    }
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    _errorSub?.cancel();
    _playerSub?.cancel();
    _pulseController.dispose();
    if (_recognizer.isListening) {
      unawaited(_recognizer.stop());
    }
    _promptPlayer.dispose();
    _transcriptController.dispose();
    super.dispose();
  }

  Future<void> _togglePromptAudio() async {
    if (!_hasPromptAudio) return;

    try {
      if (_isPlayingPrompt) {
        await _promptPlayer.pause();
        return;
      }

      await _promptPlayer.setUrl(resolveMediaUrl(widget.promptAudioUrl));
      await _promptPlayer.seek(Duration.zero);
      await _promptPlayer.play();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not play the prompt audio.';
      });
    }
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _recognizer.stop();
      return;
    }

    setState(() {
      _error = null;
      _lastCommittedTranscript = '';
      _setTranscript('');
    });
    widget.onAnswerChanged('');

    final ready = await _recognizer.ensureReady();
    if (!mounted) return;
    if (!ready) {
      setState(() {
        _error = 'Speech recognition is not available on this device.';
      });
      return;
    }

    try {
      await _recognizer.listen(onResult: _handleSpeechResult);
      if (mounted) {
        setState(() => _isListening = true);
        _pulseController.repeat();
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isListening = false;
        _error = 'Could not start speech recognition.';
      });
      _pulseController.stop();
    }
  }

  void _handleSpeechResult(SpeechRecognitionResult result) {
    final transcript = result.recognizedWords.trim();
    if (!mounted || transcript.isEmpty) return;

    setState(() => _setTranscript(transcript));
    if (result.finalResult) {
      _commitTranscript(transcript);
    }
  }

  void _handleStatus(String status) {
    if (!mounted) return;

    final listening = status == stt.SpeechToText.listeningStatus;
    setState(() => _isListening = listening);

    if (listening) {
      if (!_pulseController.isAnimating) _pulseController.repeat();
    } else {
      _pulseController.stop();
      _pulseController.value = 0;
    }

    if (status == stt.SpeechToText.doneStatus ||
        status == stt.SpeechToText.notListeningStatus) {
      _commitTranscript(_transcriptController.text);
    }
  }

  void _handleError(String message) {
    if (!mounted) return;
    setState(() {
      _isListening = false;
      _error = message;
    });
    _pulseController.stop();
    _pulseController.value = 0;
  }

  void _handlePlayerState(PlayerState state) {
    if (!mounted) return;
    final playing =
        state.playing && state.processingState != ProcessingState.completed;
    if (_isPlayingPrompt != playing) {
      setState(() => _isPlayingPrompt = playing);
    }
    if (state.processingState == ProcessingState.completed) {
      unawaited(_promptPlayer.seek(Duration.zero));
    }
  }

  void _commitTranscript(String transcript) {
    final cleaned = transcript.trim();
    if (cleaned.isEmpty || cleaned == _lastCommittedTranscript) return;
    _lastCommittedTranscript = cleaned;
    widget.onAnswerChanged(cleaned);
  }

  void _setTranscript(String value) {
    _transcriptController.text = value;
    _transcriptController.selection = TextSelection.collapsed(
      offset: _transcriptController.text.length,
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = AppTheme.colors(context);
    final theme = Theme.of(context);
    final visuals = getExerciseVisuals(context, ExerciseType.speaking);
    final hasTranscript = _transcriptController.text.trim().isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Prompt card
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: visuals.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: visuals.accent.withValues(alpha: 0.25),
              width: 1.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.record_voice_over_rounded,
                    size: 18,
                    color: visuals.accent,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Say this aloud',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: visuals.accent.withValues(alpha: 0.85),
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const Spacer(),
                  if (_hasPromptAudio)
                    Material(
                      color: visuals.accent.withValues(alpha: 0.12),
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: _togglePromptAudio,
                        child: SizedBox.square(
                          dimension: 36,
                          child: Icon(
                            _isPlayingPrompt
                                ? Icons.pause_rounded
                                : Icons.volume_up_rounded,
                            color: visuals.accent,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              if ((widget.promptText ?? '').isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  widget.promptText!,
                  style: AppTheme.vnStyle(
                    fontSize: AppTypography.titleSmall,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                    height: 1.5,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // Mic button with animated pulse rings
        Center(
          child: Column(
            children: [
              SizedBox.square(
                dimension: 140,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_isListening)
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, _) {
                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              _PulseRing(
                                progress: _pulseController.value,
                                color: visuals.accent,
                                maxDimension: 140,
                                minDimension: 88,
                              ),
                              _PulseRing(
                                progress:
                                    (_pulseController.value + 0.5) % 1.0,
                                color: visuals.accent,
                                maxDimension: 140,
                                minDimension: 88,
                              ),
                            ],
                          );
                        },
                      ),
                    Material(
                      color: _isListening
                          ? visuals.accent
                          : visuals.accent.withValues(alpha: 0.95),
                      shape: const CircleBorder(),
                      elevation: _isListening ? 0 : 0,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: _toggleListening,
                        child: SizedBox.square(
                          dimension: 88,
                          child: Icon(
                            _isListening
                                ? Icons.stop_rounded
                                : Icons.mic_rounded,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.xs + 2,
                ),
                decoration: BoxDecoration(
                  color: _isListening
                      ? visuals.accent.withValues(alpha: 0.12)
                      : c.muted,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  _isListening ? 'Listening... tap to stop' : 'Tap to speak',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: _isListening ? visuals.accent : c.mutedForeground,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // Recognized text card
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
                      Icons.graphic_eq_rounded,
                      size: 18,
                      color: visuals.accent,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Recognized text',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: visuals.accent.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const Spacer(),
                    if (hasTranscript)
                      Icon(
                        Icons.check_circle_rounded,
                        size: 16,
                        color: c.success,
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: hasTranscript
                    ? Text(
                        _transcriptController.text,
                        style: AppTheme.vnStyle(
                          fontSize: AppTypography.bodyLarge,
                          fontWeight: FontWeight.w500,
                          color: c.foreground,
                          height: 1.5,
                        ),
                      )
                    : Text(
                        _isListening
                            ? 'Speak now — your words will appear here...'
                            : 'No recording yet. Tap the mic to start.',
                        style: GoogleFonts.inter(
                          fontSize: AppTypography.bodyMedium,
                          color: c.mutedForeground.withValues(alpha: 0.7),
                          fontStyle: FontStyle.italic,
                          height: 1.5,
                        ),
                      ),
              ),
            ],
          ),
        ),

        if (_error != null) ...[
          const SizedBox(height: AppSpacing.md),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: c.error.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: c.error.withValues(alpha: 0.30),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  size: 16,
                  color: c.error,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    _error!,
                    style: theme.textTheme.bodySmall?.copyWith(color: c.error),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _PulseRing extends StatelessWidget {
  const _PulseRing({
    required this.progress,
    required this.color,
    required this.maxDimension,
    required this.minDimension,
  });

  final double progress;
  final Color color;
  final double maxDimension;
  final double minDimension;

  @override
  Widget build(BuildContext context) {
    final size = minDimension + (maxDimension - minDimension) * progress;
    final opacity = (1.0 - progress).clamp(0.0, 1.0) * 0.45;
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: color.withValues(alpha: opacity),
            width: 2,
          ),
        ),
      ),
    );
  }
}
