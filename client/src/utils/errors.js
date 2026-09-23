/**
 * Normalizes and extracts user-friendly error details from backend or network errors.
 * Backend responses follow: { success: false, message: string, code?: string, errors?: Array<{ field: string, message: string }> }
 */

export function parseApiError(error) {
  if (!error) {
    return {
      message: 'An unknown error occurred.',
      code: 'UNKNOWN_ERROR',
      status: 500,
      fieldErrors: {},
    }
  }

  // Axios response error
  if (error.response) {
    const data = error.response.data || {}
    const status = error.response.status

    const message =
      data.message ||
      (status === 401
        ? 'Session expired. Please sign in again.'
        : status === 403
        ? 'You do not have permission to perform this action.'
        : status === 404
        ? 'The requested resource was not found.'
        : status >= 500
        ? 'An internal server error occurred. Please try again later.'
        : 'An error occurred while processing your request.')

    const code = data.code || `HTTP_${status}`

    // Format field-level validation errors into a key-value dictionary { [fieldName]: string }
    const fieldErrors = {}
    if (Array.isArray(data.errors)) {
      data.errors.forEach((item) => {
        if (item.field && item.message) {
          fieldErrors[item.field] = item.message
        }
      })
    }

    return {
      message,
      code,
      status,
      fieldErrors,
      raw: data,
    }
  }

  // Network or timeout errors
  if (error.request) {
    return {
      message: 'Unable to connect to NexOps server. Please check your network connection.',
      code: 'NETWORK_ERROR',
      status: 0,
      fieldErrors: {},
    }
  }

  // JavaScript runtime error
  return {
    message: error.message || 'An unexpected client-side error occurred.',
    code: 'CLIENT_ERROR',
    status: 0,
    fieldErrors: {},
  }
}
