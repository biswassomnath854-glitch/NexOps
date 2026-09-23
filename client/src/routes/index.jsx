import { createBrowserRouter } from 'react-router-dom'
import { AppLayout, AuthLayout } from '@/layouts'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ComponentShowcasePage } from '@/pages/showcase/ComponentShowcasePage'
import { UsersPage, DepartmentsPage, OrganizationsPage } from '@/pages/admin'
import { ProjectsPage, ProjectDetailsPage } from '@/pages/projects'
import { TasksPage, TaskDetailsPage } from '@/pages/tasks'
import { AnalyticsPage } from '@/pages/analytics'
import { WorkloadPage } from '@/pages/workload'
import { OverdueTasksPage } from '@/pages/overdue'
import { NotificationCenterPage, NotificationPreferencesPage } from '@/pages/notifications'
import { PlaceholderModulePage } from '@/pages/placeholder/PlaceholderModulePage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ROUTES } from '@/constants/routes'

export const router = createBrowserRouter([
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
            element: (
              <PlaceholderModulePage
                title="Workspace Settings"
                description="Enterprise security policies, notification preferences, integration webhooks, and preferences."
                category="Settings Module"
              />
            ),
          },
          {
            path: ROUTES.SHOWCASE,
            element: <ComponentShowcasePage />,
          },
        ],
      },
    ],
  },

  // Security / Forbidden Route
  {
    path: ROUTES.UNAUTHORIZED,
    element: <UnauthorizedPage />,
  },

  // 404 Fallback
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
])
