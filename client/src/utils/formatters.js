/**
 * Corporate formatting helpers for dates, labels, and roles.
 */

export function formatDate(dateString, options = {}) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
}

export function formatDateTime(dateString) {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRole(role) {
  if (!role) return 'User'
  const mapping = {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
    EMPLOYEE: 'Employee',
    VIEWER: 'Viewer',
    MEMBER: 'Member',
    GUEST: 'Guest',
  }
  return mapping[role] || role.replace(/_/g, ' ')
}

export function formatStatus(status) {
  if (!status) return 'Unknown'
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
