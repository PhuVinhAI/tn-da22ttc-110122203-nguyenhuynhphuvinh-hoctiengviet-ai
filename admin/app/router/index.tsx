import { createBrowserRouter, Navigate } from 'react-router';
import { ROUTES } from '../../lib/shared/constants';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';

/**
 * Router Configuration
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
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
      {
        path: ROUTES.USERS,
        element: <div>Users Page (Coming soon)</div>,
      },
      {
        path: ROUTES.COURSES,
        element: <div>Courses Page (Coming soon)</div>,
      },
      {
        path: ROUTES.VOCABULARIES,
        element: <div>Vocabularies Page (Coming soon)</div>,
      },
      {
        path: ROUTES.EXERCISES,
        element: <div>Exercises Page (Coming soon)</div>,
      },
      {
        path: ROUTES.SETTINGS,
        element: <div>Settings Page (Coming soon)</div>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
