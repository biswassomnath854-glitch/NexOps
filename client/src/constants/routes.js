/**
 * Application Route Paths
 */

export const ROUTES = {
  // Public Marketing / Home Route
  HOME: '/',

  // Public / Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected / App Routes
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  TASK_DETAILS: (id = ':taskId') => `/tasks/${id}`,
  OVERDUE_TASKS: '/project-health',
  PROJECT_HEALTH: '/project-health',
  PROJECT_HEALTH_DETAILS: (id = ':projectId') => `/projects/${id}/health`,
  PROJECTS: '/projects',
  PROJECT_DETAILS: (id = ':projectId') => `/projects/${id}`,
  WORKLOAD: '/workload',
  ANALYTICS: '/analytics',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_PREFERENCES: '/notifications/preferences',
  USERS: '/users',
  ORGANIZATIONS: '/organizations',
  DEPARTMENTS: '/departments',
  SETTINGS: '/settings',

  // Client Portal Routes
  CLIENT_PORTAL: '/client/projects',
  CLIENT_PROJECTS: '/client/projects',
  CLIENT_PROJECT_DETAILS: (id = ':projectId') => `/client/projects/${id}`,

  // Showcase / Foundation Lab
  SHOWCASE: '/showcase',

  // Security / Error Routes
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
}
