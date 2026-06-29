import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_state_provider.dart';
import '../providers/providers.dart';
import '../presentation/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/email_verification_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/reset_password_otp_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/courses/presentation/screens/courses_screen.dart';
import '../../features/courses/presentation/screens/course_detail_screen.dart';
import '../../features/courses/presentation/screens/module_detail_screen.dart';
import '../../features/bookmarks/presentation/screens/bookmarks_screen.dart';
import '../../features/bookmarks/presentation/screens/saved_words_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/settings_screen.dart';
import '../../features/profile/data/profile_providers.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/lessons/presentation/screens/lesson_wizard_screen.dart';
import '../../features/lessons/presentation/screens/exercise_hub_screen.dart';
import '../../features/lessons/presentation/screens/question_play_screen.dart';
import '../../features/simulation/presentation/screens/practice_screen.dart';
import '../../features/simulation/presentation/screens/scenario_detail_screen.dart';
import '../../features/simulation/presentation/screens/character_selection_screen.dart';
import '../../features/simulation/presentation/screens/chat_screen.dart';
import '../../features/simulation/presentation/screens/simulation_result_screen.dart';
import '../../features/simulation/presentation/screens/results_history_screen.dart';
import '../../features/image_discovery/presentation/screens/image_discovery_screen.dart';
import '../presentation/shell_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class _RouterListenable extends ChangeNotifier {
  _RouterListenable(Ref ref) {
    ref.listen(authStateProvider, (_, _) => notifyListeners());
    ref.listen(onboardingCompletedProvider, (_, _) => notifyListeners());
    ref.listen(userProfileProvider, (_, _) => notifyListeners());
  }
}

final _routerListenableProvider = Provider<_RouterListenable>((ref) {
  return _RouterListenable(ref);
});

final rootNavigatorKeyProvider = Provider<GlobalKey<NavigatorState>>((ref) {
  return _rootNavigatorKey;
});

