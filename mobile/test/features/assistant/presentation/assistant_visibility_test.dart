import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/presentation/assistant_visibility.dart';

void main() {
  group('isAssistantBarVisible', () {
    const hiddenLocations = <String>[
      '/splash',
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/reset-password-otp',
      '/onboarding',
    ];

    for (final loc in hiddenLocations) {
      test('is hidden on $loc', () {
        expect(isAssistantBarVisible(loc), isFalse);
      });
    }

    const visibleLocations = <String>[
      '/',
      '/courses',
      '/courses/c-1',
      '/courses/c-1/exercises/play/set-1',
      '/modules/m-1',
      '/modules/m-1/exercises/play/set-1',
      '/lessons/l-1',
      '/lessons/l-1/exercises',
      '/lessons/l-1/exercises/play/set-1',
      '/bookmarks',
      '/bookmarks/flashcard',
      '/profile',
    ];

    for (final loc in visibleLocations) {
      test('is visible on $loc', () {
        expect(isAssistantBarVisible(loc), isTrue);
      });
    }

    test('hidden when location is null (e.g. before router has emitted)', () {
      expect(isAssistantBarVisible(null), isFalse);
    });

    test(
      'hidden on auth routes that carry query parameters '
      '(e.g. /verify-email?email=...)',
      () {
        expect(
          isAssistantBarVisible('/verify-email?email=foo@bar.com'),
          isFalse,
        );
        expect(
          isAssistantBarVisible('/reset-password?token=xyz'),
          isFalse,
        );
      },
    );
  });
}
