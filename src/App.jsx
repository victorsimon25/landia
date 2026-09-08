import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout.jsx'
import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import NationalDashboardPage from './pages/NationalDashboardPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import MapPage from './pages/MapPage.jsx'
import LanzerPage from './pages/LanzerPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All main routes use RootLayout: public navbar when logged out, sidebar when logged in */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<NationalDashboardPage />} />
          {/* Protected pages — redirect to /login if not authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/lanzer" element={<LanzerPage />} />
          </Route>
        </Route>

        {/* Auth pages — standalone, no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
