import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/lessons/data/lesson_time_tracker.dart';

void main() {
  group('LessonTimeTracker', () {
    test('flushes accumulated seconds on stop', () async {
      final flushed = <int>[];
      final tracker = LessonTimeTracker(
        onFlush: (seconds) async {
          flushed.add(seconds);
        },
      );

      tracker.start();
      await Future<void>.delayed(const Duration(milliseconds: 1100));
      await tracker.stop();

      expect(flushed, [1]);
    });

    test('pauseAndFlush sends pending time without stopping periodic flush', () async {
      final flushed = <int>[];
      final tracker = LessonTimeTracker(
        onFlush: (seconds) async {
          flushed.add(seconds);
        },
      );

      tracker.start();
      await Future<void>.delayed(const Duration(milliseconds: 2100));
      await tracker.pauseAndFlush();

      expect(flushed, [2]);
      expect(tracker.isRunning, isFalse);
    });

    test('restores pending seconds when flush fails', () async {
      var shouldFail = true;
      final flushed = <int>[];
      final tracker = LessonTimeTracker(
        onFlush: (seconds) async {
          if (shouldFail) {
            shouldFail = false;
            throw Exception('network');
          }
          flushed.add(seconds);
        },
      );

      tracker.start();
      await Future<void>.delayed(const Duration(milliseconds: 1100));
      await tracker.pauseAndFlush();
      expect(flushed, isEmpty);

      await tracker.pauseAndFlush();
      expect(flushed, [1]);
    });
  });
}
