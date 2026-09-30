import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout, AuthLayout } from '@/layouts'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RouteLoadingFallback } from '@/components/common/RouteLoadingFallback'
import { ROUTES } from '@/constants/routes'

// Public marketing & auth pages (lazy-loaded)
const LandingPage = lazy(() =>
  import('@/pages/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)

// Protected core workspace pages (lazy-loaded)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const TasksPage = lazy(() =>
  import('@/pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage }))
)
const TaskDetailsPage = lazy(() =>
  import('@/pages/tasks/TaskDetailsPage').then((m) => ({ default: m.TaskDetailsPage }))
)
const OverdueTasksPage = lazy(() =>
  import('@/pages/overdue/OverdueTasksPage').then((m) => ({ default: m.OverdueTasksPage }))
)
const ProjectsPage = lazy(() =>
  import('@/pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
)
const ProjectDetailsPage = lazy(() =>
  import('@/pages/projects/ProjectDetailsPage').then((m) => ({ default: m.ProjectDetailsPage }))
)
const WorkloadPage = lazy(() =>
  import('@/pages/workload/WorkloadPage').then((m) => ({ default: m.WorkloadPage }))
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
)
const NotificationCenterPage = lazy(() =>
  import('@/pages/notifications/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage }))
)
const NotificationPreferencesPage = lazy(() =>
  import('@/pages/notifications/NotificationPreferencesPage').then((m) => ({ default: m.NotificationPreferencesPage }))
)

// Protected admin pages (lazy-loaded)
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage }))
)
const DepartmentsPage = lazy(() =>
  import('@/pages/admin/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage }))
)
const OrganizationsPage = lazy(() =>
  import('@/pages/admin/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

// Standalone security & error pages (lazy-loaded)
const UnauthorizedPage = lazy(() =>
  import('@/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage }))
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

export const router = createBrowserRouter([
  // Public Marketing Landing Page at '/'
  {
    path: ROUTES.HOME,
    element: (
      <Suspense fallback={<RouteLoadingFallback fullPage message="Loading SB Pvt. Ltd...." />}>
        <LandingPage />
      </Suspense>
    ),
  },

  // Public Authentication Routes
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.REGISTER,
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },

  // Protected Enterprise Workspace Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },
          {
            path: ROUTES.TASKS,
            element: <TasksPage />,
          },
          {
            path: ROUTES.TASK_DETAILS(),
            element: <TaskDetailsPage />,
          },
          {
            path: ROUTES.OVERDUE_TASKS,
            element: <OverdueTasksPage />,
          },
          {
            path: ROUTES.PROJECTS,
            element: <ProjectsPage />,
          },
          {
            path: ROUTES.PROJECT_DETAILS(),
            element: <ProjectDetailsPage />,
          },
          {
            path: ROUTES.WORKLOAD,
            element: <WorkloadPage />,
          },
          {
            path: ROUTES.ANALYTICS,
            element: <AnalyticsPage />,
          },
          {
            path: ROUTES.NOTIFICATIONS,
            element: <NotificationCenterPage />,
          },
          {
            path: ROUTES.NOTIFICATION_PREFERENCES,
            element: <NotificationPreferencesPage />,
          },
          {
            path: ROUTES.USERS,
            element: <UsersPage />,
          },
          {
            path: ROUTES.DEPARTMENTS,
            element: <DepartmentsPage />,
          },
          {
            path: ROUTES.ORGANIZATIONS,
            element: <OrganizationsPage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
          },
          {
            path: ROUTES.SHOWCASE,
            element: <Navigate to={ROUTES.DASHBOARD} replace />,
          },
        ],
      },
    ],
  },

  // Security / Forbidden Route
  {
    path: ROUTES.UNAUTHORIZED,
    element: (
      <Suspense fallback={<RouteLoadingFallback fullPage message="Loading..." />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },

  // 404 Fallback
  {
    path: ROUTES.NOT_FOUND,
    element: (
      <Suspense fallback={<RouteLoadingFallback fullPage message="Loading..." />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
