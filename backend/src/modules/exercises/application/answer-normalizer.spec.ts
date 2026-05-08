import { ExerciseType } from '../../../common/enums';
import { AnswerNormalizer } from './answer-normalizer';

describe('AnswerNormalizer', () => {
  const normalizer = new AnswerNormalizer();

  describe('MultipleChoice', () => {
    it('converts old string format to MultipleChoiceAnswer', () => {
      const result = normalizer.normalize(ExerciseType.MULTIPLE_CHOICE, 'A');
      expect(result).toEqual({ selectedChoice: 'A' });
    });

    it('passes through new format unchanged', () => {
      const input = { selectedChoice: 'B' };
      const result = normalizer.normalize(ExerciseType.MULTIPLE_CHOICE, input);
      expect(result).toEqual({ selectedChoice: 'B' });
    });
  });

  describe('FillBlank', () => {
    it('converts old array format to FillBlankAnswer', () => {
      const result = normalizer.normalize(ExerciseType.FILL_BLANK, [
        'xin chào',
        'tạm biệt',
      ]);
      expect(result).toEqual({ answers: ['xin chào', 'tạm biệt'] });
    });

    it('passes through new format unchanged', () => {
      const input = { answers: ['xin chào'] };
      const result = normalizer.normalize(ExerciseType.FILL_BLANK, input);
      expect(result).toEqual({ answers: ['xin chào'] });
    });
  });

  describe('Matching', () => {
    it('passes through new format unchanged', () => {
      const input = { matches: [{ left: 'A', right: '1' }] };
      const result = normalizer.normalize(ExerciseType.MATCHING, input);
      expect(result).toEqual({ matches: [{ left: 'A', right: '1' }] });
    });

    it('wraps bare object with matches property', () => {
      const input = { matches: [{ left: 'A', right: '1' }] };
      const result = normalizer.normalize(ExerciseType.MATCHING, input);
      expect(result).toEqual(input);
    });
  });

  describe('Ordering', () => {
    it('converts old array format to OrderingAnswer', () => {
      const result = normalizer.normalize(ExerciseType.ORDERING, [
        'first',
        'second',
        'third',
      ]);
      expect(result).toEqual({ orderedItems: ['first', 'second', 'third'] });
    });

    it('passes through new format unchanged', () => {
      const input = { orderedItems: ['first', 'second'] };
      const result = normalizer.normalize(ExerciseType.ORDERING, input);
      expect(result).toEqual({ orderedItems: ['first', 'second'] });
    });
  });

  describe('Translation', () => {
    it('converts old string format to TranslationAnswer', () => {
      const result = normalizer.normalize(
        ExerciseType.TRANSLATION,
        'xin chào thế giới',
      );
      expect(result).toEqual({ translation: 'xin chào thế giới' });
    });

    it('passes through new format unchanged', () => {
      const input = { translation: 'hello world' };
      const result = normalizer.normalize(ExerciseType.TRANSLATION, input);
      expect(result).toEqual({ translation: 'hello world' });
    });
  });

  describe('Listening', () => {
    it('converts old string format to ListeningAnswer', () => {
      const result = normalizer.normalize(ExerciseType.LISTENING, 'xin chào');
      expect(result).toEqual({ transcript: 'xin chào' });
    });

    it('passes through new format unchanged', () => {
      const input = { transcript: 'hello' };
      const result = normalizer.normalize(ExerciseType.LISTENING, input);
      expect(result).toEqual({ transcript: 'hello' });
    });
  });

  describe('edge cases', () => {
    it('returns fallback for unknown exercise type', () => {
      const result = normalizer.normalize('UNKNOWN' as ExerciseType, 'data');
      expect(result).toEqual({});
    });

    it('handles null input gracefully', () => {
      const result = normalizer.normalize(ExerciseType.MULTIPLE_CHOICE, null);
      expect(result).toEqual({ selectedChoice: '' });
    });

    it('handles undefined input gracefully', () => {
      const result = normalizer.normalize(ExerciseType.FILL_BLANK, undefined);
      expect(result).toEqual({ answers: [] });
    });
  });
});
