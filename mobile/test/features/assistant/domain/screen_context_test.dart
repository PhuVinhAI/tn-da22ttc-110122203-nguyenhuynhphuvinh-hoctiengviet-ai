import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/domain/screen_context.dart';

void main() {
  group('ScreenContext', () {
    test('exposes the four PRD-shaped fields', () {
      const ctx = ScreenContext(
        route: '/lessons/abc',
        displayName: 'Lesson · Greetings',
        barPlaceholder: 'Hỏi về bài học?',
        data: {'lessonId': 'abc'},
      );

      expect(ctx.route, '/lessons/abc');
      expect(ctx.displayName, 'Lesson · Greetings');
      expect(ctx.barPlaceholder, 'Hỏi về bài học?');
      expect(ctx.data, {'lessonId': 'abc'});
    });

    test('data defaults to an empty map', () {
      const ctx = ScreenContext(
        route: '/',
        displayName: 'Home',
        barPlaceholder: 'Hỏi gì đi nào?',
      );
      expect(ctx.data, isEmpty);
    });

    test('value equality compares all four fields including nested map', () {
      const a = ScreenContext(
        route: '/',
        displayName: 'Home',
        barPlaceholder: 'Hỏi gì đi nào?',
        data: {'goals': 3, 'streak': 5},
      );
      const b = ScreenContext(
        route: '/',
        displayName: 'Home',
        barPlaceholder: 'Hỏi gì đi nào?',
        data: {'goals': 3, 'streak': 5},
      );
      const c = ScreenContext(
        route: '/',
        displayName: 'Home',
        barPlaceholder: 'Hỏi gì đi nào?',
        data: {'goals': 3, 'streak': 6},
      );

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
      expect(a, isNot(equals(c)));
    });
  });
}
