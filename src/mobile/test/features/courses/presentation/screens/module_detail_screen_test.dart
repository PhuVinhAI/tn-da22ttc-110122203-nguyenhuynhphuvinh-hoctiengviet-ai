import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';
import 'package:linvnix/features/courses/presentation/screens/module_detail_screen.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/profile/data/profile_providers.dart';
import 'package:linvnix/features/user/domain/user_profile.dart';

const _testCourse = Course(
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  level: 'A1',
  orderIndex: 1,
  isPublished: true,
);

const _testModule = CourseModule(
  id: 'mod-1',
  title: 'Test Module',
  description: 'A test module',
  orderIndex: 1,
  courseId: 'course-1',
  course: _testCourse,
  lessons: [
    Lesson(
      id: 'lesson-1',
      title: 'Lesson 1',
      description: 'First lesson',
      orderIndex: 1,
      moduleId: 'mod-1',
    ),
    Lesson(
      id: 'lesson-2',
      title: 'Lesson 2',
      description: 'Second lesson',
      orderIndex: 2,
      moduleId: 'mod-1',
    ),
  ],
);

class _FakeModuleDetail extends ModuleDetail {
  final CourseModule _module;

  _FakeModuleDetail([CourseModule? module]) : _module = module ?? _testModule;

  @override
  Future<CourseModule> build(String id) async => _module;
}

class _FakeModuleExercisesNotifier extends ModuleExercisesNotifier {
  final ModuleExerciseSummary _data;

  _FakeModuleExercisesNotifier(String moduleId, this._data)
      : super(moduleId);

  @override
  Future<ModuleExerciseSummary> build() async {
    watchTags({'question', 'module-$moduleId'});
    return _data;
  }
}

class _FakeUserProgressNotifier extends UserProgressNotifier {
  @override
  Future<List<UserProgress>> build() async => const [];
}

class _FakeUserProfileNotifier extends UserProfileNotifier {
  final UserProfile _data;

  _FakeUserProfileNotifier(this._data);

  @override
  Future<UserProfile> build() async {
    watchTags({'auth'});
    return _data;
  }
}

void main() {
  group('ModuleDetailScreen custom practice section', () {
    testWidgets(
        'custom practice shows locked message when not eligible',
        (tester) async {
      final notEligibleSummary = const ModuleExerciseSummary(
        eligible: false,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', notEligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Custom Practice'), findsOneWidget);
      expect(find.text('0/2 completed'), findsOneWidget);
      expect(
        find.text('Complete at least one lesson to unlock custom practice.'),
        findsOneWidget,
      );
      expect(find.text('Create Custom Practice'), findsNothing);
    });

    testWidgets(
        'custom practice section visible with correct progress count when eligible',
        (tester) async {
      final eligibleSummary = const ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Custom Practice'), findsOneWidget);
      expect(find.text('1/2 completed'), findsOneWidget);
      expect(find.text('Create Custom Practice'), findsOneWidget);
    });

    testWidgets(
        'custom practice section shows existing exercises when available',
        (tester) async {
      final summaryWithSets = ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 2,
        totalLessonsCount: 2,
        moduleExercises: [
          ExerciseProgress(
            exerciseId: 'set-1',
            title: 'Module Review',
            description: 'AI-generated review',
            isCustom: true,
            isAIGenerated: true,
            totalQuestions: 10,
            attempted: 5,
            correct: 4,
            percentComplete: 50,
            percentCorrect: 80,
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', summaryWithSets),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Custom Practice'), findsOneWidget);
      expect(find.text('2/2 completed'), findsOneWidget);
      expect(find.text('Module Review'), findsOneWidget);
      expect(find.text('AI-generated review'), findsOneWidget);
      expect(find.text('Create Custom Practice'), findsOneWidget);
    });

    testWidgets(
        'lessons list appears above custom practice section', (tester) async {
      final eligibleSummary = const ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Lessons'), findsOneWidget);
      expect(find.text('Lesson 1'), findsOneWidget);
      expect(find.text('Lesson 2'), findsOneWidget);

      final lesson1Offset = tester.getTopLeft(find.text('Lesson 1'));
      final customPracticeOffset =
          tester.getTopLeft(find.text('Custom Practice'));
      expect(lesson1Offset.dy, lessThan(customPracticeOffset.dy));
    });
  });

  group('ModuleDetailScreen Complete All button', () {
    testWidgets(
        'Complete All button only shows when user level > module course level',
        (tester) async {
      final eligibleSummary = const ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      const b2User = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'B2',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(b2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsOneWidget);
    });

    testWidgets(
        'Complete All button hidden when user level equals module course level',
        (tester) async {
      final eligibleSummary = const ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      const a1User = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A1',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider.overrideWith(() => _FakeModuleDetail()),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a1User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsNothing);
    });

    testWidgets(
        'Complete All button hidden when user level is lower than module course level',
        (tester) async {
      final eligibleSummary = const ModuleExerciseSummary(
        eligible: true,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        moduleExercises: [],
      );

      const a2User = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A2',
        onboardingCompleted: true,
      );

      const b1Module = CourseModule(
        id: 'mod-b1',
        title: 'B1 Module',
        description: 'B1 module',
        orderIndex: 1,
        courseId: 'course-b1',
        course: Course(
          id: 'course-b1',
          title: 'B1 Course',
          description: 'A B1 level course',
          level: 'B1',
          orderIndex: 1,
          isPublished: true,
        ),
        lessons: [
          Lesson(
            id: 'lesson-b1',
            title: 'B1 Lesson',
            description: 'B1 lesson',
            orderIndex: 1,
            moduleId: 'mod-b1',
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            moduleDetailProvider
                .overrideWith(() => _FakeModuleDetail(b1Module)),
            moduleExercisesProvider.overrideWith(
              () => _FakeModuleExercisesNotifier('mod-b1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier()),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const ModuleDetailScreen(moduleId: 'mod-b1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsNothing);
    });
  });
}

