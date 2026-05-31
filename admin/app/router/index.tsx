import { createBrowserRouter, Navigate } from 'react-router'
import { ROUTES } from '../../lib/shared/constants'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { CoursesPage } from '../pages/learning/CoursesPage'
import { CourseDetailPage } from '../pages/learning/CourseDetailPage'
import { CourseFormPage } from '../pages/learning/CourseFormPage'
import { ModuleDetailPage } from '../pages/learning/ModuleDetailPage'
import { ModuleFormPage } from '../pages/learning/ModuleFormPage'
import { LessonDetailPage } from '../pages/learning/LessonDetailPage'
import { LessonFormPage } from '../pages/learning/LessonFormPage'
import { LessonChildFormPage } from '../pages/learning/LessonChildFormPage'
import { ExerciseSetDetailPage } from '../pages/learning/ExerciseSetDetailPage'
import { ExerciseFormPage } from '../pages/learning/ExerciseFormPage'
import { ScenarioCategoriesPage } from '../pages/simulations/ScenarioCategoriesPage'
import { ScenarioCategoryFormPage } from '../pages/simulations/ScenarioCategoryFormPage'
import { ScenarioCategoryDetailPage } from '../pages/simulations/ScenarioCategoryDetailPage'
import { ScenarioFormPage } from '../pages/simulations/ScenarioFormPage'
import { ScenarioDetailPage } from '../pages/simulations/ScenarioDetailPage'
import { ScenarioCharacterFormPage } from '../pages/simulations/ScenarioCharacterFormPage'
import { LearnersPage } from '../pages/learners/LearnersPage'
import { LearnerDetailPage } from '../pages/learners/LearnerDetailPage'
import { LearnerConversationDetailPage } from '../pages/learners/LearnerConversationDetailPage'
import { LearnerSimulationDetailPage } from '../pages/learners/LearnerSimulationDetailPage'
import { SettingsPage } from '../pages/settings/SettingsPage'

/**
 * Router Configuration
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // Học liệu
      {
        path: ROUTES.COURSES,
        element: <CoursesPage />,
      },
      {
        path: ROUTES.COURSE_NEW,
        element: <CourseFormPage mode="create" />,
      },
      {
        path: ROUTES.COURSE_EDIT,
        element: <CourseFormPage mode="edit" />,
      },
      {
        path: ROUTES.COURSE_DETAIL,
        element: <CourseDetailPage />,
      },
      {
        path: ROUTES.MODULE_NEW,
        element: <ModuleFormPage mode="create" />,
      },
      {
        path: ROUTES.MODULE_EDIT,
        element: <ModuleFormPage mode="edit" />,
      },
      {
        path: ROUTES.MODULE_DETAIL,
        element: <ModuleDetailPage />,
      },
      {
        path: ROUTES.LESSON_NEW,
        element: <LessonFormPage mode="create" />,
      },
      {
        path: ROUTES.LESSON_EDIT,
        element: <LessonFormPage mode="edit" />,
      },
      {
        path: ROUTES.LESSON_DETAIL,
        element: <LessonDetailPage />,
      },
      {
        path: ROUTES.CONTENT_NEW,
        element: <LessonChildFormPage kind="contents" mode="create" />,
      },
      {
        path: ROUTES.CONTENT_EDIT,
        element: <LessonChildFormPage kind="contents" mode="edit" />,
      },
      {
        path: ROUTES.VOCABULARY_NEW,
        element: <LessonChildFormPage kind="vocabularies" mode="create" />,
      },
      {
        path: ROUTES.VOCABULARY_EDIT,
        element: <LessonChildFormPage kind="vocabularies" mode="edit" />,
      },
      {
        path: ROUTES.GRAMMAR_NEW,
        element: <LessonChildFormPage kind="grammar" mode="create" />,
      },
      {
        path: ROUTES.GRAMMAR_EDIT,
        element: <LessonChildFormPage kind="grammar" mode="edit" />,
      },
      {
        path: ROUTES.EXERCISE_SET_NEW,
        element: <LessonChildFormPage kind="exercise-sets" mode="create" />,
      },
      {
        path: ROUTES.EXERCISE_SET_EDIT,
        element: <LessonChildFormPage kind="exercise-sets" mode="edit" />,
      },
      {
        path: ROUTES.EXERCISE_SET_DETAIL,
        element: <ExerciseSetDetailPage />,
      },
      {
        path: ROUTES.EXERCISE_NEW,
        element: <ExerciseFormPage mode="create" />,
      },
      {
        path: ROUTES.EXERCISE_EDIT,
        element: <ExerciseFormPage mode="edit" />,
      },
      // Hội thoại mô phỏng
      {
        path: ROUTES.SCENARIO_CATEGORIES,
        element: <ScenarioCategoriesPage />,
      },
      {
        path: ROUTES.SCENARIO_CATEGORY_NEW,
        element: <ScenarioCategoryFormPage mode="create" />,
      },
      {
        path: ROUTES.SCENARIO_CATEGORY_EDIT,
        element: <ScenarioCategoryFormPage mode="edit" />,
      },
      {
        path: ROUTES.SCENARIO_CATEGORY_DETAIL,
        element: <ScenarioCategoryDetailPage />,
      },
      {
        path: ROUTES.SCENARIO_NEW,
        element: <ScenarioFormPage mode="create" />,
      },
      {
        path: ROUTES.SCENARIO_EDIT,
        element: <ScenarioFormPage mode="edit" />,
      },
      {
        path: ROUTES.SCENARIO_DETAIL,
        element: <ScenarioDetailPage />,
      },
      {
        path: ROUTES.SCENARIO_CHARACTER_NEW,
        element: <ScenarioCharacterFormPage mode="create" />,
      },
      {
        path: ROUTES.SCENARIO_CHARACTER_EDIT,
        element: <ScenarioCharacterFormPage mode="edit" />,
      },
      // Người dùng
      {
        path: ROUTES.LEARNERS,
        element: <LearnersPage />,
      },
      {
        path: ROUTES.LEARNER_DETAIL,
        element: <LearnerDetailPage />,
      },
      {
        path: ROUTES.LEARNER_CONVERSATION_DETAIL,
        element: <LearnerConversationDetailPage />,
      },
      {
        path: ROUTES.LEARNER_SIMULATION_DETAIL,
        element: <LearnerSimulationDetailPage />,
      },
      // Cài đặt
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
])
