import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/user/domain/user_profile.dart';
import 'package:linvnix/features/profile/domain/exercise_stats.dart';

void main() {
  group('UserProfile', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'user-1',
        'email': 'test@example.com',
        'fullName': 'Test User',
        'nativeLanguage': 'English',
        'currentLevel': 'B1',
        'preferredDialect': 'NORTHERN',
        'avatarUrl': 'https://example.com/avatar.jpg',
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.id, 'user-1');
      expect(profile.email, 'test@example.com');
      expect(profile.fullName, 'Test User');
      expect(profile.nativeLanguage, 'English');
      expect(profile.currentLevel, 'B1');
      expect(profile.preferredDialect, 'NORTHERN');
      expect(profile.avatarUrl, 'https://example.com/avatar.jpg');
    });

    test('handles nullable fields', () {
      final json = {
        'id': 'user-1',
        'email': 'test@example.com',
        'fullName': 'Test User',
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.nativeLanguage, isNull);
      expect(profile.currentLevel, isNull);
      expect(profile.preferredDialect, isNull);
      expect(profile.avatarUrl, isNull);
    });

    test('converts to JSON correctly', () {
      const profile = UserProfile(
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        nativeLanguage: 'English',
        currentLevel: 'B1',
        preferredDialect: 'NORTHERN',
      );

      final json = profile.toJson();

      expect(json['id'], 'user-1');
      expect(json['email'], 'test@example.com');
      expect(json['fullName'], 'Test User');
      expect(json['nativeLanguage'], 'English');
      expect(json['currentLevel'], 'B1');
      expect(json['preferredDialect'], 'NORTHERN');
    });
  });

  group('ExerciseStats', () {
    test('creates from JSON correctly', () {
      final json = {
        'totalExercises': 100,
        'completedExercises': 12,
        'correctAnswers': 60,
        'accuracy': 80.0,
        'totalTimeSpent': 7200,
      };

      final stats = ExerciseStats.fromJson(json);

      expect(stats.totalExercises, 100);
      expect(stats.completedExercises, 12);
      expect(stats.correctAnswers, 60);
      expect(stats.accuracy, 80.0);
      expect(stats.totalTimeSpent, 7200);
    });

    test('completedExercises is independent from correctAnswers', () {
      // completedExercises = lessons completed; correctAnswers = exercise answers
      // They should NOT share the same value
      final json = {
        'totalExercises': 50,
        'completedExercises': 5,
        'correctAnswers': 40,
        'accuracy': 80.0,
        'totalTimeSpent': 3600,
      };

      final stats = ExerciseStats.fromJson(json);

      expect(stats.completedExercises, 5);
      expect(stats.correctAnswers, 40);
      expect(stats.completedExercises, isNot(equals(stats.correctAnswers)));
    });

    test('defaults to zero when fields are missing', () {
      final stats = ExerciseStats.fromJson({});

      expect(stats.totalExercises, 0);
      expect(stats.completedExercises, 0);
      expect(stats.correctAnswers, 0);
      expect(stats.accuracy, 0.0);
      expect(stats.totalTimeSpent, 0);
    });

    test('converts to JSON correctly', () {
      const stats = ExerciseStats(
        totalExercises: 100,
        completedExercises: 12,
        correctAnswers: 60,
        accuracy: 80.0,
        totalTimeSpent: 7200,
      );

      final json = stats.toJson();

      expect(json['totalExercises'], 100);
      expect(json['completedExercises'], 12);
      expect(json['correctAnswers'], 60);
      expect(json['accuracy'], 80.0);
      expect(json['totalTimeSpent'], 7200);
    });
  });
}
