/**
 * Application Route Paths
 */

export const ROUTES = {
  // Public / Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected / App Routes
  DASHBOARD: '/',
  TASKS: '/tasks',
  TASK_DETAILS: (id = ':taskId') => `/tasks/${id}`,
  OVERDUE_TASKS: '/tasks/overdue',
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

  // Showcase / Foundation Lab
  SHOWCASE: '/showcase',

  // Security / Error Routes
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
}
