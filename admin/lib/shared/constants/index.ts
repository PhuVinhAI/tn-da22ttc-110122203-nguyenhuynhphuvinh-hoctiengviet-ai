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
  USERS: '/users',
  COURSES: '/courses',
  VOCABULARIES: '/vocabularies',
  EXERCISES: '/exercises',
  SETTINGS: '/settings',
} as const;
