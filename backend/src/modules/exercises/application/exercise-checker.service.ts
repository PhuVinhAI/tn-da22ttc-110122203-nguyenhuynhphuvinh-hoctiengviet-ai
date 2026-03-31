import { Injectable } from '@nestjs/common';
import { ExerciseType } from '../../../common/enums';
import type {
  ExerciseAnswer,
  MultipleChoiceAnswer,
  FillBlankAnswer,
  MatchingAnswer,
  OrderingAnswer,
  TranslationAnswer,
  ListeningAnswer,
} from '../domain/exercise-options.types';

@Injectable()
export class ExerciseCheckerService {
  checkAnswer(
    exerciseType: ExerciseType,
    userAnswer: ExerciseAnswer | any, // any for backward compatibility
    correctAnswer: ExerciseAnswer,
  ): boolean {
    switch (exerciseType) {
      case ExerciseType.MULTIPLE_CHOICE:
        return this.checkMultipleChoice(
          userAnswer as MultipleChoiceAnswer,
          correctAnswer as MultipleChoiceAnswer,
        );

      case ExerciseType.FILL_BLANK:
        return this.checkFillBlank(
          userAnswer as FillBlankAnswer,
          correctAnswer as FillBlankAnswer,
        );

      case ExerciseType.MATCHING:
        return this.checkMatching(
          userAnswer as MatchingAnswer,
          correctAnswer as MatchingAnswer,
        );

      case ExerciseType.ORDERING:
        return this.checkOrdering(
          userAnswer as OrderingAnswer,
          correctAnswer as OrderingAnswer,
        );

      case ExerciseType.TRANSLATION:
        return this.checkTranslation(
          userAnswer as TranslationAnswer,
          correctAnswer as TranslationAnswer,
        );

      case ExerciseType.LISTENING:
        return this.checkListening(
          userAnswer as ListeningAnswer,
          correctAnswer as ListeningAnswer,
        );

      default:
        return false;
    }
  }

  private checkMultipleChoice(
    userAnswer: MultipleChoiceAnswer | any,
    correctAnswer: MultipleChoiceAnswer,
  ): boolean {
    // Handle both old format (string) and new format (object)
    const userChoice =
      typeof userAnswer === 'string' ? userAnswer : userAnswer?.selectedChoice;
    const correctChoice = correctAnswer.selectedChoice;

    if (!userChoice || !correctChoice) return false;

    return (
      userChoice.trim().toLowerCase() === correctChoice.trim().toLowerCase()
    );
  }

  private checkFillBlank(
    userAnswer: FillBlankAnswer | any,
    correctAnswer: FillBlankAnswer,
  ): boolean {
    // Handle both old format (string) and new format (object)
    const userAnswers = Array.isArray(userAnswer)
      ? userAnswer
      : userAnswer?.answers || [userAnswer];
    const correctAnswers = correctAnswer.answers;

    if (userAnswers.length !== correctAnswers.length) return false;

    return userAnswers.every((userAns, index) => {
      const normalizedUser = this.normalizeVietnamese(userAns);
      const normalizedCorrect = this.normalizeVietnamese(correctAnswers[index]);
      return normalizedUser === normalizedCorrect;
    });
  }

  private checkMatching(
    userAnswer: MatchingAnswer | any,
    correctAnswer: MatchingAnswer,
  ): boolean {
    // Handle both old format (object) and new format (array of pairs)
    const userMatches = userAnswer?.matches || [];
    const correctMatches = correctAnswer.matches;

    if (userMatches.length !== correctMatches.length) return false;

    // Convert to maps for easier comparison
    const userMap = new Map(
      userMatches.map((m: any) => [
        m.left.trim().toLowerCase(),
        m.right.trim().toLowerCase(),
      ]),
    );
    const correctMap = new Map(
      correctMatches.map((m) => [
        m.left.trim().toLowerCase(),
        m.right.trim().toLowerCase(),
      ]),
    );

    for (const [left, right] of correctMap) {
      if (userMap.get(left) !== right) return false;
    }

    return true;
  }

  private checkOrdering(
    userAnswer: OrderingAnswer | any,
    correctAnswer: OrderingAnswer,
  ): boolean {
    // Handle both old format (array) and new format (object)
    const userItems = Array.isArray(userAnswer)
      ? userAnswer
      : userAnswer?.orderedItems || [];
    const correctItems = correctAnswer.orderedItems;

    if (userItems.length !== correctItems.length) return false;

    return userItems.every(
      (item, index) =>
        item.trim().toLowerCase() ===
        correctItems[index].trim().toLowerCase(),
    );
  }

  private checkTranslation(
    userAnswer: TranslationAnswer | any,
    correctAnswer: TranslationAnswer,
  ): boolean {
    // Handle both old format (string) and new format (object)
    const userTranslation =
      typeof userAnswer === 'string' ? userAnswer : userAnswer?.translation;
    const correctTranslation = correctAnswer.translation;

    if (!userTranslation || !correctTranslation) return false;

    const normalizedUser = this.normalizeVietnamese(userTranslation);
    const normalizedCorrect = this.normalizeVietnamese(correctTranslation);

    return this.calculateSimilarity(normalizedUser, normalizedCorrect) > 0.8;
  }

  private checkListening(
    userAnswer: ListeningAnswer | any,
    correctAnswer: ListeningAnswer,
  ): boolean {
    // Handle both old format (string) and new format (object)
    const userTranscript =
      typeof userAnswer === 'string' ? userAnswer : userAnswer?.transcript;
    const correctTranscript = correctAnswer.transcript;

    if (!userTranscript || !correctTranscript) return false;

    const normalizedUser = this.normalizeVietnamese(userTranscript);
    const normalizedCorrect = this.normalizeVietnamese(correctTranscript);

    return normalizedUser === normalizedCorrect;
  }

  private normalizeVietnamese(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]/g, '');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
