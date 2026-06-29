import type { CheckerAdapter } from '../../domain/assessment.types';
import type {
  MultipleChoiceAnswer,
  FillBlankAnswer,
  MatchingAnswer,
  OrderingAnswer,
  TranslationAnswer,
  ListeningAnswer,
  SpeakingAnswer,
} from '../../domain/question-options.types';
import { MultipleChoiceChecker } from './multiple-choice.checker';
import { FillBlankChecker } from './fill-blank.checker';
import { MatchingChecker } from './matching.checker';
import { OrderingChecker } from './ordering.checker';
import { TranslationChecker } from './translation.checker';
import { ListeningChecker } from './listening.checker';
import { SpeakingChecker } from './speaking.checker';

describe('AnswerAssessment - CheckerAdapters', () => {
  describe('MultipleChoiceChecker', () => {
    const checker: CheckerAdapter = new MultipleChoiceChecker();

    it('returns isCorrect true when selectedChoice matches (case-insensitive)', () => {
      const result = checker.check(
        { selectedChoice: 'A' } as MultipleChoiceAnswer,
        { selectedChoice: 'a' } as MultipleChoiceAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when selectedChoice differs', () => {
      const result = checker.check(
        { selectedChoice: 'B' } as MultipleChoiceAnswer,
        { selectedChoice: 'A' } as MultipleChoiceAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('trims whitespace before comparing', () => {
      const result = checker.check(
        { selectedChoice: '  A  ' } as MultipleChoiceAnswer,
        { selectedChoice: 'A' } as MultipleChoiceAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns feedback when selectedChoice is empty', () => {
      const result = checker.check(
        { selectedChoice: '' } as MultipleChoiceAnswer,
        { selectedChoice: 'A' } as MultipleChoiceAnswer,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('FillBlankChecker', () => {
    const checker: CheckerAdapter = new FillBlankChecker();

    it('returns isCorrect true when all answers match (normalized)', () => {
      const result = checker.check(
        { answers: ['xin chào'] } as FillBlankAnswer,
        { answers: ['Xin Chào'] } as FillBlankAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when answers differ', () => {
      const result = checker.check(
        { answers: ['tạm biệt'] } as FillBlankAnswer,
        { answers: ['xin chào'] } as FillBlankAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('returns isCorrect false when answer count differs', () => {
      const result = checker.check(
        { answers: ['a', 'b'] } as FillBlankAnswer,
        { answers: ['a'] } as FillBlankAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('handles multiple blanks correctly', () => {
      const result = checker.check(
        { answers: ['xin chào', 'tạm biệt'] } as FillBlankAnswer,
        { answers: ['xin chào', 'tạm biệt'] } as FillBlankAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('normalizes punctuation and whitespace', () => {
      const result = checker.check(
        { answers: ['xin  chào!'] } as FillBlankAnswer,
        { answers: ['xin chào'] } as FillBlankAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('MatchingChecker', () => {
    const checker: CheckerAdapter = new MatchingChecker();

    it('returns isCorrect true when all pairs match', () => {
      const result = checker.check(
        {
          matches: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
        } as MatchingAnswer,
        {
          matches: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
        } as MatchingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when a pair mismatches', () => {
      const result = checker.check(
        {
          matches: [
            { left: 'A', right: '2' },
            { left: 'B', right: '1' },
          ],
        } as MatchingAnswer,
        {
          matches: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
        } as MatchingAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('is order-independent on left side', () => {
      const result = checker.check(
        {
          matches: [
            { left: 'B', right: '2' },
            { left: 'A', right: '1' },
          ],
        } as MatchingAnswer,
        {
          matches: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
        } as MatchingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when match count differs', () => {
      const result = checker.check(
        { matches: [{ left: 'A', right: '1' }] } as MatchingAnswer,
        {
          matches: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' },
          ],
        } as MatchingAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('normalizes case and whitespace on keys and values', () => {
      const result = checker.check(
        { matches: [{ left: ' a ', right: ' 1 ' }] } as MatchingAnswer,
        { matches: [{ left: 'A', right: '1' }] } as MatchingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('OrderingChecker', () => {
    const checker: CheckerAdapter = new OrderingChecker();

    it('returns isCorrect true when items are in correct order', () => {
      const result = checker.check(
        { orderedItems: ['first', 'second', 'third'] } as OrderingAnswer,
        { orderedItems: ['first', 'second', 'third'] } as OrderingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when items are in wrong order', () => {
      const result = checker.check(
        { orderedItems: ['second', 'first', 'third'] } as OrderingAnswer,
        { orderedItems: ['first', 'second', 'third'] } as OrderingAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('is case-insensitive', () => {
      const result = checker.check(
        { orderedItems: ['First', 'SECOND'] } as OrderingAnswer,
        { orderedItems: ['first', 'second'] } as OrderingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when item count differs', () => {
      const result = checker.check(
        { orderedItems: ['first'] } as OrderingAnswer,
        { orderedItems: ['first', 'second'] } as OrderingAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('TranslationChecker', () => {
    const checker: CheckerAdapter = new TranslationChecker();

    it('returns isCorrect true for very similar translations', () => {
      const result = checker.check(
        { translation: 'xin chào thế giới' } as TranslationAnswer,
        { translation: 'xin chào thế giới' } as TranslationAnswer,
      );
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.8);
    });

    it('returns isCorrect false for completely different translations', () => {
      const result = checker.check(
        { translation: 'abc def ghi' } as TranslationAnswer,
        { translation: 'xyz uvw rst' } as TranslationAnswer,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.similarity).toBeLessThanOrEqual(0.8);
    });

    it('returns similarity score in result', () => {
      const result = checker.check(
        { translation: 'hello world' } as TranslationAnswer,
        { translation: 'hello world!' } as TranslationAnswer,
      );
      expect(result.similarity).toBeDefined();
      expect(typeof result.similarity).toBe('number');
    });

    it('returns isCorrect false with feedback when translation is empty', () => {
      const result = checker.check(
        { translation: '' } as TranslationAnswer,
        { translation: 'xin chào' } as TranslationAnswer,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    it('normalizes before comparing (case, punctuation, whitespace)', () => {
      const result = checker.check(
        { translation: 'Xin  Chào!' } as TranslationAnswer,
        { translation: 'xin chào' } as TranslationAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('ListeningChecker', () => {
    const checker: CheckerAdapter = new ListeningChecker();

    it('returns isCorrect true when transcripts match (normalized)', () => {
      const result = checker.check(
        { transcript: 'xin chào' } as ListeningAnswer,
        { transcript: 'Xin Chào' } as ListeningAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when transcripts differ', () => {
      const result = checker.check(
        { transcript: 'tạm biệt' } as ListeningAnswer,
        { transcript: 'xin chào' } as ListeningAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('returns isCorrect false with feedback when transcript is empty', () => {
      const result = checker.check(
        { transcript: '' } as ListeningAnswer,
        { transcript: 'xin chào' } as ListeningAnswer,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    it('normalizes punctuation and whitespace', () => {
      const result = checker.check(
        { transcript: 'xin  chào!' } as ListeningAnswer,
        { transcript: 'xin chào' } as ListeningAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('SpeakingChecker', () => {
    const checker: CheckerAdapter = new SpeakingChecker();

    it('returns isCorrect true when transcripts match (normalized)', () => {
      const result = checker.check(
        { transcript: 'xin chào' } as SpeakingAnswer,
        { transcript: 'Xin Chào' } as SpeakingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect false when transcripts differ', () => {
      const result = checker.check(
        { transcript: 'tạm biệt' } as SpeakingAnswer,
        { transcript: 'xin chào' } as SpeakingAnswer,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('returns isCorrect false with feedback when transcript is empty', () => {
      const result = checker.check(
        { transcript: '' } as SpeakingAnswer,
        { transcript: 'xin chào' } as SpeakingAnswer,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    it('normalizes punctuation and whitespace', () => {
      const result = checker.check(
        { transcript: 'xin  chào!' } as SpeakingAnswer,
        { transcript: 'xin chào' } as SpeakingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('matches identical text across NFC and NFD Unicode forms', () => {
      const result = checker.check(
        { transcript: 'xin chào'.normalize('NFD') } as SpeakingAnswer,
        { transcript: 'Xin chào'.normalize('NFC') } as SpeakingAnswer,
      );
      expect(result.isCorrect).toBe(true);
    });
  });
});
