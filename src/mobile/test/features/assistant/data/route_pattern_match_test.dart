import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/route_pattern_match.dart';

void main() {
  group('route_pattern_match', () {
    test('bestPatternForLocation prefers the most specific pattern', () {
      const patterns = [
        '/courses',
        '/courses/:id',
        '/courses/:id/exercises/play/:exerciseId',
      ];

      expect(
        bestPatternForLocation('/courses', patterns),
        '/courses',
      );
      expect(
        bestPatternForLocation('/courses/c1', patterns),
        '/courses/:id',
      );
      expect(
        bestPatternForLocation('/courses/c1/exercises/play/s1', patterns),
        '/courses/:id/exercises/play/:exerciseId',
      );
    });

    test('pathParametersFromLocation extracts params', () {
      expect(
        pathParametersFromLocation('/courses/c1', '/courses/:id'),
        {'id': 'c1'},
      );
    });
  });
}
