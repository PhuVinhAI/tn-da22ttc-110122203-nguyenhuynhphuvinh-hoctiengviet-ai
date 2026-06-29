import 'dart:async';

/// Tracks active time on a lesson screen and periodically flushes to the backend.
class LessonTimeTracker {
  LessonTimeTracker({
    required this.onFlush,
    this.flushInterval = const Duration(seconds: 30),
  });

  final Future<void> Function(int seconds) onFlush;
  final Duration flushInterval;

  final Stopwatch _stopwatch = Stopwatch();
  Timer? _periodicTimer;
  int _pendingSeconds = 0;

  bool get isRunning => _stopwatch.isRunning;

  void start() {
    if (_stopwatch.isRunning) return;
    _stopwatch.start();
    _periodicTimer ??= Timer.periodic(flushInterval, (_) {
      unawaited(pauseAndFlush());
      resume();
    });
  }

  void resume() {
    if (!_stopwatch.isRunning) {
      _stopwatch.start();
    }
  }

  void pause() {
    if (!_stopwatch.isRunning) return;
    _pendingSeconds += _stopwatch.elapsed.inSeconds;
    _stopwatch
      ..stop()
      ..reset();
  }

  Future<void> pauseAndFlush() async {
    pause();
    await _flush();
  }

  Future<void> stop() async {
    pause();
    _periodicTimer?.cancel();
    _periodicTimer = null;
    await _flush();
  }

  Future<void> _flush() async {
    if (_pendingSeconds <= 0) return;
    final toSend = _pendingSeconds;
    _pendingSeconds = 0;
    try {
      await onFlush(toSend);
    } catch (_) {
      _pendingSeconds += toSend;
    }
  }
}
