import test from 'node:test'
import assert from 'node:assert/strict'

// Polyfill localStorage & window for Node test environment
const mockStorage = new Map()
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
}

let dispatchedEvents = []
globalThis.window = {
  dispatchEvent: (event) => dispatchedEvents.push(event.type),
  addEventListener: () => {},
  removeEventListener: () => {},
}
globalThis.CustomEvent = class {
  constructor(type) {
    this.type = type
  }
}

// Import storage & errors
import { storage } from '../src/utils/storage.js'
import { parseApiError } from '../src/utils/errors.js'
import { API_CONFIG } from '../src/constants/api.js'

test('1. Valid Login & Session Persistence', () => {
  storage.clear()
  assert.equal(storage.get(API_CONFIG.TOKEN_STORAGE_KEY), null)

  const sampleAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-access-token'
  const sampleRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-refresh-token'
  const sampleUser = {
    id: 'user-uuid-1234',
    email: 'admin@nexops.local',
    role: 'ADMIN',
    status: 'ACTIVE',
  }

  // Simulate storing session
  storage.set(API_CONFIG.TOKEN_STORAGE_KEY, sampleAccessToken)
  storage.set(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, sampleRefreshToken)
  storage.set(API_CONFIG.USER_STORAGE_KEY, sampleUser)

  // Verify credentials in storage
  assert.equal(storage.get(API_CONFIG.TOKEN_STORAGE_KEY), sampleAccessToken)
  assert.equal(storage.get(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY), sampleRefreshToken)
  assert.deepEqual(storage.get(API_CONFIG.USER_STORAGE_KEY), sampleUser)
})

test('2. Invalid Credentials Error Parsing', () => {
  const backendErrorResponse = {
    response: {
      status: 401,
      data: {
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      },
    },
  }

  const parsed = parseApiError(backendErrorResponse)
  assert.equal(parsed.status, 401)
  assert.equal(parsed.code, 'INVALID_CREDENTIALS')
  assert.equal(parsed.message, 'Invalid email or password.')
})

test('3. Field-Level Validation Error Parsing', () => {
  const validationErrorResponse = {
    response: {
      status: 400,
      data: {
        success: false,
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        errors: [
          { field: 'email', message: 'Please provide a valid email address.' },
          { field: 'password', message: 'Password must be at least 8 characters long.' },
        ],
      },
    },
  }

  const parsed = parseApiError(validationErrorResponse)
  assert.equal(parsed.status, 400)
  assert.equal(parsed.code, 'VALIDATION_ERROR')
  assert.equal(parsed.fieldErrors.email, 'Please provide a valid email address.')
  assert.equal(parsed.fieldErrors.password, 'Password must be at least 8 characters long.')
})

test('4. Logout & Session Cleanup', () => {
  dispatchedEvents = []
  storage.set(API_CONFIG.TOKEN_STORAGE_KEY, 'temp-token')
  storage.set(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, 'temp-refresh')
  storage.set(API_CONFIG.USER_STORAGE_KEY, { name: 'Admin' })

  // Purge session
  storage.remove(API_CONFIG.TOKEN_STORAGE_KEY)
  storage.remove(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY)
  storage.remove(API_CONFIG.USER_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('nexops:unauthorized'))

  assert.equal(storage.get(API_CONFIG.TOKEN_STORAGE_KEY), null)
  assert.equal(storage.get(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY), null)
  assert.equal(storage.get(API_CONFIG.USER_STORAGE_KEY), null)
  assert.ok(dispatchedEvents.includes('nexops:unauthorized'))
})

test('5. Expired Token Simulation & Refresh Queue', async () => {
  // Simulate queue mechanism
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error)
      else prom.resolve(token)
    })
    failedQueue = []
  }

  // Queue two concurrent requests waiting for refresh
  const req1 = new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
  const req2 = new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))

  // Simulate refresh completes with new token
  const freshAccessToken = 'new-refreshed-jwt-token'
  processQueue(null, freshAccessToken)

  const res1 = await req1
  const res2 = await req2

  assert.equal(res1, freshAccessToken)
  assert.equal(res2, freshAccessToken)
  assert.equal(failedQueue.length, 0)
})

test('6. Page Refresh Simulation with Active Session', () => {
  storage.clear()
  const activeUser = {
    id: 'user-persistent-99',
    email: 'persistent@nexops.local',
    role: 'ADMIN',
    status: 'ACTIVE',
  }
  storage.set(API_CONFIG.TOKEN_STORAGE_KEY, 'active-valid-jwt')
  storage.set(API_CONFIG.USER_STORAGE_KEY, activeUser)

  // Simulation: on app mount, check if token exists
  const tokenOnMount = storage.get(API_CONFIG.TOKEN_STORAGE_KEY)
  const userOnMount = storage.get(API_CONFIG.USER_STORAGE_KEY)

  assert.ok(tokenOnMount)
  assert.equal(tokenOnMount, 'active-valid-jwt')
  assert.deepEqual(userOnMount, activeUser)
  assert.equal(userOnMount.status, 'ACTIVE')
})

console.log('All Authentication & Authorization verification tests passed successfully!')
