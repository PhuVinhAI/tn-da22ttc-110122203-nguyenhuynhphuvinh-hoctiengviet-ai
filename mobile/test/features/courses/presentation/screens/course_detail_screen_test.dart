import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/core/theme/app_theme.dart';
import 'package:linvnix/features/courses/data/courses_providers.dart';
import 'package:linvnix/features/courses/domain/course_models.dart';
import 'package:linvnix/features/courses/presentation/screens/course_detail_screen.dart';
import 'package:linvnix/features/lessons/data/lesson_providers.dart';
import 'package:linvnix/features/lessons/domain/exercise_set_models.dart';
import 'package:linvnix/features/profile/data/profile_providers.dart';
import 'package:linvnix/features/user/domain/user_profile.dart';

const _testCourse = Course(
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  level: 'A1',
  orderIndex: 1,
  isPublished: true,
  modules: [
    CourseModule(
      id: 'mod-1',
      title: 'Module 1',
      description: 'First module',
      orderIndex: 1,
      courseId: 'course-1',
      lessons: [
        Lesson(
          id: 'lesson-1',
          title: 'Lesson 1',
          description: 'First lesson',
          lessonType: 'vocabulary',
          orderIndex: 1,
          moduleId: 'mod-1',
        ),
        Lesson(
          id: 'lesson-2',
          title: 'Lesson 2',
          description: 'Second lesson',
          lessonType: 'grammar',
          orderIndex: 2,
          moduleId: 'mod-1',
        ),
      ],
    ),
    CourseModule(
      id: 'mod-2',
      title: 'Module 2',
      description: 'Second module',
      orderIndex: 2,
      courseId: 'course-1',
      lessons: [
        Lesson(
          id: 'lesson-3',
          title: 'Lesson 3',
          description: 'Third lesson',
          lessonType: 'reading',
          orderIndex: 1,
          moduleId: 'mod-2',
        ),
      ],
    ),
  ],
);

const _testCourseB1 = Course(
  id: 'course-b1',
  title: 'B1 Course',
  description: 'A B1 level course',
  level: 'B1',
  orderIndex: 1,
  isPublished: true,
  modules: [
    CourseModule(
      id: 'mod-b1',
      title: 'B1 Module',
      description: 'B1 module',
      orderIndex: 1,
      courseId: 'course-b1',
      lessons: [
        Lesson(
          id: 'lesson-b1',
          title: 'B1 Lesson',
          description: 'B1 lesson',
          lessonType: 'vocabulary',
          orderIndex: 1,
          moduleId: 'mod-b1',
        ),
      ],
    ),
  ],
);

class _FakeCourseDetail extends CourseDetail {
  final Course course;

  _FakeCourseDetail(this.course);

  @override
  Future<Course> build(String id) async => course;
}

class _FakeCourseExerciseSetsNotifier extends CourseExerciseSetsNotifier {
  final CourseExerciseSummary _data;

  _FakeCourseExerciseSetsNotifier(String courseId, this._data)
      : super(courseId);

  @override
  Future<CourseExerciseSummary> build() async {
    watchTags({'exercise-set', 'course-$courseId'});
    return _data;
  }
}

class _FakeUserProgressNotifier extends UserProgressNotifier {
  final List<UserProgress> _data;

  _FakeUserProgressNotifier(this._data);

