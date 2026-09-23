/**
 * Safe LocalStorage abstraction for NexOps tokens and user preferences.
 */

const PREFIX = 'nexops_'

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`${PREFIX}${key}`)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`${PREFIX}${key}`)
      return true
    } catch {
      return false
    }
  },

  clear() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch {
      return false
    }
  },
}
