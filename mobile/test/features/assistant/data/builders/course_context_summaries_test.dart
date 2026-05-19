import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/builders/course_context_summaries.dart';

void main() {
  group('course_context_summaries helpers', () {
    test('asyncLoadStatus maps AsyncValue states', () {
      expect(asyncLoadStatus(const AsyncLoading()), 'loading');
      expect(
        asyncLoadStatus(AsyncError<Object>(Exception('fail'), StackTrace.empty)),
        'error',
      );
      expect(asyncLoadStatus(const AsyncData(1)), 'data');
    });

    test('shortAsyncError truncates long messages', () {
      expect(shortAsyncError(Exception('Network failed')), 'Exception: Network failed');
      expect(
        shortAsyncError(Exception('x' * 250)).length,
        lessThanOrEqualTo(200),
      );
    });
  });
}
