import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/screen_context_for_api.dart';
import 'package:linvnix/features/assistant/domain/screen_context.dart';

void main() {
  group('screenContextForApi', () {
    test('strips uiSnapshot when screenType is present', () {
      const context = ScreenContext(
        route: '/',
        displayName: 'Trang chủ',
        barPlaceholder: 'Hôm nay học gì nhỉ?',
        data: {
          'screenType': 'home',
          'status': 'data',
          'streak': 0,
          'uiSnapshot': {
            'texts': ['Trợ lý AI · Trang chủ'],
          },
        },
      );

      final apiContext = screenContextForApi(context);

      expect(apiContext.data.containsKey('uiSnapshot'), isFalse);
      expect(apiContext.data['screenType'], 'home');
      expect(apiContext.data['streak'], 0);
    });

    test('keeps uiSnapshot for routes without screenType', () {
      const context = ScreenContext(
        route: '/profile',
        displayName: '/profile',
        barPlaceholder: 'Hỏi gì đi nào?',
        data: {
          'uiSnapshot': {
            'texts': ['Profile'],
          },
        },
      );

      final apiContext = screenContextForApi(context);

      expect(apiContext.data['uiSnapshot'], isA<Map<String, dynamic>>());
    });
  });
}
