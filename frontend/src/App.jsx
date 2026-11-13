import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProgressProvider } from './context/ProgressContext'
import { ToastProvider } from './context/ToastContext'
import AppShell from './components/AppShell'
import { FullPageLoader } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdventureMap = lazy(() => import('./pages/AdventureMap'))
const Lesson = lazy(() => import('./pages/Lesson'))
const Laboratory = lazy(() => import('./pages/Laboratory'))
const Training = lazy(() => import('./pages/Training'))
const Playground = lazy(() => import('./pages/Playground'))
const GamePage = lazy(() => import('./pages/GamePage'))
const FinalChallenge = lazy(() => import('./pages/FinalChallenge'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Profile = lazy(() => import('./pages/Profile'))
const History = lazy(() => import('./pages/History'))
const TeacherStudents = lazy(() => import('./pages/TeacherStudents'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RequireAuth({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!session || !profile) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />
  return children
}

function RequireTeacher({ children }) {
  const { profile } = useAuth()
  if (profile?.role !== 'teacher') return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/masuk" element={<Login />} />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <ProgressProvider>
                      <AppShell />
                    </ProgressProvider>
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="peta" element={<AdventureMap />} />
                <Route path="materi/:slug" element={<Lesson />} />
                <Route path="lab" element={<Laboratory />} />
                <Route path="latihan" element={<Training />} />
                <Route path="playground" element={<Playground />} />
                <Route path="playground/:slug" element={<GamePage />} />
                <Route path="evaluasi" element={<FinalChallenge />} />
                <Route path="pencapaian" element={<Achievements />} />
                <Route path="profil" element={<Profile />} />
                <Route path="riwayat" element={<History />} />
                <Route
                  path="guru"
                  element={
                    <RequireTeacher>
                      <TeacherStudents />
                    </RequireTeacher>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
