export const testConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  
  testUser: {
    email: 'test@linvnix.com',
    password: 'Test123456',
    fullName: 'Test User',
    nativeLanguage: 'English',
    currentLevel: 'A1',
  },

  testAdmin: {
    email: 'admin@linvnix.com',
    password: 'Admin123456',
    fullName: 'Admin User',
  },
};

export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    verifyEmail: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    resendVerification: '/auth/resend-verification',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    updateMe: '/users/me',
  },
  courses: {
    list: '/courses',
    detail: (id: string) => `/courses/${id}`,
    create: '/courses',
    update: (id: string) => `/courses/${id}`,
    delete: (id: string) => `/courses/${id}`,
  },
  units: {
    byCourse: (courseId: string) => `/units/course/${courseId}`,
    detail: (id: string) => `/units/${id}`,
  },
  lessons: {
    byUnit: (unitId: string) => `/lessons/unit/${unitId}`,
    detail: (id: string) => `/lessons/${id}`,
  },
  vocabularies: {
    byLesson: (lessonId: string) => `/vocabularies/lesson/${lessonId}`,
    learn: (vocabId: string) => `/vocabularies/${vocabId}/learn`,
    review: (vocabId: string) => `/vocabularies/${vocabId}/review`,
    myVocabularies: '/vocabularies/my-vocabularies',
    dueReview: '/vocabularies/due-review',
  },
  exercises: {
    byLesson: (lessonId: string) => `/exercises/lesson/${lessonId}`,
    detail: (id: string) => `/exercises/${id}`,
    submit: (id: string) => `/exercises/${id}/submit`,
    myResults: '/exercises/my-results',
    myStats: '/exercises/my-stats',
  },
  progress: {
    list: '/progress',
    byLesson: (lessonId: string) => `/progress/lesson/${lessonId}`,
    start: (lessonId: string) => `/progress/lesson/${lessonId}/start`,
    complete: (lessonId: string) => `/progress/lesson/${lessonId}/complete`,
    updateTime: (lessonId: string) => `/progress/lesson/${lessonId}/time`,
  },
  cache: {
    stats: '/cache/stats',
    clear: '/cache/clear',
  },
};
