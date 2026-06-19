import { QuestionType } from '../../../common/enums';
import {
  QuestionOptions,
  MultipleChoiceOptions,
  FillBlankOptions,
  SpeakingOptions,
  isMultipleChoiceOptions,
  isFillBlankOptions,
  isMatchingOptions,
  isSpeakingOptions,
} from './question-options.types';

describe('Exercise Options Types', () => {
  describe('Type Safety', () => {
    it('should enforce correct structure for MultipleChoice', () => {
      const options: MultipleChoiceOptions = {
        type: QuestionType.MULTIPLE_CHOICE,
        choices: ['A', 'B', 'C', 'D'],
      };

      expect(options.type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(options.choices).toHaveLength(4);
    });

    it('should enforce correct structure for FillBlank', () => {
      const options: FillBlankOptions = {
        type: QuestionType.FILL_BLANK,
        sentence: '___ là ___ .',
        blanks: 2,
        wordBank: ['answer1a', 'answer2a'],
        acceptedAnswers: [
          ['answer1a', 'answer1b'],
          ['answer2a', 'answer2b'],
        ],
      };

      expect(options.type).toBe(QuestionType.FILL_BLANK);
      expect(options.blanks).toBe(2);
    });

    it('should enforce correct structure for Speaking', () => {
      const options: SpeakingOptions = {
        type: QuestionType.SPEAKING,
        promptText: 'Xin chào',
        promptAudioUrl: '/uploads/audio/seed/a1/lesson-001/xin-chao.mp3',
        transcriptType: 'exact',
      };

      expect(options.type).toBe(QuestionType.SPEAKING);
      expect(options.promptText).toBe('Xin chào');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify MultipleChoice options', () => {
      const options: QuestionOptions = {
        type: QuestionType.MULTIPLE_CHOICE,
        choices: ['A', 'B', 'C'],
      };

      if (isMultipleChoiceOptions(options)) {
        // TypeScript knows this is MultipleChoiceOptions
        expect(options.choices).toBeDefined();
      } else {
        fail('Should be MultipleChoiceOptions');
      }
    });

    it('should correctly identify FillBlank options', () => {
      const options: QuestionOptions = {
        type: QuestionType.FILL_BLANK,
        sentence: '___',
        blanks: 1,
        wordBank: [],
      };

      if (isFillBlankOptions(options)) {
        expect(options.blanks).toBe(1);
      } else {
        fail('Should be FillBlankOptions');
      }
    });

    it('should return false for wrong type', () => {
      const options: QuestionOptions = {
        type: QuestionType.MULTIPLE_CHOICE,
        choices: ['A', 'B'],
      };

      expect(isMatchingOptions(options)).toBe(false);
    });

    it('should correctly identify Speaking options', () => {
      const options: QuestionOptions = {
        type: QuestionType.SPEAKING,
        promptText: 'Xin chào',
        promptAudioUrl: '/uploads/audio/seed/a1/lesson-001/xin-chao.mp3',
        transcriptType: 'exact',
      };

      expect(isSpeakingOptions(options)).toBe(true);
    });
  });

  describe('Discriminated Union', () => {
    it('should handle different exercise types', () => {
      const questions: QuestionOptions[] = [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          choices: ['A', 'B', 'C'],
        },
        {
          type: QuestionType.FILL_BLANK,
          sentence: '___ ___',
          blanks: 2,
          wordBank: [],
        },
        {
          type: QuestionType.MATCHING,
          pairs: [
            { left: 'Hello', right: 'Xin chào' },
            { left: 'Goodbye', right: 'Tạm biệt' },
          ],
        },
      ];

      questions.forEach((exercise) => {
        switch (exercise.type) {
          case QuestionType.MULTIPLE_CHOICE:
            expect(exercise.choices).toBeDefined();
            break;
          case QuestionType.FILL_BLANK:
            expect(exercise.blanks).toBeDefined();
            break;
          case QuestionType.MATCHING:
            expect(exercise.pairs).toBeDefined();
            break;
        }
      });
    });
  });
});
