/**
 * Application constants
 */

// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
export const API_TIMEOUT = 30000; // 30 seconds

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'linvnix_access_token',
  REFRESH_TOKEN: 'linvnix_refresh_token',
  USER: 'linvnix_user',
} as const;

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  // Học liệu
  COURSES: '/courses',
  COURSE_NEW: '/courses/new',
  COURSE_EDIT: '/courses/:id/edit',
  COURSE_DETAIL: '/courses/:courseId',
  MODULE_NEW: '/courses/:courseId/modules/new',
  MODULE_EDIT: '/courses/:courseId/modules/:id/edit',
  MODULE_DETAIL: '/modules/:moduleId',
  LESSON_NEW: '/modules/:moduleId/lessons/new',
  LESSON_EDIT: '/modules/:moduleId/lessons/:id/edit',
  LESSON_DETAIL: '/lessons/:lessonId',
  CONTENT_NEW: '/lessons/:lessonId/contents/new',
  CONTENT_EDIT: '/lessons/:lessonId/contents/:id/edit',
  VOCABULARY_NEW: '/lessons/:lessonId/vocabularies/new',
  VOCABULARY_EDIT: '/lessons/:lessonId/vocabularies/:id/edit',
  GRAMMAR_NEW: '/lessons/:lessonId/grammar/new',
  GRAMMAR_EDIT: '/lessons/:lessonId/grammar/:id/edit',
  EXERCISE_SET_NEW: '/lessons/:lessonId/exercise-sets/new',
  EXERCISE_SET_EDIT: '/lessons/:lessonId/exercise-sets/:id/edit',
  EXERCISE_SET_DETAIL: '/exercise-sets/:setId',
  EXERCISE_NEW: '/exercise-sets/:setId/exercises/new',
  EXERCISE_EDIT: '/exercise-sets/:setId/exercises/:id/edit',
  // Hội thoại mô phỏng
  SCENARIOS: '/scenarios',
  SCENARIO_CATEGORIES: '/scenario-categories',
  SCENARIO_CATEGORY_NEW: '/scenario-categories/new',
  SCENARIO_CATEGORY_EDIT: '/scenario-categories/:id/edit',
  SCENARIO_CATEGORY_DETAIL: '/scenario-categories/:categoryId',
  SCENARIO_NEW: '/scenario-categories/:categoryId/scenarios/new',
  SCENARIO_EDIT: '/scenario-categories/:categoryId/scenarios/:id/edit',
  SCENARIO_DETAIL: '/scenarios/:scenarioId',
  SCENARIO_CHARACTER_NEW: '/scenarios/:scenarioId/characters/new',
  SCENARIO_CHARACTER_EDIT: '/scenarios/:scenarioId/characters/:id/edit',
  // Người dùng
  LEARNERS: '/learners',
  LEARNER_DETAIL: '/learners/:learnerId',
  LEARNER_CONVERSATION_DETAIL: '/learners/:learnerId/conversations/:conversationId',
  LEARNER_SIMULATION_DETAIL: '/learners/:learnerId/simulations/:sessionId',
  // Cài đặt
  SETTINGS: '/settings',
} as const;
