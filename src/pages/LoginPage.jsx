import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import AuthCard from '../components/auth/AuthCard.jsx'
import LoginForm from '../components/auth/LoginForm.jsx'

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const signinMessage = state?.signinMessage

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <AuthCard onBack={() => navigate('/')}>
      <LoginForm
        message={signinMessage}
        onSuccess={() => navigate(state?.from?.pathname ?? '/')}
        onSwitchToSignup={() => navigate('/signup')}
      />
    </AuthCard>
  )
}
