import { ExerciseType } from '../../../common/enums';
import {
  ExerciseOptions,
  MultipleChoiceOptions,
  FillBlankOptions,
  isMultipleChoiceOptions,
  isFillBlankOptions,
  isMatchingOptions,
} from './exercise-options.types';

describe('Exercise Options Types', () => {
  describe('Type Safety', () => {
    it('should enforce correct structure for MultipleChoice', () => {
      const options: MultipleChoiceOptions = {
        type: ExerciseType.MULTIPLE_CHOICE,
        choices: ['A', 'B', 'C', 'D'],
      };

      expect(options.type).toBe(ExerciseType.MULTIPLE_CHOICE);
      expect(options.choices).toHaveLength(4);
    });

    it('should enforce correct structure for FillBlank', () => {
      const options: FillBlankOptions = {
        type: ExerciseType.FILL_BLANK,
        blanks: 2,
        acceptedAnswers: [
          ['answer1a', 'answer1b'],
          ['answer2a', 'answer2b'],
        ],
      };

      expect(options.type).toBe(ExerciseType.FILL_BLANK);
      expect(options.blanks).toBe(2);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify MultipleChoice options', () => {
      const options: ExerciseOptions = {
        type: ExerciseType.MULTIPLE_CHOICE,
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
      const options: ExerciseOptions = {
        type: ExerciseType.FILL_BLANK,
        blanks: 1,
      };

      if (isFillBlankOptions(options)) {
        expect(options.blanks).toBe(1);
      } else {
        fail('Should be FillBlankOptions');
      }
    });

    it('should return false for wrong type', () => {
      const options: ExerciseOptions = {
        type: ExerciseType.MULTIPLE_CHOICE,
        choices: ['A', 'B'],
      };

      expect(isMatchingOptions(options)).toBe(false);
    });
  });

  describe('Discriminated Union', () => {
    it('should handle different exercise types', () => {
      const exercises: ExerciseOptions[] = [
        {
          type: ExerciseType.MULTIPLE_CHOICE,
          choices: ['A', 'B', 'C'],
        },
        {
          type: ExerciseType.FILL_BLANK,
          blanks: 2,
        },
        {
          type: ExerciseType.MATCHING,
          pairs: [
            { left: 'Hello', right: 'Xin chào' },
            { left: 'Goodbye', right: 'Tạm biệt' },
          ],
        },
      ];

      exercises.forEach((exercise) => {
        switch (exercise.type) {
          case ExerciseType.MULTIPLE_CHOICE:
            expect(exercise.choices).toBeDefined();
            break;
          case ExerciseType.FILL_BLANK:
            expect(exercise.blanks).toBeDefined();
            break;
          case ExerciseType.MATCHING:
            expect(exercise.pairs).toBeDefined();
            break;
        }
      });
    });
  });
});