  @override
  Future<List<UserProgress>> build() async => _data;
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
  group('CourseDetailScreen custom practice section', () {
    testWidgets(
        'custom practice section hidden when 0 modules completed (eligible=false) and no bypass buttons',
        (tester) async {
      final notEligibleSummary = const CourseExerciseSummary(
        eligible: false,
        completedModulesCount: 0,
        totalModulesCount: 2,
        courseSets: [],
      );

      const user = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A1',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', notEligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(user)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Custom Practice'), findsNothing);
      expect(find.text('0/2 modules completed'), findsNothing);
      expect(find.text('Create Custom Practice'), findsNothing);
    });

    testWidgets(
        'custom practice section visible with progress count when eligible',
        (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
      );

      const user = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A1',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(user)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Custom Practice'), findsOneWidget);
      expect(find.text('1/2 modules completed'), findsOneWidget);
      expect(find.text('Create Custom Practice'), findsOneWidget);
    });

    testWidgets(
        'tapping existing set opens info bottom sheet', (tester) async {
      final summaryWithSets = CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 2,
        totalModulesCount: 2,
        courseSets: [
          SetProgress(
            setId: 'set-1',
            title: 'Course Review',
            description: 'AI-generated review',
            isCustom: true,
            isAIGenerated: true,
            totalExercises: 10,
            attempted: 5,
            correct: 4,
            percentComplete: 50,
            percentCorrect: 80,
          ),
        ],
      );

      const user = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A1',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', summaryWithSets),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(user)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Course Review'), findsOneWidget);

      await tester.tap(find.text('Course Review'));
      await tester.pumpAndSettle();

      expect(find.text('AI-generated review'), findsAtLeast(1));
    });
  });

  group('CourseDetailScreen Complete All button', () {
    testWidgets(
        'Complete All button only shows when user level > course level',
        (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(b2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsOneWidget);
    });

    testWidgets(
        'Complete All button hidden when user level equals course level',
        (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a1User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsNothing);
    });

    testWidgets(
        'Complete All button hidden when user level is lower than course level',
        (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
      );

      const a2User = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A2',
        onboardingCompleted: true,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourseB1)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-b1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-b1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Complete All'), findsNothing);
    });

    testWidgets('confirmation dialog appears before complete-all operation',
        (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(b2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.text('Complete All'));
      await tester.pumpAndSettle();

      expect(find.text('Mark all lessons as completed?'), findsOneWidget);
    });
  });

  group('CourseDetailScreen Reset button', () {
    testWidgets('Reset button hidden when no progress exists', (tester) async {
      final notEligibleSummary = const CourseExerciseSummary(
        eligible: false,
        completedModulesCount: 0,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', notEligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a1User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Reset'), findsNothing);
    });

    testWidgets('Reset button visible when course has bypass progress',
        (tester) async {
      final bypassSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 2,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', bypassSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(b2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Reset'), findsOneWidget);
    });

    testWidgets('Reset button visible when course has lesson progress',
        (tester) async {
      final notEligibleSummary = const CourseExerciseSummary(
        eligible: false,
        completedModulesCount: 0,
        totalModulesCount: 2,
        courseSets: [],
      );

      const a1User = UserProfile(
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Test User',
        currentLevel: 'A1',
        onboardingCompleted: true,
      );

      const lessonProgress = [
        UserProgress(
          id: 'p1',
          status: 'completed',
          lessonId: 'lesson-1',
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', notEligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(lessonProgress)),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a1User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Reset'), findsOneWidget);
    });

    testWidgets('confirmation dialog appears before reset operation',
        (tester) async {
      final bypassSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 2,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', bypassSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(b2User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.text('Reset'));
      await tester.pumpAndSettle();

      expect(find.text('Reset all progress?'), findsOneWidget);
    });
  });

  group('CourseDetailScreen modules list', () {
    testWidgets('shows modules below custom practice', (tester) async {
      final eligibleSummary = const CourseExerciseSummary(
        eligible: true,
        completedModulesCount: 1,
        totalModulesCount: 2,
        courseSets: [],
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
            courseDetailProvider.overrideWith(() => _FakeCourseDetail(_testCourse)),
            courseExerciseSetsProvider.overrideWith(
              () => _FakeCourseExerciseSetsNotifier('course-1', eligibleSummary),
            ),
            userProgressProvider
                .overrideWith(() => _FakeUserProgressNotifier(const [])),
            userProfileProvider
                .overrideWith(() => _FakeUserProfileNotifier(a1User)),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const CourseDetailScreen(courseId: 'course-1'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Module 1'), findsOneWidget);
      expect(find.text('Module 2'), findsOneWidget);
    });
  });
}
