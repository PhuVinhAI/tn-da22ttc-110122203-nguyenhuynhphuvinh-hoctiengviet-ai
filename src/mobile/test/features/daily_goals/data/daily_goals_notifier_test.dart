import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:linvnix/features/daily_goals/data/daily_goals_repository.dart';
import 'package:linvnix/features/daily_goals/data/daily_goals_providers.dart';
import 'package:linvnix/features/daily_goals/domain/daily_goal_models.dart';
import 'package:linvnix/core/storage/preferences_service.dart';
import 'package:linvnix/core/providers/providers.dart';

class MockDailyGoalsRepository extends Mock implements DailyGoalsRepository {}

void main() {
  late MockDailyGoalsRepository mockRepo;
  late PreferencesService prefsService;

  setUpAll(() {
    registerFallbackValue(GoalType.questions);
  });

  setUp(() async {
    mockRepo = MockDailyGoalsRepository();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    prefsService = PreferencesService(prefs);
  });

  group('DailyGoalsNotifier migration', () {
    test(
        'auto-creates QUESTIONS and SIMULATIONS defaults when onboarding completed and goals empty',
        () async {
      when(() => mockRepo.getGoals()).thenAnswer((_) async => []);
      when(() => mockRepo.createGoal(any(), any())).thenAnswer(
        (invocation) async => DailyGoal(
          id: 'goal-${invocation.positionalArguments[1]}',
          goalType: invocation.positionalArguments[0] as GoalType,
          targetValue: invocation.positionalArguments[1] as int,
        ),
      );

      await prefsService.setOnboardingCompleted();

      final container = ProviderContainer(
        overrides: [
          dailyGoalsRepositoryProvider.overrideWithValue(mockRepo),
          preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService)),
        ],
      );

      final goals = await container.read(dailyGoalsProvider.future);

      verify(() => mockRepo.createGoal(GoalType.questions, 10)).called(1);
      verify(() => mockRepo.createGoal(GoalType.simulations, 3)).called(1);
      verifyNever(() => mockRepo.createGoal(GoalType.lessons, any()));
      expect(goals, hasLength(2));
      expect(goals.any((g) => g.goalType == GoalType.questions), isTrue);
      expect(goals.any((g) => g.goalType == GoalType.simulations), isTrue);

      expect(prefsService.isDailyGoalsMigrated, isTrue);
    });

    test('does not migrate when onboarding not completed', () async {
      when(() => mockRepo.getGoals()).thenAnswer((_) async => []);

      final container = ProviderContainer(
        overrides: [
          dailyGoalsRepositoryProvider.overrideWithValue(mockRepo),
          preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService)),
        ],
      );

      final goals = await container.read(dailyGoalsProvider.future);

      verifyNever(() => mockRepo.createGoal(any(), any()));
      expect(goals, isEmpty);
      expect(prefsService.isDailyGoalsMigrated, isFalse);
    });

    test('does not migrate when goals already exist', () async {
      when(() => mockRepo.getGoals()).thenAnswer((_) async => [
            DailyGoal(
                id: 'g1', goalType: GoalType.questions, targetValue: 20),
          ]);

      await prefsService.setOnboardingCompleted();

      final container = ProviderContainer(
        overrides: [
          dailyGoalsRepositoryProvider.overrideWithValue(mockRepo),
          preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService)),
        ],
      );

      final goals = await container.read(dailyGoalsProvider.future);

      verifyNever(() => mockRepo.createGoal(any(), any()));
      expect(goals, hasLength(1));
    });

    test('does not migrate when already migrated', () async {
      when(() => mockRepo.getGoals()).thenAnswer((_) async => []);

      await prefsService.setOnboardingCompleted();
      await prefsService.setDailyGoalsMigrated();

      final container = ProviderContainer(
        overrides: [
          dailyGoalsRepositoryProvider.overrideWithValue(mockRepo),
          preferencesProvider.overrideWith(
              () => PreloadedPreferencesNotifier(prefsService)),
        ],
      );

      final goals = await container.read(dailyGoalsProvider.future);

      verifyNever(() => mockRepo.createGoal(any(), any()));
      expect(goals, isEmpty);
    });
  });
}
