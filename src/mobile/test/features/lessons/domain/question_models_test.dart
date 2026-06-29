import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/lessons/domain/question_models.dart';
import 'package:linvnix/features/lessons/domain/question_renderer_registry.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/multiple_choice_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/fill_blank_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/matching_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/ordering_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/translation_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/listening_renderer.dart';
import 'package:linvnix/features/lessons/domain/question_renderers/speaking_renderer.dart';

Question _makeQuestion(
  QuestionType type,
  QuestionOptions options,
  QuestionAnswer answer, {
  String question = 'Test question',
  String? explanation,
}) {
  return Question(
    id: 'ex-1',
    questionType: type,
    question: question,
    options: options,
    correctAnswer: answer,
    explanation: explanation,
  );
}

void main() {
  group('QuestionType', () {
    test('fromString parses all types', () {
      expect(
        QuestionType.fromString('multiple_choice'),
        QuestionType.multipleChoice,
      );
      expect(QuestionType.fromString('fill_blank'), QuestionType.fillBlank);
      expect(QuestionType.fromString('matching'), QuestionType.matching);
      expect(QuestionType.fromString('ordering'), QuestionType.ordering);
      expect(QuestionType.fromString('translation'), QuestionType.translation);
      expect(QuestionType.fromString('listening'), QuestionType.listening);
      expect(QuestionType.fromString('speaking'), QuestionType.speaking);
    });

    test('fromString defaults to multipleChoice for unknown', () {
      expect(QuestionType.fromString('unknown'), QuestionType.multipleChoice);
    });

    test('timerSeconds returns correct duration per type', () {
      expect(QuestionType.multipleChoice.timerSeconds, 60);
      expect(QuestionType.fillBlank.timerSeconds, 60);
      expect(QuestionType.matching.timerSeconds, 90);
      expect(QuestionType.ordering.timerSeconds, 120);
      expect(QuestionType.translation.timerSeconds, 180);
      expect(QuestionType.listening.timerSeconds, 180);
      expect(QuestionType.speaking.timerSeconds, 180);
    });
  });

  group('Question.fromJson', () {
    test('parses multiple_choice exercise', () {
      final json = {
        'id': 'e1',
        'questionType': 'multiple_choice',
        'question': 'What does xin chào mean?',
        'options': {
          'type': 'multiple_choice',
          'choices': ['Hello', 'Goodbye', 'Thank you'],
        },
        'correctAnswer': {'selectedChoice': 'Hello'},
        'explanation': 'Xin chào means Hello',
      };

      final question = Question.fromJson(json);

      expect(question.id, 'e1');
      expect(question.questionType, QuestionType.multipleChoice);
      expect(question.question, 'What does xin chào mean?');
      expect(question.options, isA<MultipleChoiceOptions>());
      expect((question.options as MultipleChoiceOptions).choices, [
        'Hello',
        'Goodbye',
        'Thank you',
      ]);
      expect(question.correctAnswer, isA<MultipleChoiceAnswer>());
      expect(
        (question.correctAnswer as MultipleChoiceAnswer).selectedChoice,
        'Hello',
      );
      expect(question.explanation, 'Xin chào means Hello');
    });

    test('parses fill_blank exercise', () {
      final json = {
        'id': 'e2',
        'questionType': 'fill_blank',
        'question': 'Tôi ___ sinh viên.',
        'options': {
          'type': 'fill_blank',
          'blanks': 1,
          'acceptedAnswers': [
            ['là', 'la'],
          ],
        },
        'correctAnswer': {
          'answers': ['là'],
        },
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.fillBlank);
      expect(question.options, isA<FillBlankOptions>());
      final opts = question.options as FillBlankOptions;
      expect(opts.blanks, 1);
      expect(opts.acceptedAnswers, [
        ['là', 'la'],
      ]);
    });

    test('parses matching exercise', () {
      final json = {
        'id': 'e3',
        'questionType': 'matching',
        'question': 'Match the words',
        'options': {
          'type': 'matching',
          'pairs': [
            {'left': 'con mèo', 'right': 'cat'},
            {'left': 'con chó', 'right': 'dog'},
          ],
        },
        'correctAnswer': {
          'matches': [
            {'left': 'con mèo', 'right': 'cat'},
            {'left': 'con chó', 'right': 'dog'},
          ],
        },
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.matching);
      expect(question.options, isA<MatchingOptions>());
      expect((question.options as MatchingOptions).pairs, hasLength(2));
    });

    test('parses ordering exercise', () {
      final json = {
        'id': 'e4',
        'questionType': 'ordering',
        'question': 'Put in correct order',
        'options': {
          'type': 'ordering',
          'items': ['Xin', 'chào', 'bạn'],
        },
        'correctAnswer': {
          'orderedItems': ['Xin', 'chào', 'bạn'],
        },
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.ordering);
      expect(question.options, isA<OrderingOptions>());
      expect((question.options as OrderingOptions).items, [
        'Xin',
        'chào',
        'bạn',
      ]);
    });

    test('parses translation exercise', () {
      final json = {
        'id': 'e5',
        'questionType': 'translation',
        'question': 'Translate: Tôi yêu Việt Nam',
        'options': {
          'type': 'translation',
          'sourceLanguage': 'vi',
          'targetLanguage': 'en',
          'acceptedTranslations': ['I love Vietnam', 'I love Viet Nam'],
        },
        'correctAnswer': {'translation': 'I love Vietnam'},
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.translation);
      expect(question.options, isA<TranslationOptions>());
      final opts = question.options as TranslationOptions;
      expect(opts.acceptedTranslations, ['I love Vietnam', 'I love Viet Nam']);
    });

    test('parses listening exercise', () {
      final json = {
        'id': 'e6',
        'questionType': 'listening',
        'question': 'Listen and type',
        'options': {
          'type': 'listening',
          'audioUrl': 'https://example.com/audio.mp3',
          'transcriptType': 'exact',
          'keywords': ['xin', 'chào'],
        },
        'correctAnswer': {'transcript': 'Xin chào'},
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.listening);
      expect(question.options, isA<ListeningOptions>());
      final opts = question.options as ListeningOptions;
      expect(opts.audioUrl, 'https://example.com/audio.mp3');
      expect(opts.transcriptType, 'exact');
      expect(opts.keywords, ['xin', 'chào']);
    });

    test('parses speaking exercise', () {
      final json = {
        'id': 'e7',
        'questionType': 'speaking',
        'question': 'Say the phrase',
        'questionAudioUrl': 'https://example.com/prompt.mp3',
        'options': {
          'type': 'speaking',
          'promptText': 'Xin chào',
          'promptAudioUrl': 'https://example.com/prompt.mp3',
          'transcriptType': 'exact',
          'keywords': ['xin', 'chào'],
        },
        'correctAnswer': {'transcript': 'Xin chào'},
      };

      final question = Question.fromJson(json);

      expect(question.questionType, QuestionType.speaking);
      expect(question.options, isA<SpeakingOptions>());
      final opts = question.options as SpeakingOptions;
      expect(opts.promptText, 'Xin chào');
      expect(opts.promptAudioUrl, 'https://example.com/prompt.mp3');
      expect(opts.transcriptType, 'exact');
      expect(opts.keywords, ['xin', 'chào']);
      expect(question.correctAnswer, isA<SpeakingAnswer>());
    });

    test('handles null options gracefully', () {
      final json = {
        'id': 'e8',
        'questionType': 'multiple_choice',
        'question': 'Test',
      };

      final question = Question.fromJson(json);

      expect(question.options, isA<MultipleChoiceOptions>());
      expect((question.options as MultipleChoiceOptions).choices, isEmpty);
    });
  });

  group('MultipleChoiceRenderer', () {
    const renderer = MultipleChoiceRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.multipleChoice);
    });

    test('validateAnswer accepts non-empty string', () {
      final question = _makeQuestion(
        QuestionType.multipleChoice,
        const MultipleChoiceOptions(choices: ['A', 'B']),
        const MultipleChoiceAnswer(selectedChoice: 'A'),
      );
      expect(renderer.validateAnswer(question, 'A'), true);
    });

    test('validateAnswer rejects empty string', () {
      final question = _makeQuestion(
        QuestionType.multipleChoice,
        const MultipleChoiceOptions(choices: ['A', 'B']),
        const MultipleChoiceAnswer(selectedChoice: 'A'),
      );
      expect(renderer.validateAnswer(question, ''), false);
    });

    test('validateAnswer rejects null', () {
      final question = _makeQuestion(
        QuestionType.multipleChoice,
        const MultipleChoiceOptions(choices: ['A', 'B']),
        const MultipleChoiceAnswer(selectedChoice: 'A'),
      );
      expect(renderer.validateAnswer(question, null), false);
    });

    test('validateAnswer rejects non-string', () {
      final question = _makeQuestion(
        QuestionType.multipleChoice,
        const MultipleChoiceOptions(choices: ['A', 'B']),
        const MultipleChoiceAnswer(selectedChoice: 'A'),
      );
      expect(renderer.validateAnswer(question, 123), false);
    });

    test('buildAnswerPayload wraps answer correctly', () {
      expect(renderer.buildAnswerPayload('Hello'), {'selectedChoice': 'Hello'});
    });
  });

  group('FillBlankRenderer', () {
    const renderer = FillBlankRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.fillBlank);
    });

    test(
      'validateAnswer accepts correct-length list with non-empty values',
      () {
        final question = _makeQuestion(
          QuestionType.fillBlank,
          const FillBlankOptions(sentence: '___ ___', blanks: 2),
          const FillBlankAnswer(answers: ['a', 'b']),
        );
        expect(renderer.validateAnswer(question, ['hello', 'world']), true);
      },
    );

    test('validateAnswer rejects wrong-length list', () {
      final question = _makeQuestion(
        QuestionType.fillBlank,
        const FillBlankOptions(sentence: '___ ___', blanks: 2),
        const FillBlankAnswer(answers: ['a', 'b']),
      );
      expect(renderer.validateAnswer(question, ['hello']), false);
    });

    test('validateAnswer rejects list with empty values', () {
      final question = _makeQuestion(
        QuestionType.fillBlank,
        const FillBlankOptions(sentence: '___ ___', blanks: 2),
        const FillBlankAnswer(answers: ['a', 'b']),
      );
      expect(renderer.validateAnswer(question, ['hello', '']), false);
    });

    test('validateAnswer rejects non-list', () {
      final question = _makeQuestion(
        QuestionType.fillBlank,
        const FillBlankOptions(sentence: '___', blanks: 1),
        const FillBlankAnswer(answers: ['a']),
      );
      expect(renderer.validateAnswer(question, 'hello'), false);
    });

    test('buildAnswerPayload wraps answers correctly', () {
      expect(renderer.buildAnswerPayload(['a', 'b']), {
        'answers': ['a', 'b'],
      });
    });
  });

  group('MatchingRenderer', () {
    const renderer = MatchingRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.matching);
    });

    test('validateAnswer accepts correct number of pairs', () {
      final question = _makeQuestion(
        QuestionType.matching,
        const MatchingOptions(
          pairs: [
            MatchPair(left: 'A', right: '1'),
            MatchPair(left: 'B', right: '2'),
          ],
        ),
        const MatchingAnswer(
          matches: [
            MatchPair(left: 'A', right: '1'),
            MatchPair(left: 'B', right: '2'),
          ],
        ),
      );
      expect(
        renderer.validateAnswer(question, [
          const MatchPair(left: 'A', right: '1'),
          const MatchPair(left: 'B', right: '2'),
        ]),
        true,
      );
    });

    test('validateAnswer rejects wrong number of pairs', () {
      final question = _makeQuestion(
        QuestionType.matching,
        const MatchingOptions(
          pairs: [
            MatchPair(left: 'A', right: '1'),
            MatchPair(left: 'B', right: '2'),
          ],
        ),
        const MatchingAnswer(
          matches: [
            MatchPair(left: 'A', right: '1'),
            MatchPair(left: 'B', right: '2'),
          ],
        ),
      );
      expect(
        renderer.validateAnswer(question, [
          const MatchPair(left: 'A', right: '1'),
        ]),
        false,
      );
    });

    test('buildAnswerPayload formats matches correctly', () {
      final payload = renderer.buildAnswerPayload([
        const MatchPair(left: 'A', right: '1'),
        const MatchPair(left: 'B', right: '2'),
      ]);
      expect(payload, {
        'matches': [
          {'left': 'A', 'right': '1'},
          {'left': 'B', 'right': '2'},
        ],
      });
    });
  });

  group('OrderingRenderer', () {
    const renderer = OrderingRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.ordering);
    });

    test('validateAnswer accepts correct-length list', () {
      final question = _makeQuestion(
        QuestionType.ordering,
        const OrderingOptions(items: ['A', 'B', 'C']),
        const OrderingAnswer(orderedItems: ['A', 'B', 'C']),
      );
      expect(renderer.validateAnswer(question, ['A', 'B', 'C']), true);
    });

    test('validateAnswer rejects wrong-length list', () {
      final question = _makeQuestion(
        QuestionType.ordering,
        const OrderingOptions(items: ['A', 'B', 'C']),
        const OrderingAnswer(orderedItems: ['A', 'B', 'C']),
      );
      expect(renderer.validateAnswer(question, ['A', 'B']), false);
    });

    test('buildAnswerPayload wraps orderedItems correctly', () {
      expect(renderer.buildAnswerPayload(['C', 'B', 'A']), {
        'orderedItems': ['C', 'B', 'A'],
      });
    });
  });

  group('TranslationRenderer', () {
    const renderer = TranslationRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.translation);
    });

    test('validateAnswer accepts non-empty string', () {
      final question = _makeQuestion(
        QuestionType.translation,
        const TranslationOptions(sourceText: 'Hello', sourceLanguage: 'vi', targetLanguage: 'en'),
        const TranslationAnswer(translation: 'I love Vietnam'),
      );
      expect(renderer.validateAnswer(question, 'I love Vietnam'), true);
    });

    test('validateAnswer rejects empty string', () {
      final question = _makeQuestion(
        QuestionType.translation,
        const TranslationOptions(sourceText: 'Hello', sourceLanguage: 'vi', targetLanguage: 'en'),
        const TranslationAnswer(translation: 'I love Vietnam'),
      );
      expect(renderer.validateAnswer(question, ''), false);
    });

    test('validateAnswer rejects whitespace-only string', () {
      final question = _makeQuestion(
        QuestionType.translation,
        const TranslationOptions(sourceText: 'Hello', sourceLanguage: 'vi', targetLanguage: 'en'),
        const TranslationAnswer(translation: 'I love Vietnam'),
      );
      expect(renderer.validateAnswer(question, '   '), false);
    });

    test('buildAnswerPayload trims and wraps correctly', () {
      expect(renderer.buildAnswerPayload('  hello  '), {
        'translation': 'hello',
      });
    });
  });

  group('ListeningRenderer', () {
    const renderer = ListeningRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.listening);
    });

    test('validateAnswer accepts non-empty string', () {
      final question = _makeQuestion(
        QuestionType.listening,
        const ListeningOptions(
          audioUrl: 'https://a.mp3',
          transcriptType: 'exact',
        ),
        const ListeningAnswer(transcript: 'Xin chào'),
      );
      expect(renderer.validateAnswer(question, 'Xin chào'), true);
    });

    test('validateAnswer rejects empty string', () {
      final question = _makeQuestion(
        QuestionType.listening,
        const ListeningOptions(
          audioUrl: 'https://a.mp3',
          transcriptType: 'exact',
        ),
        const ListeningAnswer(transcript: 'Xin chào'),
      );
      expect(renderer.validateAnswer(question, ''), false);
    });

    test('buildAnswerPayload trims and wraps correctly', () {
      expect(renderer.buildAnswerPayload('  Xin chào  '), {
        'transcript': 'Xin chào',
      });
    });
  });

  group('SpeakingRenderer', () {
    const renderer = SpeakingRenderer();

    test('has correct type', () {
      expect(renderer.type, QuestionType.speaking);
    });

    test('validateAnswer accepts non-empty string', () {
      final question = _makeQuestion(
        QuestionType.speaking,
        const SpeakingOptions(
          promptAudioUrl: 'https://a.mp3',
          transcriptType: 'exact',
        ),
        const SpeakingAnswer(transcript: 'Xin chào'),
      );
      expect(renderer.validateAnswer(question, 'Xin chào'), true);
    });

    test('validateAnswer rejects empty string', () {
      final question = _makeQuestion(
        QuestionType.speaking,
        const SpeakingOptions(
          promptAudioUrl: 'https://a.mp3',
          transcriptType: 'exact',
        ),
        const SpeakingAnswer(transcript: 'Xin chào'),
      );
      expect(renderer.validateAnswer(question, ''), false);
    });

    test('buildAnswerPayload trims and wraps correctly', () {
      expect(renderer.buildAnswerPayload('  Xin chào  '), {
        'transcript': 'Xin chào',
      });
    });
  });

  group('getRenderer', () {
    test('returns correct renderer for each type', () {
      expect(
        getRenderer(QuestionType.multipleChoice),
        isA<MultipleChoiceRenderer>(),
      );
      expect(getRenderer(QuestionType.fillBlank), isA<FillBlankRenderer>());
      expect(getRenderer(QuestionType.matching), isA<MatchingRenderer>());
      expect(getRenderer(QuestionType.ordering), isA<OrderingRenderer>());
      expect(getRenderer(QuestionType.translation), isA<TranslationRenderer>());
      expect(getRenderer(QuestionType.listening), isA<ListeningRenderer>());
      expect(getRenderer(QuestionType.speaking), isA<SpeakingRenderer>());
    });
  });

  group('ExerciseSubmissionResult', () {
    test('parses from JSON correctly', () {
      final json = {
        'id': 'result-1',
        'isCorrect': true,
        'score': 10,
        'userAnswer': 'Hello',
        'timeTaken': 30,
        'attemptedAt': '2024-01-01T00:00:00.000Z',
      };

      final result = ExerciseSubmissionResult.fromJson(json);

      expect(result.id, 'result-1');
      expect(result.isCorrect, true);
      expect(result.score, 10);
      expect(result.timeTaken, 30);
      expect(result.attemptedAt, isNotNull);
    });

    test('handles missing optional fields', () {
      final json = {'id': 'result-2', 'isCorrect': false};

      final result = ExerciseSubmissionResult.fromJson(json);

      expect(result.score, 0);
      expect(result.timeTaken, isNull);
      expect(result.attemptedAt, isNull);
    });
  });

  group('QuestionAnswer toJson', () {
    test('MultipleChoiceAnswer serializes correctly', () {
      expect(const MultipleChoiceAnswer(selectedChoice: 'Hello').toJson(), {
        'selectedChoice': 'Hello',
      });
    });

    test('FillBlankAnswer serializes correctly', () {
      expect(const FillBlankAnswer(answers: ['a', 'b']).toJson(), {
        'answers': ['a', 'b'],
      });
    });

    test('MatchingAnswer serializes correctly', () {
      expect(
        const MatchingAnswer(
          matches: [MatchPair(left: 'A', right: '1')],
        ).toJson(),
        {
          'matches': [
            {'left': 'A', 'right': '1'},
          ],
        },
      );
    });

    test('OrderingAnswer serializes correctly', () {
      expect(const OrderingAnswer(orderedItems: ['X', 'Y']).toJson(), {
        'orderedItems': ['X', 'Y'],
      });
    });

    test('TranslationAnswer serializes correctly', () {
      expect(const TranslationAnswer(translation: 'Hello').toJson(), {
        'translation': 'Hello',
      });
    });

    test('ListeningAnswer serializes correctly', () {
      expect(const ListeningAnswer(transcript: 'Xin chào').toJson(), {
        'transcript': 'Xin chào',
      });
    });

    test('SpeakingAnswer serializes correctly', () {
      expect(const SpeakingAnswer(transcript: 'Xin chào').toJson(), {
        'transcript': 'Xin chào',
      });
    });
  });
}
