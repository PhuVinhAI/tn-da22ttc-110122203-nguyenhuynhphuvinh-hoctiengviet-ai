import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:linvnix/core/theme/widgets/app_nav_bar.dart';
import 'package:linvnix/main.dart';
import 'package:linvnix/core/providers/auth_state_provider.dart';
import 'package:linvnix/core/providers/providers.dart';
import 'package:linvnix/core/storage/preferences_service.dart';
import 'package:linvnix/features/auth/presentation/screens/login_screen.dart';
import 'package:linvnix/features/bookmarks/data/bookmark_providers.dart';
import 'package:linvnix/features/bookmarks/domain/bookmark_models.dart';
import 'package:linvnix/features/courses/presentation/screens/courses_screen.dart';
import 'package:linvnix/features/home/presentation/screens/home_screen.dart';
import 'package:linvnix/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:linvnix/features/profile/data/profile_providers.dart';
import 'package:linvnix/features/profile/domain/exercise_stats.dart';
import 'package:linvnix/features/profile/presentation/screens/profile_screen.dart';
import 'package:linvnix/features/simulation/data/simulation_providers.dart';
import 'package:linvnix/features/simulation/domain/simulation_stats.dart';
import 'package:linvnix/features/user/domain/user_profile.dart';

Future<void> pumpUntilVisible(WidgetTester tester, Finder finder) async {
  for (var i = 0; i < 20; i++) {
    await tester.pump(const Duration(milliseconds: 100));
    if (tester.any(finder)) return;
  }
}

void main() {
  setUpAll(() async {
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {
      // ignore
    }
  });

  group('Unauthenticated', () {
    late PreferencesService prefsService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      prefsService = PreferencesService(prefs);
    });

    testWidgets('App redirects to login when unauthenticated', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService),
            ),
            authStateProvider.overrideWith(
              () => _UnauthenticatedAuthNotifier(),
            ),
          ],
          child: const LinVNixApp(),
        ),
      );
      await pumpUntilVisible(tester, find.byType(LoginScreen));
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
    });
  });

  group('Authenticated with onboarding completed', () {
    late PreferencesService prefsService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({'onboarding_completed': true});
      final prefs = await SharedPreferences.getInstance();
      prefsService = PreferencesService(prefs);
    });

    testWidgets('App shows bottom navigation when authenticated', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService),
            ),
            authStateProvider.overrideWith(() => _AuthenticatedAuthNotifier()),
            userProfileProvider.overrideWith(
              () => _FakeUserProfileNotifier(_completedProfile),
            ),
            exerciseStatsProvider.overrideWith(
              () => _FakeExerciseStatsNotifier(),
            ),
            bookmarkStatsProvider.overrideWith(
              () => _FakeBookmarkStatsNotifier(),
            ),
            simulationStatsProvider.overrideWith(
              () => _FakeSimulationStatsNotifier(),
            ),
          ],
          child: const LinVNixApp(),
        ),
      );
      await pumpUntilVisible(tester, find.byType(AppNavBar));
      expect(find.byType(AppNavBar), findsOneWidget);
      expect(find.text('Courses'), findsWidgets);
      expect(find.text('Profile'), findsWidgets);
    });

    testWidgets('Tapping tabs navigates to correct screens', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService),
            ),
            authStateProvider.overrideWith(() => _AuthenticatedAuthNotifier()),
            userProfileProvider.overrideWith(
              () => _FakeUserProfileNotifier(_completedProfile),
            ),
            exerciseStatsProvider.overrideWith(
              () => _FakeExerciseStatsNotifier(),
            ),
            bookmarkStatsProvider.overrideWith(
              () => _FakeBookmarkStatsNotifier(),
            ),
            simulationStatsProvider.overrideWith(
              () => _FakeSimulationStatsNotifier(),
            ),
          ],
          child: const LinVNixApp(),
        ),
      );
      await pumpUntilVisible(tester, find.byType(AppNavBar));

      expect(find.byType(HomeScreen), findsOneWidget);

      await tester.tap(
        find.descendant(
          of: find.byType(AppNavBar),
          matching: find.text('Courses'),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byType(CoursesScreen), findsOneWidget);

      await tester.tap(
        find.descendant(
          of: find.byType(AppNavBar),
          matching: find.text('Profile'),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byType(ProfileScreen), findsOneWidget);
    });
  });

  group('Authenticated without onboarding', () {
    late PreferencesService prefsService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      prefsService = PreferencesService(prefs);
    });

    testWidgets(
      'App redirects to onboarding when authenticated but not completed',
      (WidgetTester tester) async {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              preferencesProvider.overrideWith(
                () => PreloadedPreferencesNotifier(prefsService),
              ),
              authStateProvider.overrideWith(
                () => _AuthenticatedAuthNotifier(),
              ),
              userProfileProvider.overrideWith(
                () => _FakeUserProfileNotifier(_incompleteProfile),
              ),
            ],
            child: const LinVNixApp(),
          ),
        );
        await pumpUntilVisible(tester, find.byType(OnboardingScreen));
        expect(find.byType(OnboardingScreen), findsOneWidget);
        expect(find.text("What's your current level?"), findsOneWidget);
      },
    );
  });
}

const _completedProfile = UserProfile(
  id: 'u1',
  email: 'test@example.com',
  fullName: 'Test User',
  onboardingCompleted: true,
);

const _incompleteProfile = UserProfile(
  id: 'u1',
  email: 'test@example.com',
  fullName: 'Test User',
  onboardingCompleted: false,
);

class _UnauthenticatedAuthNotifier extends AuthNotifier {
  @override
  AuthState build() =>
      const AuthState(isAuthenticated: false, isInitialized: true);
}

class _AuthenticatedAuthNotifier extends AuthNotifier {
  @override
  AuthState build() =>
      const AuthState(isAuthenticated: true, isInitialized: true);
}

class _FakeUserProfileNotifier extends UserProfileNotifier {
  _FakeUserProfileNotifier(this.profile);

  final UserProfile profile;

  @override
  Future<UserProfile> build() async => profile;
}

class _FakeExerciseStatsNotifier extends ExerciseStatsNotifier {
  @override
  Future<ExerciseStats> build() async => const ExerciseStats(
    totalQuestions: 0,
    completedExercises: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalTimeSpent: 0,
  );
}

class _FakeBookmarkStatsNotifier extends BookmarkStatsNotifier {
  @override
  Future<BookmarkStats> build() async =>
      BookmarkStats(total: 0, byPartOfSpeech: const {});
}

class _FakeSimulationStatsNotifier extends SimulationStatsNotifier {
  @override
  Future<SimulationStats> build() async =>
      const SimulationStats(scenariosAttempted: 0, averageScore: 0);
}
