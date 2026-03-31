import { TestDataBuilder } from '../utils/test-data';

/**
 * Vocabulary fixtures for testing
 */
export const vocabularyFixtures = {
  /**
   * Hello - Xin chào
   */
  hello: (lessonId: string) => ({
    word: 'xin chào',
    translation: 'hello',
    phonetic: 'sin chao',
    partOfSpeech: 'phrase',
    exampleSentence: 'Xin chào, tôi là Nam.',
    exampleTranslation: 'Hello, I am Nam.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Thank you - Cảm ơn
   */
  thankYou: (lessonId: string) => ({
    word: 'cảm ơn',
    translation: 'thank you',
    phonetic: 'gam un',
    partOfSpeech: 'phrase',
    exampleSentence: 'Cảm ơn bạn rất nhiều.',
    exampleTranslation: 'Thank you very much.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Goodbye - Tạm biệt
   */
  goodbye: (lessonId: string) => ({
    word: 'tạm biệt',
    translation: 'goodbye',
    phonetic: 'tam biet',
    partOfSpeech: 'phrase',
    exampleSentence: 'Tạm biệt, hẹn gặp lại.',
    exampleTranslation: 'Goodbye, see you again.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Family - Gia đình
   */
  family: (lessonId: string) => ({
    word: 'gia đình',
    translation: 'family',
    phonetic: 'za dinh',
    partOfSpeech: 'noun',
    exampleSentence: 'Gia đình tôi có 4 người.',
    exampleTranslation: 'My family has 4 people.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Mother - Mẹ
   */
  mother: (lessonId: string) => ({
    word: 'mẹ',
    translation: 'mother',
    phonetic: 'me',
    partOfSpeech: 'noun',
    exampleSentence: 'Mẹ tôi là giáo viên.',
    exampleTranslation: 'My mother is a teacher.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Father - Bố
   */
  father: (lessonId: string) => ({
    word: 'bố',
    translation: 'father',
    phonetic: 'bo',
    partOfSpeech: 'noun',
    exampleSentence: 'Bố tôi là bác sĩ.',
    exampleTranslation: 'My father is a doctor.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Generate random vocabulary
   */
  randomVocabulary: (lessonId: string) => TestDataBuilder.vocabulary(lessonId),

  /**
   * Generate vocabulary with specific difficulty
   */
  vocabularyWithDifficulty: (lessonId: string, difficulty: number) =>
    TestDataBuilder.vocabulary(lessonId, { difficultyLevel: difficulty }),
};

/**
 * Grammar rule fixtures for testing
 */
export const grammarFixtures = {
  /**
   * Subject-Verb-Object structure
   */
  svoStructure: (lessonId: string) => ({
    title: 'Basic Sentence Structure (SVO)',
    explanation:
      'Vietnamese follows Subject-Verb-Object word order, similar to English.',
    structure: 'Subject + Verb + Object',
    examples: [
      { vi: 'Tôi ăn cơm', en: 'I eat rice' },
      { vi: 'Bạn học tiếng Việt', en: 'You learn Vietnamese' },
      { vi: 'Họ đi làm', en: 'They go to work' },
    ],
    notes: 'This is the most common sentence structure in Vietnamese.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Personal pronouns
   */
  personalPronouns: (lessonId: string) => ({
    title: 'Personal Pronouns',
    explanation:
      'Vietnamese pronouns vary based on age, gender, and social relationship.',
    structure: 'Pronoun + Verb + ...',
    examples: [
      { vi: 'Tôi là sinh viên', en: 'I am a student' },
      { vi: 'Bạn là người Việt', en: 'You are Vietnamese' },
      { vi: 'Anh ấy là giáo viên', en: 'He is a teacher' },
    ],
    notes: 'Choose pronouns carefully based on context and relationship.',
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Generate random grammar rule
   */
  randomGrammar: (lessonId: string) => TestDataBuilder.grammarRule(lessonId),
};

/**
 * Exercise fixtures for testing
 */
export const exerciseFixtures = {
  /**
   * Multiple choice exercise (with strict typing)
   */
  multipleChoice: (lessonId: string) => ({
    exerciseType: 'multiple_choice',
    question: 'What is the Vietnamese word for "hello"?',
    options: {
      type: 'multiple_choice',
      choices: ['xin chào', 'cảm ơn', 'tạm biệt', 'xin lỗi'],
    },
    correctAnswer: {
      selectedChoice: 'xin chào',
    },
    explanation: '"Xin chào" is the most common way to say hello in Vietnamese.',
    orderIndex: 1,
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Fill in the blank exercise (with strict typing)
   */
  fillBlank: (lessonId: string) => ({
    exerciseType: 'fill_blank',
    question: 'Complete: Tôi ___ cơm. (I eat rice)',
    options: {
      type: 'fill_blank',
      blanks: 1,
      acceptedAnswers: [['ăn']],
    },
    correctAnswer: {
      answers: ['ăn'],
    },
    explanation: '"Ăn" means "to eat" in Vietnamese.',
    orderIndex: 2,
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Translation exercise (with strict typing)
   */
  translation: (lessonId: string) => ({
    exerciseType: 'translation',
    question: 'Translate to Vietnamese: Thank you very much',
    options: {
      type: 'translation',
      sourceLanguage: 'English',
      targetLanguage: 'Vietnamese',
      acceptedTranslations: ['Cảm ơn rất nhiều', 'Cảm ơn nhiều'],
    },
    correctAnswer: {
      translation: 'Cảm ơn rất nhiều',
    },
    explanation: '"Cảm ơn" means thank you, "rất nhiều" means very much.',
    orderIndex: 3,
    difficultyLevel: 1,
    lessonId,
  }),

  /**
   * Generate random exercise
   */
  randomExercise: (lessonId: string) => TestDataBuilder.exercise(lessonId),

  /**
   * Generate exercise with specific type
   */
  exerciseWithType: (lessonId: string, type: string) =>
    TestDataBuilder.exercise(lessonId, { exerciseType: type }),
};
