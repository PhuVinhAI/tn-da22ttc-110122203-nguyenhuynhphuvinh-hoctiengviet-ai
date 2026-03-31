// Legacy intervals - replaced by FSRS algorithm
export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30]; // days

// FSRS Algorithm Configuration
export const FSRS_CONFIG = {
  REQUEST_RETENTION: 0.9, // Target 90% retention
  MAXIMUM_INTERVAL: 365, // Max 1 year between reviews
  ENABLE_FUZZ: true, // Add randomness to prevent review clustering
};

export const MASTERY_THRESHOLDS = {
  LEARNING: 0,
  FAMILIAR: 21, // 3 weeks stability
  MASTERED: 100, // 100 days stability
};

export const EXERCISE_TIME_LIMITS = {
  MULTIPLE_CHOICE: 60, // seconds
  FILL_BLANK: 90,
  MATCHING: 120,
  ORDERING: 90,
  TRANSLATION: 180,
  LISTENING: 120,
};

export const SCORE_WEIGHTS = {
  EXERCISE: 0.6,
  VOCABULARY: 0.2,
  GRAMMAR: 0.2,
};
