import { Injectable } from '@nestjs/common';

/**
 * FSRS (Free Spaced Repetition Scheduler) v4.5 Implementation
 * 
 * FSRS là thuật toán spaced repetition hiện đại, được Anki sử dụng từ 2023.
 * Ưu điểm so với SM-2:
 * - Dự đoán chính xác hơn dựa trên nghiên cứu khoa học mới
 * - Tính toán retention probability
 * - Tối ưu hóa cho long-term retention
 * 
 * Paper: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

export enum Rating {
  Again = 1,  // Completely forgot
  Hard = 2,   // Remembered with difficulty
  Good = 3,   // Remembered correctly
  Easy = 4,   // Remembered easily
}

export enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface FSRSParameters {
  requestRetention: number;  // Target retention (0.9 = 90%)
  maximumInterval: number;   // Max days between reviews
  w: number[];              // 17 weight parameters
}

export interface Card {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview?: Date;
}

export interface ReviewLog {
  rating: Rating;
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: Date;
}

export interface SchedulingInfo {
  card: Card;
  reviewLog: ReviewLog;
}

@Injectable()
export class FSRSService {
  // Default FSRS parameters (optimized from research)
  private readonly defaultParameters: FSRSParameters = {
    requestRetention: 0.9, // 90% retention target
    maximumInterval: 36500, // ~100 years
    w: [
      0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
      0.34, 1.26, 0.29, 2.61,
    ],
  };

  private parameters: FSRSParameters;

  constructor() {
    this.parameters = { ...this.defaultParameters };
  }

  /**
   * Initialize a new card
   */
  initCard(): Card {
    return {
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
    };
  }

  /**
   * Schedule a card review based on rating
   */
  repeat(card: Card, now: Date): Record<Rating, SchedulingInfo> {
    const newCard = { ...card };
    
    if (newCard.state === State.New) {
      newCard.elapsedDays = 0;
    } else {
      newCard.elapsedDays = this.daysBetween(card.lastReview || card.due, now);
    }

    newCard.lastReview = now;
    newCard.reps += 1;

    const s = new SchedulingCards(newCard);
    s.updateState(card.state);

    if (card.state === State.New) {
      this.initDS(s);

      const againInterval = 1;
      const hardInterval = 5;
      const goodInterval = this.nextInterval(s.good.stability);
      const easyInterval = this.nextInterval(s.easy.stability);
      
      s.again.scheduledDays = againInterval;
      s.hard.scheduledDays = hardInterval;
      s.good.scheduledDays = goodInterval;
      s.easy.scheduledDays = easyInterval;
      
      s.again.due = this.addDays(now, againInterval);
      s.hard.due = this.addDays(now, hardInterval);
      s.good.due = this.addDays(now, goodInterval);
      s.easy.due = this.addDays(now, easyInterval);
    } else if (card.state === State.Learning || card.state === State.Relearning) {
      const lastD = card.difficulty;
      const lastS = card.stability;
      const retrievability = this.forgettingCurve(newCard.elapsedDays, lastS);
      
      this.nextDS(s, lastD, lastS, retrievability);
      
      const hardInterval = 0;
      const goodInterval = this.nextInterval(s.good.stability);
      const easyInterval = Math.max(
        this.nextInterval(s.easy.stability),
        goodInterval + 1,
      );

      s.schedule(now, hardInterval, goodInterval, easyInterval);
    } else if (card.state === State.Review) {
      const interval = newCard.elapsedDays;
      const lastD = card.difficulty;
      const lastS = card.stability;
      const retrievability = this.forgettingCurve(interval, lastS);

      this.nextDS(s, lastD, lastS, retrievability);

      let hardInterval = this.nextInterval(s.hard.stability);
      let goodInterval = this.nextInterval(s.good.stability);
      hardInterval = Math.min(hardInterval, goodInterval);
      goodInterval = Math.max(goodInterval, hardInterval + 1);
      const easyInterval = Math.max(
        this.nextInterval(s.easy.stability),
        goodInterval + 1,
      );

      s.schedule(now, hardInterval, goodInterval, easyInterval);
    }

    return s.recordLog(card, now);
  }

  /**
   * Initialize difficulty and stability for new cards
   */
  private initDS(s: SchedulingCards): void {
    s.again.difficulty = this.initDifficulty(Rating.Again);
    s.again.stability = this.initStability(Rating.Again);
    s.hard.difficulty = this.initDifficulty(Rating.Hard);
    s.hard.stability = this.initStability(Rating.Hard);
    s.good.difficulty = this.initDifficulty(Rating.Good);
    s.good.stability = this.initStability(Rating.Good);
    s.easy.difficulty = this.initDifficulty(Rating.Easy);
    s.easy.stability = this.initStability(Rating.Easy);
  }

  /**
   * Calculate next difficulty and stability
   */
  private nextDS(
    s: SchedulingCards,
    lastD: number,
    lastS: number,
    retrievability: number,
  ): void {
    s.again.difficulty = this.nextDifficulty(lastD, Rating.Again);
    s.again.stability = this.nextForgetStability(lastD, lastS, retrievability);
    s.hard.difficulty = this.nextDifficulty(lastD, Rating.Hard);
    s.hard.stability = this.nextRecallStability(
      lastD,
      lastS,
      retrievability,
      Rating.Hard,
    );
    s.good.difficulty = this.nextDifficulty(lastD, Rating.Good);
    s.good.stability = this.nextRecallStability(
      lastD,
      lastS,
      retrievability,
      Rating.Good,
    );
    s.easy.difficulty = this.nextDifficulty(lastD, Rating.Easy);
    s.easy.stability = this.nextRecallStability(
      lastD,
      lastS,
      retrievability,
      Rating.Easy,
    );
  }

  private initStability(r: Rating): number {
    return Math.max(this.parameters.w[r - 1], 0.1);
  }

  private initDifficulty(r: Rating): number {
    return Math.min(Math.max(this.parameters.w[4] - (r - 3) * this.parameters.w[5], 1), 10);
  }

  private forgettingCurve(elapsedDays: number, stability: number): number {
    return Math.pow(1 + (elapsedDays / (9 * stability)), -1);
  }

  private nextInterval(s: number): number {
    const newInterval = s * (Math.log(this.parameters.requestRetention) / Math.log(0.9));
    return Math.min(
      Math.max(Math.round(newInterval), 1),
      this.parameters.maximumInterval,
    );
  }

  private nextDifficulty(d: number, r: Rating): number {
    const nextD = d - this.parameters.w[6] * (r - 3);
    return Math.min(Math.max(this.meanReversion(this.parameters.w[4], nextD), 1), 10);
  }

  private meanReversion(init: number, current: number): number {
    return this.parameters.w[7] * init + (1 - this.parameters.w[7]) * current;
  }

  private nextRecallStability(
    d: number,
    s: number,
    r: number,
    rating: Rating,
  ): number {
    const hardPenalty = rating === Rating.Hard ? this.parameters.w[15] : 1;
    const easyBonus = rating === Rating.Easy ? this.parameters.w[16] : 1;
    return (
      s *
      (1 +
        Math.exp(this.parameters.w[8]) *
          (11 - d) *
          Math.pow(s, -this.parameters.w[9]) *
          (Math.exp((1 - r) * this.parameters.w[10]) - 1) *
          hardPenalty *
          easyBonus)
    );
  }

  private nextForgetStability(d: number, s: number, r: number): number {
    return (
      this.parameters.w[11] *
      Math.pow(d, -this.parameters.w[12]) *
      (Math.pow(s + 1, this.parameters.w[13]) - 1) *
      Math.exp((1 - r) * this.parameters.w[14])
    );
  }

  private daysBetween(from: Date, to: Date): number {
    const diff = to.getTime() - from.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get current retrievability (probability of recall)
   */
  getRetrievability(card: Card, now: Date): number {
    if (card.state === State.New) return 0;
    const elapsedDays = this.daysBetween(card.lastReview || card.due, now);
    return this.forgettingCurve(elapsedDays, card.stability);
  }
}