final routerProvider = Provider<GoRouter>((ref) {
  final listenable = ref.watch(_routerListenableProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: listenable,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final onboardingCompleted = ref.read(onboardingCompletedProvider);
      final profileAsync = ref.read(userProfileProvider);

      final serverOnboarding = profileAsync.whenOrNull(
        data: (profile) => profile.onboardingCompleted,
      );

      // Prefer true from either source: stale server profile (false) must not
      // override local completion set during onboarding submit.
      final isOnboardingCompleted =
          onboardingCompleted || (serverOnboarding ?? false);

      final location = state.matchedLocation;

      if (location == '/splash') {
        if (!authState.isInitialized) return null;
        if (!authState.isAuthenticated) return '/login';
        // If authenticated but the server profile is still loading, stay on
        // splash to avoid a race where serverOnboarding=null causes a wrong
        // redirect to /onboarding even though the user already completed it.
        // If the profile fetch errors out, fall through using the local
        // SharedPreferences value as a fallback (isOnboardingCompleted below).
        if (profileAsync.isLoading) return null;
        if (!isOnboardingCompleted) return '/onboarding';
        return '/';
      }

      if (!authState.isInitialized) return '/splash';

      final isAuthRoute = location == '/login' || location == '/register';

      final isPasswordResetRoute =
          location == '/forgot-password' ||
          location == '/reset-password' ||
          location == '/reset-password-otp';

      final isPublicRoute =
          location == '/verify-email' ||
          location.startsWith('/courses') ||
          location.startsWith('/modules');

      if (isPublicRoute) return null;

      if (location == '/onboarding') {
        if (!authState.isAuthenticated) return '/login';
        return null;
      }

      if (!authState.isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      if (authState.isAuthenticated && isAuthRoute) {
        return '/';
      }

      if (authState.isAuthenticated && isPasswordResetRoute) {
        return null;
      }

      if (authState.isAuthenticated &&
          !isOnboardingCompleted &&
          location != '/onboarding') {
        return '/onboarding';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return EmailVerificationScreen(email: email);
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password-otp',
        builder: (context, state) {
          final email = state.uri.queryParameters['email'] ?? '';
          final fromSettings = state.uri.queryParameters['from'] == 'settings';
          return ResetPasswordOtpScreen(
            email: email,
            fromSettings: fromSettings,
          );
        },
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          final fromSettings = state.uri.queryParameters['from'] == 'settings';
          return ResetPasswordScreen(token: token, fromSettings: fromSettings);
        },
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/camera',
        builder: (context, state) => const ImageDiscoveryScreen(),
      ),
      GoRoute(
        path: '/courses/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return CourseDetailScreen(courseId: id);
        },
      ),
      GoRoute(
        path: '/courses/:id/exercises/play/:exerciseId',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final exerciseId = state.pathParameters['exerciseId']!;
          return QuestionPlayScreen(courseId: id, exerciseId: exerciseId);
        },
      ),
      GoRoute(
        path: '/modules/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ModuleDetailScreen(moduleId: id);
        },
      ),
      GoRoute(
        path: '/modules/:id/exercises/play/:exerciseId',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final exerciseId = state.pathParameters['exerciseId']!;
          return QuestionPlayScreen(moduleId: id, exerciseId: exerciseId);
        },
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/bookmarks',
        builder: (context, state) => const BookmarksScreen(),
      ),
      GoRoute(
        path: '/bookmarks/flashcard',
        builder: (context, state) => const SavedWordsScreen(),
      ),
      GoRoute(
        path: '/lessons/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return LessonWizardScreen(lessonId: id);
        },
      ),
      GoRoute(
        path: '/lessons/:id/exercises',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ExerciseHubScreen(lessonId: id);
        },
      ),
      GoRoute(
        path: '/lessons/:id/exercises/play/:exerciseId',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final exerciseId = state.pathParameters['exerciseId']!;
          return QuestionPlayScreen(lessonId: id, exerciseId: exerciseId);
        },
      ),
      GoRoute(
        path: '/practice/scenarios/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final fromConversation =
              state.uri.queryParameters['fromConversation'] == 'true';
          return ScenarioDetailScreen(
            scenarioId: id,
            fromConversation: fromConversation,
          );
        },
      ),
      GoRoute(
        path: '/practice/scenarios/:id/select-character',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final characterId = state.uri.queryParameters['characterId'];
          return CharacterSelectionScreen(
            scenarioId: id,
            preselectedCharacterId: characterId,
          );
        },
      ),
      GoRoute(
        path: '/practice/sessions/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final isHistory = state.uri.queryParameters['history'] == 'true';
          final fromResult = state.uri.queryParameters['fromResult'] == 'true';
          final fromCharacterSelection =
              state.uri.queryParameters['fromCharacterSelection'] == 'true';
          return ChatScreen(
            sessionId: id,
            isHistory: isHistory,
            fromResult: fromResult,
            fromCharacterSelection: fromCharacterSelection,
          );
        },
      ),
      GoRoute(
        path: '/practice/results/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final fromConversation =
              state.uri.queryParameters['fromConversation'] == 'true';
          final fromHistory =
              state.uri.queryParameters['fromHistory'] == 'true';
          final historyScenarioId = state.uri.queryParameters['scenarioId'];
          return SimulationResultScreen(
            resultId: id,
            fromConversation: fromConversation,
            fromHistory: fromHistory,
            historyScenarioId: historyScenarioId,
          );
        },
      ),
      GoRoute(
        path: '/practice/history',
        builder: (context, state) {
          final scenarioId = state.uri.queryParameters['scenarioId'];
          return ResultsHistoryScreen(scenarioId: scenarioId);
        },
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/courses',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: CoursesScreen()),
          ),
          GoRoute(
            path: '/practice',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: PracticeScreen()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),
    ],
  );
});
