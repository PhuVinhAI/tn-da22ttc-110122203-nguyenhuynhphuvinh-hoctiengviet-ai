import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/lessons/domain/lesson_models.dart';

void main() {
  group('LessonDetail', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'lesson-1',
        'title': 'Greetings',
        'description': 'Learn basic greetings',
        'lessonType': 'vocabulary',
        'orderIndex': 1,
        'moduleId': 'module-1',
        'estimatedDuration': 15,
        'isAssessment': false,
        'contents': [
          {
            'id': 'content-1',
            'contentType': 'text',
            'vietnameseText': 'Xin chào',
            'orderIndex': 0,
            'translation': 'Hello',
            'phonetic': 'sin chow',
          },
        ],
        'vocabularies': [
          {
            'id': 'vocab-1',
            'word': 'xin chào',
            'translation': 'hello',
            'phonetic': 'sin chow',
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
            'exerciseType': 'multiple_choice',
            'question': 'What does xin chào mean?',
          },
        ],
      };

      final lesson = LessonDetail.fromJson(json);

      expect(lesson.id, 'lesson-1');
      expect(lesson.title, 'Greetings');
      expect(lesson.lessonType, 'vocabulary');
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
        'lessonType': 'grammar',
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
        'contentType': 'text',
        'vietnameseText': 'Xin chào thế giới',
        'orderIndex': 0,
        'translation': 'Hello world',
        'phonetic': 'sin chow tay gwoy',
      };

      final content = LessonContent.fromJson(json);

      expect(content.id, 'c1');
      expect(content.contentType, 'text');
      expect(content.vietnameseText, 'Xin chào thế giới');
      expect(content.translation, 'Hello world');
      expect(content.phonetic, 'sin chow tay gwoy');
    });

    test('creates audio content from JSON', () {
      final json = {
        'id': 'c2',
        'contentType': 'audio',
        'vietnameseText': 'Nghe và nói',
        'orderIndex': 1,
        'audioUrl': 'https://example.com/audio.mp3',
      };

      final content = LessonContent.fromJson(json);

      expect(content.contentType, 'audio');
      expect(content.audioUrl, 'https://example.com/audio.mp3');
    });

    test('creates dialogue content from JSON', () {
      final json = {
        'id': 'c3',
        'contentType': 'dialogue',
        'vietnameseText': 'A: Xin chào\nB: Chào bạn',
        'orderIndex': 2,
        'translation': 'A: Hello\nB: Hi there',
        'audioUrl': 'https://example.com/dialogue.mp3',
      };

      final content = LessonContent.fromJson(json);

      expect(content.contentType, 'dialogue');
      expect(content.vietnameseText, contains('Xin chào'));
      expect(content.audioUrl, isNotNull);
    });
  });

  group('LessonVocabulary', () {
    test('creates from JSON with all fields', () {
      final json = {
        'id': 'v1',
        'word': 'con mèo',
        'translation': 'cat',
        'phonetic': 'kon meow',
        'partOfSpeech': 'noun',
        'classifier': 'con',
        'dialectVariants': {
          'SOUTHERN': 'con mèo',
          'NORTHERN': 'con mèo',
        },
        'difficultyLevel': 1,
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
      expect(vocab.phonetic, isNull);
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
        'difficultyLevel': 1,
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
        'exerciseType': 'multiple_choice',
        'question': 'What does xin chào mean?',
      };

      final exercise = ExerciseStub.fromJson(json);

      expect(exercise.id, 'e1');
      expect(exercise.exerciseType, 'multiple_choice');
      expect(exercise.question, 'What does xin chào mean?');
    });
  });
}