/**
 * Helper class to manage scheduling for all rating options
 */
class SchedulingCards {
  again: Card;
  hard: Card;
  good: Card;
  easy: Card;

  constructor(card: Card) {
    this.again = { ...card };
    this.hard = { ...card };
    this.good = { ...card };
    this.easy = { ...card };
  }

  updateState(state: State): void {
    if (state === State.New) {
      this.again.state = State.Learning;
      this.hard.state = State.Learning;
      this.good.state = State.Learning;
      this.easy.state = State.Review;
    } else if (state === State.Learning || state === State.Relearning) {
      this.again.state = state;
      this.hard.state = state;
      this.good.state = State.Review;
      this.easy.state = State.Review;
    } else if (state === State.Review) {
      this.again.state = State.Relearning;
      this.hard.state = State.Review;
      this.good.state = State.Review;
      this.easy.state = State.Review;
      this.again.lapses += 1;
    }
  }

  schedule(now: Date, hardInterval: number, goodInterval: number, easyInterval: number): void {
    this.again.scheduledDays = 0;
    this.hard.scheduledDays = hardInterval;
    this.good.scheduledDays = goodInterval;
    this.easy.scheduledDays = easyInterval;

    this.again.due = this.addDays(now, 0);
    this.hard.due = this.addDays(now, hardInterval);
    this.good.due = this.addDays(now, goodInterval);
    this.easy.due = this.addDays(now, easyInterval);
  }

  recordLog(card: Card, now: Date): Record<Rating, SchedulingInfo> {
    return {
      [Rating.Again]: {
        card: this.again,
        reviewLog: this.buildLog(Rating.Again, card, now),
      },
      [Rating.Hard]: {
        card: this.hard,
        reviewLog: this.buildLog(Rating.Hard, card, now),
      },
      [Rating.Good]: {
        card: this.good,
        reviewLog: this.buildLog(Rating.Good, card, now),
      },
      [Rating.Easy]: {
        card: this.easy,
        reviewLog: this.buildLog(Rating.Easy, card, now),
      },
    };
  }

  private buildLog(rating: Rating, card: Card, now: Date): ReviewLog {
    const scheduledCard = this.getCardByRating(rating);
    return {
      rating,
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      lastElapsedDays: card.scheduledDays,
      scheduledDays: scheduledCard.scheduledDays,
      review: now,
    };
  }

  private getCardByRating(rating: Rating): Card {
    switch (rating) {
      case Rating.Again:
        return this.again;
      case Rating.Hard:
        return this.hard;
      case Rating.Good:
        return this.good;
      case Rating.Easy:
        return this.easy;
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
