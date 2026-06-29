import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/core/theme/widgets/app_button.dart';
import 'package:linvnix/core/theme/widgets/app_switch.dart';
import 'package:linvnix/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:linvnix/features/user/data/user_repository.dart';
import 'package:linvnix/features/daily_goals/data/daily_goals_repository.dart';
import 'package:linvnix/features/daily_goals/data/daily_goals_providers.dart';
import 'package:linvnix/features/daily_goals/domain/daily_goal_models.dart';
import 'package:linvnix/core/storage/preferences_service.dart';
import 'package:linvnix/core/providers/providers.dart';

class MockUserRepository extends Mock implements UserRepository {}

class MockDailyGoalsRepository extends Mock implements DailyGoalsRepository {}

void main() {
  late MockUserRepository mockUserRepo;
  late MockDailyGoalsRepository mockGoalsRepo;
  late PreferencesService prefsService;

  setUpAll(() {
    registerFallbackValue(GoalType.questions);
  });

  setUp(() async {
    mockUserRepo = MockUserRepository();
    mockGoalsRepo = MockDailyGoalsRepository();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    prefsService = PreferencesService(prefs);

    when(() => mockGoalsRepo.getGoals()).thenAnswer((_) async => []);
    when(() => mockGoalsRepo.createGoal(any(), any())).thenAnswer(
      (invocation) async => DailyGoal(
        id: 'goal-${invocation.positionalArguments[1]}',
        goalType: invocation.positionalArguments[0] as GoalType,
        targetValue: invocation.positionalArguments[1] as int,
      ),
    );
  });

  Widget buildSubject() {
    return ProviderScope(
      overrides: [
        userRepositoryProvider.overrideWithValue(mockUserRepo),
        dailyGoalsRepositoryProvider.overrideWithValue(mockGoalsRepo),
        preferencesProvider.overrideWith(
            () => PreloadedPreferencesNotifier(prefsService)),
      ],
      child: MaterialApp(
        theme: AppTheme.light(),
        home: const OnboardingScreen(),
      ),
    );
  }

  Finder findCard(String text) {
    return find.ancestor(
      of: find.text(text),
      matching: find.byType(GestureDetector),
    );
  }

  Finder findButton(String text) {
    return find.widgetWithText(AppButton, text);
  }

  group('OnboardingScreen', () {
    testWidgets('shows level selector on first step', (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      expect(find.text("What's your current level?"), findsOneWidget);
      expect(find.text('A1'), findsOneWidget);
      expect(find.text('A2'), findsOneWidget);
      expect(find.text('B1'), findsOneWidget);
      expect(find.text('B2'), findsOneWidget);
      expect(find.text('C1'), findsOneWidget);
      expect(find.text('C2'), findsOneWidget);
    });

    testWidgets('shows progress indicator with 3 dots', (tester) async {
      await tester.pumpWidget(buildSubject());

      final dots = tester.widgetList<AnimatedContainer>(
        find.byType(AnimatedContainer),
      );
      expect(dots.length, 3);
    });

    testWidgets('Next button disabled until level selected', (tester) async {
      await tester.pumpWidget(buildSubject());

      final nextButton = tester.widget<AppButton>(findButton('Next'));
      expect(nextButton.onPressed, isNull);
    });

    testWidgets('Next button enabled after selecting level', (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('A1'));
      await tester.pumpAndSettle();

      final nextButton = tester.widget<AppButton>(findButton('Next'));
      expect(nextButton.onPressed, isNotNull);
    });

    testWidgets(
        'navigates to dialect step after selecting A1 and tapping Next',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('A1'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(find.text('Which dialect do you prefer?'), findsOneWidget);
      expect(find.text('Standard'), findsOneWidget);
      expect(find.text('Northern'), findsOneWidget);
      expect(find.text('Central'), findsOneWidget);
      expect(find.text('Southern'), findsOneWidget);
    });

    testWidgets('Skip button moves to next step', (tester) async {
      await tester.pumpWidget(buildSubject());

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      expect(find.text('Which dialect do you prefer?'), findsOneWidget);
    });

    testWidgets('dialect step shows options and allows selection',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      await tester.tap(findCard('Northern'));
      await tester.pumpAndSettle();

      final nextButton = tester.widget<AppButton>(findButton('Next'));
      expect(nextButton.onPressed, isNotNull);
    });

    testWidgets(
        'daily goal step shows 3 goal types with toggles and sliders for enabled goals',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      await tester.tap(findCard('Standard'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(find.text('Set daily goals'), findsOneWidget);
      expect(find.text('Exercises'), findsOneWidget);
      expect(find.text('Simulations'), findsOneWidget);
      expect(find.text('Lessons'), findsOneWidget);
      expect(find.byType(AppSwitch), findsNWidgets(3));
      expect(find.byType(Slider), findsNWidgets(2));
      expect(find.text('10 exercises/day'), findsOneWidget);
      expect(find.text('3 simulations/day'), findsOneWidget);
    });

    testWidgets(
        'Get Started submits onboarding without dailyGoal and creates goals via API',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      when(() => mockUserRepo.submitOnboarding(any())).thenAnswer(
        (_) async => {
          'id': 'user-1',
          'currentLevel': 'A1',
          'preferredDialect': 'NORTHERN',
        },
      );

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('A1'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      await tester.tap(findCard('Northern'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      verify(() => mockUserRepo.submitOnboarding({
            'currentLevel': 'A1',
            'preferredDialect': 'NORTHERN',
            'completeLowerCourses': false,
          })).called(1);

      verify(() => mockGoalsRepo.createGoal(GoalType.questions, 10))
          .called(1);
      verify(() => mockGoalsRepo.createGoal(GoalType.simulations, 3))
          .called(1);
      verifyNever(() => mockGoalsRepo.createGoal(GoalType.lessons, any()));

      expect(prefsService.isOnboardingCompleted, isTrue);
    });

    testWidgets(
        'Skip All submits onboarding without dailyGoal and creates enabled goals',
        (tester) async {
      when(() => mockUserRepo.submitOnboarding(any())).thenAnswer(
        (_) async => {'id': 'user-1'},
      );

      await tester.pumpWidget(buildSubject());

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Skip All'));
      await tester.pumpAndSettle();

      verify(() => mockUserRepo.submitOnboarding({
            'completeLowerCourses': false,
            'currentLevel': 'A1',
          })).called(1);

      verify(() => mockGoalsRepo.createGoal(GoalType.questions, 10))
          .called(1);
      verify(() => mockGoalsRepo.createGoal(GoalType.simulations, 3))
          .called(1);

      expect(prefsService.isOnboardingCompleted, isTrue);
    });

    testWidgets('bypass dialog appears when level > A1 selected',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('B1'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(find.text('Mark lower-level courses as completed?'),
          findsOneWidget);
      expect(find.text('Yes'), findsOneWidget);
      expect(find.text('No'), findsOneWidget);
    });

    testWidgets('bypass dialog does NOT appear when A1 selected',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('A1'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(
          find.text('Mark lower-level courses as completed?'), findsNothing);
      expect(find.text('Which dialect do you prefer?'), findsOneWidget);
    });

    testWidgets(
        'submit with completeLowerCourses creates goals via API without dailyGoal',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      when(() => mockUserRepo.submitOnboarding(any())).thenAnswer(
        (_) async => {
          'id': 'user-1',
          'currentLevel': 'B1',
          'preferredDialect': 'NORTHERN',
        },
      );

      await tester.pumpWidget(buildSubject());

      await tester.tap(findCard('B1'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Yes'));
      await tester.pumpAndSettle();

      await tester.tap(findCard('Northern'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      verify(() => mockUserRepo.submitOnboarding({
            'currentLevel': 'B1',
            'preferredDialect': 'NORTHERN',
            'completeLowerCourses': true,
          })).called(1);

      verify(() => mockGoalsRepo.createGoal(GoalType.questions, 10))
          .called(1);
      verify(() => mockGoalsRepo.createGoal(GoalType.simulations, 3))
          .called(1);
    });
  });
}
