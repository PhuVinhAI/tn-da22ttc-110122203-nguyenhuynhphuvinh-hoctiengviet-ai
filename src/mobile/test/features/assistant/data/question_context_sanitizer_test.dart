import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/assistant/data/question_context_sanitizer.dart';
import 'package:linvnix/features/lessons/domain/question_models.dart';

Question _ex(
  QuestionType type, {
  required QuestionOptions options,
  required QuestionAnswer correctAnswer,
}) {
  return Question(
    id: 'ex-${type.value}',
    questionType: type,
    question: 'Q',
    options: options,
    correctAnswer: correctAnswer,
  );
}

void main() {
  group('userAnswerForAssistantContext', () {
    test('null answer stays null', () {
      expect(
        userAnswerForAssistantContext(QuestionType.multipleChoice, null),
        isNull,
      );
    });

    test('matching List<MatchPair> is flattened to JSON-safe maps', () {
      final converted = userAnswerForAssistantContext(
        QuestionType.matching,
        const [
          MatchPair(left: 'one', right: 'một'),
          MatchPair(left: 'two', right: 'hai'),
        ],
      );
      expect(converted, isA<List>());
      expect(converted, [
        {'left': 'one', 'right': 'một'},
        {'left': 'two', 'right': 'hai'},
      ]);
      // Crucially, the result must survive Dio's default JSON encoding.
      expect(jsonEncode(converted), contains('"left":"one"'));
    });

    test('multiple_choice String passes through', () {
      expect(
        userAnswerForAssistantContext(QuestionType.multipleChoice, 'A'),
        'A',
      );
    });

    test('fill_blank List<String> passes through', () {
      expect(
        userAnswerForAssistantContext(
          QuestionType.fillBlank,
          const ['chào', 'em'],
        ),
        ['chào', 'em'],
      );
    });

    test('ordering List<String> passes through', () {
      expect(
        userAnswerForAssistantContext(
          QuestionType.ordering,
          const ['a', 'b', 'c'],
        ),
        ['a', 'b', 'c'],
      );
    });

    test('listening/speaking transcript String passes through', () {
      expect(
        userAnswerForAssistantContext(QuestionType.listening, 'xin chào'),
        'xin chào',
      );
      expect(
        userAnswerForAssistantContext(QuestionType.speaking, 'xin chào'),
        'xin chào',
      );
    });
  });

  group('optionsForAssistantContext (pre-submit hides the answer)', () {
    test('multiple_choice forwards all choices — visible to learner anyway',
        () {
      final ex = _ex(
        QuestionType.multipleChoice,
        options: const MultipleChoiceOptions(choices: ['A', 'B', 'C']),
        correctAnswer: const MultipleChoiceAnswer(selectedChoice: 'B'),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['choices'], ['A', 'B', 'C']);
    });

    test('fill_blank strips acceptedAnswers, keeps blanks count', () {
      final ex = _ex(
        QuestionType.fillBlank,
        options: const FillBlankOptions(
          sentence: 'Xin ___ ___ !',
          blanks: 2,
          acceptedAnswers: [
            ['chào', 'hello'],
            ['bạn', 'you'],
          ],
        ),
        correctAnswer: const FillBlankAnswer(answers: ['chào', 'bạn']),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['blanks'], 2);
      expect(opts.containsKey('acceptedAnswers'), isFalse);
    });

    test(
        'matching strips left↔right mapping; exposes two independent item lists',
        () {
      final ex = _ex(
        QuestionType.matching,
        options: const MatchingOptions(pairs: [
          MatchPair(left: 'one', right: 'một'),
          MatchPair(left: 'two', right: 'hai'),
          MatchPair(left: 'three', right: 'ba'),
        ]),
        correctAnswer: const MatchingAnswer(matches: []),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['leftItems'], ['one', 'two', 'three']);
      // Right items are sorted (Vietnamese strings) → mapping order broken.
      expect(opts['rightItems'], contains('ba'));
      expect(opts['rightItems'], contains('hai'));
      expect(opts['rightItems'], contains('một'));
      expect(opts['pairCount'], 3);
      expect(opts.containsKey('pairs'), isFalse);
    });

    test('ordering strips canonical items, exposes sorted pool only', () {
      final ex = _ex(
        QuestionType.ordering,
        options: const OrderingOptions(items: ['Tôi', 'tên', 'là', 'Nam']),
        correctAnswer: const OrderingAnswer(
          orderedItems: ['Tôi', 'tên', 'là', 'Nam'],
        ),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      // Sorted alphabetically — the correct sequence is lost.
      expect(opts['availableItems'], orderedEquals(['Nam', 'Tôi', 'là', 'tên']));
      expect(opts['itemCount'], 4);
      expect(opts.containsKey('items'), isFalse);
    });

    test('translation strips acceptedTranslations, keeps languages', () {
      final ex = _ex(
        QuestionType.translation,
        options: const TranslationOptions(
          sourceText: 'xin chào',
          sourceLanguage: 'vi',
          targetLanguage: 'en',
          acceptedTranslations: ['hello', 'hi there'],
        ),
        correctAnswer: const TranslationAnswer(translation: 'hello'),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['sourceLanguage'], 'vi');
      expect(opts['targetLanguage'], 'en');
      expect(opts.containsKey('acceptedTranslations'), isFalse);
    });

    test('listening strips keywords, keeps audioUrl + transcriptType', () {
      final ex = _ex(
        QuestionType.listening,
        options: const ListeningOptions(
          audioUrl: '/media/l1.mp3',
          transcriptType: 'exact',
          keywords: ['chào'],
        ),
        correctAnswer: const ListeningAnswer(transcript: 'xin chào'),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['audioUrl'], '/media/l1.mp3');
      expect(opts['transcriptType'], 'exact');
      expect(opts.containsKey('keywords'), isFalse);
    });

    test(
        'speaking strips keywords, keeps promptText + promptAudioUrl '
        '(both visible to the learner already)', () {
      final ex = _ex(
        QuestionType.speaking,
        options: const SpeakingOptions(
          promptText: 'Xin chào',
          promptAudioUrl: '/media/s1.mp3',
          transcriptType: 'exact',
          keywords: ['chào'],
        ),
        correctAnswer: const SpeakingAnswer(transcript: 'Xin chào'),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: false);
      expect(opts['promptText'], 'Xin chào');
      expect(opts['promptAudioUrl'], '/media/s1.mp3');
      expect(opts['transcriptType'], 'exact');
      expect(opts.containsKey('keywords'), isFalse);
    });
  });

  group('optionsForAssistantContext (post-submit reveals everything)', () {
    test(
        'fill_blank reveals acceptedAnswers once submitted (AI explains '
        'mistakes)', () {
      final ex = _ex(
        QuestionType.fillBlank,
        options: const FillBlankOptions(
          sentence: 'Xin ___ ___ !',
          blanks: 2,
          acceptedAnswers: [
            ['chào', 'hello'],
            ['bạn', 'you'],
          ],
        ),
        correctAnswer: const FillBlankAnswer(answers: ['chào', 'bạn']),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: true);
      expect(opts['acceptedAnswers'], isNotNull);
      expect(opts['blanks'], 2);
    });

    test('matching reveals pairs once submitted', () {
      final ex = _ex(
        QuestionType.matching,
        options: const MatchingOptions(
          pairs: [MatchPair(left: 'one', right: 'một')],
        ),
        correctAnswer: const MatchingAnswer(matches: []),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: true);
      expect(opts['pairs'], isNotNull);
      expect((opts['pairs'] as List).first, containsPair('left', 'one'));
    });

    test('listening reveals keywords once submitted', () {
      final ex = _ex(
        QuestionType.listening,
        options: const ListeningOptions(
          audioUrl: '/media/l1.mp3',
          transcriptType: 'exact',
          keywords: ['chào', 'em'],
        ),
        correctAnswer: const ListeningAnswer(transcript: 'xin chào em'),
      );
      final opts = optionsForAssistantContext(ex, revealAnswers: true);
      expect(opts['keywords'], ['chào', 'em']);
    });
  });
}
