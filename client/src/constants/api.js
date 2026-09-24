/**
 * API Constants & Endpoints Configuration
 */

export const API_CONFIG = {
  BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  TOKEN_STORAGE_KEY: 'access_token',
  REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
  USER_STORAGE_KEY: 'user_profile',
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
  },
  ORGANIZATIONS: {
    BASE: '/organizations',
    BY_ID: (id) => `/organizations/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id) => `/departments/${id}`,
  },
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id) => `/projects/${id}`,
    MEMBERS: (id) => `/projects/${id}/members`,
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id) => `/tasks/${id}`,
    COMMENTS: (id) => `/tasks/${id}/comments`,
    ACTIVITIES: (id) => `/tasks/${id}/activities`,
    ATTACHMENTS: (id) => `/tasks/${id}/attachments`,
    OVERDUE: '/tasks/overdue',
  },
  ANALYTICS: {
    DASHBOARD: '/dashboard',
    TASKS: '/analytics/tasks',
    PROJECTS: '/analytics/projects',
    WORKLOAD: '/workload',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    PREFERENCES: '/notifications/preferences',
  },
  SEARCH: {
    GLOBAL: '/search',
  },
}
