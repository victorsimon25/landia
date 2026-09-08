// ─────────────────────────────────────────────────────────────────────────────
// MOCK AUTH — Remove this file entirely when the real backend is connected.
//
// Simulates authentication without a backend.
// Session is persisted in localStorage so it survives page refreshes during
// development. In production this will be replaced by HTTP-only cookies or
// token-based auth managed by the real backend.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'landia_mock_session'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(email, password) {
  await delay(700)
  if (!email || !email.trim()) throw new Error('Email is required.')
  if (!password) throw new Error('Password is required.')
  if (password.length < 6) throw new Error('Invalid email or password.')
  const user = {
    id: 'usr-001',
    name: 'Demo User',
    email: email.trim().toLowerCase(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function mockSignup(name, email, password) {
  await delay(800)
  if (!name || !name.trim()) throw new Error('Name is required.')
  if (!email || !email.trim()) throw new Error('Email is required.')
  if (!password) throw new Error('Password is required.')
  const user = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function mockLogout() {
  await delay(200)
  localStorage.removeItem(SESSION_KEY)
}

export async function mockGetCurrentUser() {
  await delay(100)
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}
