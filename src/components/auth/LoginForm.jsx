import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email)
}

export default function LoginForm({ onSuccess, onSwitchToSignup, message }) {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) return setError('Email is required.')
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.')
    if (!password) return setError('Password is required.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      await auth.login(email.trim(), password)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {message && (
        <div className="mb-5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700 font-medium">{message}</p>
        </div>
      )}
      <h1 className="text-xl font-bold text-slate-900 mb-6">Welcome back</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-colors"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-colors"
          />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-primary-600 font-medium hover:underline"
        >
          Sign Up
        </button>
      </p>
    </div>
  )
}
