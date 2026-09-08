// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
//
// Single point of contact for all authentication operations.
// Currently delegates to the mock layer. To connect the real backend:
//
//   1. Remove the mock imports.
//   2. Replace each mock* call with the real fetch() shown in the comments.
//   3. Update API_BASE_URL via the VITE_API_URL environment variable.
//
// Expected backend endpoints:
//   POST /api/auth/login    → { user: { id, name, email }, token? }
//   POST /api/auth/signup   → { user: { id, name, email }, token? }
//   POST /api/auth/logout
//   GET  /api/auth/me       → { id, name, email }
// ─────────────────────────────────────────────────────────────────────────────

import {
  mockLogin,
  mockSignup,
  mockLogout,
  mockGetCurrentUser,
} from './mock/mockAuth.js'

// Centralised base URL — set VITE_API_URL in .env to point at the real backend.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Sign the user in and return the user object.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{id: string, name: string, email: string}>}
 */
export async function login(email, password) {
  // ── REAL BACKEND ── Replace mock call with:
  // const res = await fetch(`${API_BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   credentials: 'include',
  //   body: JSON.stringify({ email, password }),
  // })
  // if (!res.ok) {
  //   const err = await res.json().catch(() => ({}))
  //   throw new Error(err.message || 'Invalid email or password.')
  // }
  // const { user } = await res.json()
  // return user
  return mockLogin(email, password)
}

/**
 * Register a new user and return the created user object.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{id: string, name: string, email: string}>}
 */
export async function signup(name, email, password) {
  // ── REAL BACKEND ── Replace mock call with:
  // const res = await fetch(`${API_BASE_URL}/auth/signup`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   credentials: 'include',
  //   body: JSON.stringify({ name, email, password }),
  // })
  // if (!res.ok) {
  //   const err = await res.json().catch(() => ({}))
  //   throw new Error(err.message || 'Could not create account.')
  // }
  // const { user } = await res.json()
  // return user
  return mockSignup(name, email, password)
}

/**
 * Sign the current user out.
 */
export async function logout() {
  // ── REAL BACKEND ── Replace mock call with:
  // await fetch(`${API_BASE_URL}/auth/logout`, {
  //   method: 'POST',
  //   credentials: 'include',
  // })
  return mockLogout()
}

/**
 * Return the currently authenticated user, or null if no session exists.
 * Called once on app startup to restore a persisted session.
 * @returns {Promise<{id: string, name: string, email: string} | null>}
 */
export async function getCurrentUser() {
  // ── REAL BACKEND ── Replace mock call with:
  // const res = await fetch(`${API_BASE_URL}/auth/me`, {
  //   credentials: 'include',
  // })
  // if (!res.ok) return null
  // return res.json()
  return mockGetCurrentUser()
}

const authService = { login, signup, logout, getCurrentUser }
export default authService
