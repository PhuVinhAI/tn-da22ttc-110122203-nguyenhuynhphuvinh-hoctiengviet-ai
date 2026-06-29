import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/lessons/domain/lesson_models.dart';

void main() {
  group('LessonDetail', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'lesson-1',
        'title': 'Greetings',
        'description': 'Learn basic greetings',
        'orderIndex': 1,
        'moduleId': 'module-1',
        'estimatedDuration': 15,
        'contents': [
          {
            'id': 'content-1',
            'vietnameseText': 'Xin chào',
            'orderIndex': 0,
            'translation': 'Hello',
          },
        ],
        'vocabularies': [
          {
            'id': 'vocab-1',
            'word': 'xin chào',
            'translation': 'hello',
            'partOfSpeech': 'phrase',
          },
        ],
        'grammarRules': [
          {
            'id': 'grammar-1',
            'title': 'Subject + là',
            'explanation': 'Use là for "to be"',
            'structure': 'Subject + là + Noun',
            'examples': [
              {'vi': 'Tôi là sinh viên', 'en': 'I am a student'},
            ],
          },
        ],
        'exercises': [
          {
            'id': 'exercise-1',
            'title': 'Basic Exercises',
            'description': 'Practice greetings',
            'orderIndex': 0,
          },
        ],
      };

      final lesson = LessonDetail.fromJson(json);

      expect(lesson.id, 'lesson-1');
      expect(lesson.title, 'Greetings');
      expect(lesson.estimatedDuration, 15);
      expect(lesson.contents, hasLength(1));
      expect(lesson.vocabularies, hasLength(1));
      expect(lesson.grammarRules, hasLength(1));
      expect(lesson.exercises, hasLength(1));
    });

    test('handles empty optional arrays', () {
      final json = {
        'id': 'lesson-1',
        'title': 'Empty',
        'description': 'Empty lesson',
        'orderIndex': 0,
        'moduleId': 'module-1',
      };

      final lesson = LessonDetail.fromJson(json);

      expect(lesson.contents, isEmpty);
      expect(lesson.vocabularies, isEmpty);
      expect(lesson.grammarRules, isEmpty);
      expect(lesson.exercises, isEmpty);
      expect(lesson.estimatedDuration, isNull);
    });
  });

  group('LessonContent', () {
    test('creates text content from JSON', () {
      final json = {
        'id': 'c1',
        'vietnameseText': 'Xin chào thế giới',
        'orderIndex': 0,
        'translation': 'Hello world',
      };

      final content = LessonContent.fromJson(json);

      expect(content.id, 'c1');
      expect(content.vietnameseText, 'Xin chào thế giới');
      expect(content.translation, 'Hello world');
    });

    test('handles missing translation', () {
      final json = {
        'id': 'c2',
        'vietnameseText': 'Một mình tiếng Việt',
        'orderIndex': 1,
      };

      final content = LessonContent.fromJson(json);

      expect(content.vietnameseText, 'Một mình tiếng Việt');
      expect(content.translation, isNull);
    });
  });

  group('LessonVocabulary', () {
    test('creates from JSON with all fields', () {
      final json = {
        'id': 'v1',
        'word': 'con mèo',
        'translation': 'cat',
        'partOfSpeech': 'noun',
        'classifier': 'con',
        'dialectVariants': {
          'SOUTHERN': 'con mèo',
          'NORTHERN': 'con mèo',
        },
      };

      final vocab = LessonVocabulary.fromJson(json);

      expect(vocab.id, 'v1');
      expect(vocab.word, 'con mèo');
      expect(vocab.translation, 'cat');
      expect(vocab.classifier, 'con');
      expect(vocab.dialectVariants, isNotNull);
      expect(vocab.dialectVariants!['SOUTHERN'], 'con mèo');
    });

    test('creates from JSON with minimal fields', () {
      final json = {
        'id': 'v2',
        'word': 'chào',
        'translation': 'hello',
      };

      final vocab = LessonVocabulary.fromJson(json);

      expect(vocab.word, 'chào');
      expect(vocab.classifier, isNull);
      expect(vocab.dialectVariants, isNull);
    });
  });

  group('GrammarRule', () {
    test('creates from JSON with examples', () {
      final json = {
        'id': 'g1',
        'title': 'Subject Pronouns',
        'explanation': 'Vietnamese has different pronouns based on age and gender',
        'structure': 'Tôi/Bạn/Anh/Chị/Em',
        'examples': [
          {'vi': 'Tôi là Nam', 'en': 'I am Nam', 'note': 'Formal'},
          {'vi': 'Em là Mai', 'en': 'I am Mai', 'note': 'Younger speaker'},
        ],
        'notes': 'Pronouns are very important in Vietnamese',
      };

      final rule = GrammarRule.fromJson(json);

      expect(rule.id, 'g1');
      expect(rule.title, 'Subject Pronouns');
      expect(rule.structure, isNotNull);
      expect(rule.examples, hasLength(2));
      expect(rule.examples[0].vi, 'Tôi là Nam');
      expect(rule.examples[0].note, 'Formal');
      expect(rule.notes, isNotNull);
    });

    test('creates from JSON with minimal fields', () {
      final json = {
        'id': 'g2',
        'title': 'Simple rule',
        'explanation': 'A simple explanation',
      };

      final rule = GrammarRule.fromJson(json);

      expect(rule.structure, isNull);
      expect(rule.examples, isEmpty);
      expect(rule.notes, isNull);
    });
  });

  group('ExerciseStub', () {
    test('creates from JSON', () {
      final json = {
        'id': 'e1',
        'title': 'Basic Exercises',
        'description': 'Practice greetings',
        'orderIndex': 1,
      };

      final exercise = ExerciseStub.fromJson(json);

      expect(exercise.id, 'e1');
      expect(exercise.title, 'Basic Exercises');
      expect(exercise.description, 'Practice greetings');
      expect(exercise.orderIndex, 1);
    });
  });
}
