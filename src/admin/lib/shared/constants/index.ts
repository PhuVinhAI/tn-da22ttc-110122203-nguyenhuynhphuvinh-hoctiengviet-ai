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
  LESSON_STAGE_CONTENT: '/lessons/:lessonId/content',
  LESSON_STAGE_EXERCISES: '/lessons/:lessonId/exercises',
  LESSON_SECTION: '/lessons/:lessonId/sections/:section',
  LESSON_MATERIAL_NEW: '/lessons/:lessonId/materials/new',
  LESSON_MATERIAL_EDIT: '/lessons/:lessonId/materials/:id/edit',
  LESSON_VOCAB_NEW: '/lessons/:lessonId/vocabulary/new',
  LESSON_VOCAB_EDIT: '/lessons/:lessonId/vocabulary/:id/edit',
  LESSON_GRAMMAR_NEW: '/lessons/:lessonId/grammar/new',
  LESSON_GRAMMAR_EDIT: '/lessons/:lessonId/grammar/:id/edit',
  EXERCISE_NEW: '/lessons/:lessonId/exercises/new',
  EXERCISE_EDIT: '/lessons/:lessonId/exercises/:id/edit',
  EXERCISE_DETAIL: '/exercises/:exerciseId',
  EXERCISE_TYPE: '/exercises/:exerciseId/types/:questionType',
  QUESTION_NEW: '/exercises/:exerciseId/questions/new',
  QUESTION_EDIT: '/exercises/:exerciseId/questions/:id/edit',
  // Hội thoại mô phỏng
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
  // Cài đặt
  SETTINGS: '/settings',
} as const;
