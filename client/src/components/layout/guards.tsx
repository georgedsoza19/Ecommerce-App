import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingBlock } from '../ui/Spinner'

/** Requires a signed-in user; otherwise redirects to /login and remembers where they were going. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingBlock label="Checking your session" className="min-h-[50vh]" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Requires role ADMIN; everyone else is redirected. */
export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingBlock label="Checking your session" className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
