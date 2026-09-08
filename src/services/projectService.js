// ─────────────────────────────────────────────────────────────────────────────
// PROJECT SERVICE
//
// This is the single point of contact between the UI and the data layer.
// Currently uses mock data. To connect the real backend:
//
//   1. Remove the mock import at the top.
//   2. Replace each function body with a real fetch() call.
//   3. Pass the auth token from your auth system (e.g., getToken() from AuthContext).
//
// Expected API endpoints:
//   GET /api/projects?status=ongoing      → array of project summaries
//   GET /api/projects?status=completed    → array of project summaries
//   GET /api/projects/:id                 → single project with full details
// ─────────────────────────────────────────────────────────────────────────────

import { MOCK_PROJECTS } from './mock/mockProjects.js'

// Simulates network latency so loading states are visible during development.
const MOCK_DELAY_MS = 800

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch projects for the current user filtered by status.
 *
 * @param {'ongoing'|'completed'} status
 * @returns {Promise<Array>}
 */
export async function getProjects(status) {
  // ── MOCK IMPLEMENTATION ──────────────────────────────────────────────────
  // Replace the lines below with:
  //
  //   const res = await fetch(`/api/projects?status=${status}`, {
  //     headers: { Authorization: `Bearer ${getToken()}` },
  //   })
  //   if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`)
  //   return res.json()
  // ─────────────────────────────────────────────────────────────────────────
  await delay(MOCK_DELAY_MS)
  return MOCK_PROJECTS.filter((p) => p.status === status)
}

/**
 * Fetch a single project by ID (used when lazy-loading full details).
 *
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function getProjectById(projectId) {
  // ── MOCK IMPLEMENTATION ──────────────────────────────────────────────────
  // Replace with:
  //
  //   const res = await fetch(`/api/projects/${projectId}`, {
  //     headers: { Authorization: `Bearer ${getToken()}` },
  //   })
  //   if (!res.ok) throw new Error(`Project not found: ${projectId}`)
  //   return res.json()
  // ─────────────────────────────────────────────────────────────────────────
  await delay(MOCK_DELAY_MS)
  const project = MOCK_PROJECTS.find((p) => p.id === projectId)
  if (!project) throw new Error(`Project not found: ${projectId}`)
  return project
}
