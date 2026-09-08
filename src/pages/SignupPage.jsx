import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import AuthCard from '../components/auth/AuthCard.jsx'
import SignupForm from '../components/auth/SignupForm.jsx'

export default function SignupPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <AuthCard onBack={() => navigate('/')}>
      <SignupForm
        onSuccess={() => navigate('/')}
        onSwitchToLogin={() => navigate('/login')}
      />
    </AuthCard>
  )
}
