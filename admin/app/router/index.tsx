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
import { LessonSectionPage } from '../pages/learning/LessonSectionPage'
import { LessonStageContentPage } from '../pages/learning/LessonStageContentPage'
import { LessonStageExercisesPage } from '../pages/learning/LessonStageExercisesPage'
import { MaterialTypePage } from '../pages/learning/MaterialTypePage'
import { MaterialFormPage } from '../pages/learning/MaterialFormPage'
import { VocabularyFormPage } from '../pages/learning/VocabularyFormPage'
import { GrammarFormPage } from '../pages/learning/GrammarFormPage'
import { ExerciseFormPage } from '../pages/learning/ExerciseFormPage'
import { ExerciseDetailPage } from '../pages/learning/ExerciseDetailPage'
import { ExerciseTypePage } from '../pages/learning/ExerciseTypePage'
import { QuestionFormPage } from '../pages/learning/QuestionFormPage'
import { ScenarioCategoriesPage } from '../pages/simulations/ScenarioCategoriesPage'
import { ScenarioCategoryFormPage } from '../pages/simulations/ScenarioCategoryFormPage'
import { ScenarioCategoryDetailPage } from '../pages/simulations/ScenarioCategoryDetailPage'
import { ScenarioFormPage } from '../pages/simulations/ScenarioFormPage'
import { ScenarioDetailPage } from '../pages/simulations/ScenarioDetailPage'
import { ScenarioCharacterFormPage } from '../pages/simulations/ScenarioCharacterFormPage'
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
        path: ROUTES.LESSON_STAGE_CONTENT,
        element: <LessonStageContentPage />,
      },
      {
        path: ROUTES.LESSON_STAGE_EXERCISES,
        element: <LessonStageExercisesPage />,
      },
      {
        path: ROUTES.LESSON_SECTION,
        element: <LessonSectionPage />,
      },
      {
        path: ROUTES.LESSON_MATERIAL_TYPE,
        element: <MaterialTypePage />,
      },
      {
        path: ROUTES.LESSON_MATERIAL_NEW,
        element: <MaterialFormPage mode="create" />,
      },
      {
        path: ROUTES.LESSON_MATERIAL_EDIT,
        element: <MaterialFormPage mode="edit" />,
      },
      {
        path: ROUTES.LESSON_VOCAB_NEW,
        element: <VocabularyFormPage mode="create" />,
      },
      {
        path: ROUTES.LESSON_VOCAB_EDIT,
        element: <VocabularyFormPage mode="edit" />,
      },
      {
        path: ROUTES.LESSON_GRAMMAR_NEW,
        element: <GrammarFormPage mode="create" />,
      },
      {
        path: ROUTES.LESSON_GRAMMAR_EDIT,
        element: <GrammarFormPage mode="edit" />,
      },
      {
        path: ROUTES.EXERCISE_NEW,
        element: <ExerciseFormPage mode="create" />,
      },
      {
        path: ROUTES.EXERCISE_EDIT,
        element: <ExerciseFormPage mode="edit" />,
      },
      {
        path: ROUTES.EXERCISE_DETAIL,
        element: <ExerciseDetailPage />,
      },
      {
        path: ROUTES.EXERCISE_TYPE,
        element: <ExerciseTypePage />,
      },
      {
        path: ROUTES.QUESTION_NEW,
        element: <QuestionFormPage mode="create" />,
      },
      {
        path: ROUTES.QUESTION_EDIT,
        element: <QuestionFormPage mode="edit" />,
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
