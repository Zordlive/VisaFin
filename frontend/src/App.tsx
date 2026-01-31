import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import WalletsPage from './pages/WalletsPage'
import InvestPage from './pages/InvestPage'
import VIPPage from './pages/VIPPage'
import QuantificationPage from './pages/QuantificationPage'
import MesInvestissementsPage from './pages/MesinvestissementsPage'
import DepositsPage from './pages/DepositsPage'
import WithdrawPage from './pages/WithdrawPage'
import NotFoundPage from './pages/NotFoundPage'
//import Header from './components/HeaderActions'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import { useAuth } from './hooks/useAuth'
import { useLoading } from './contexts/LoadingProvider'
import { useNotificationsSocket } from './hooks/useNotificationsSocket'
import HeaderActions from './components/HeaderActions'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen userName={(user as any)?.first_name} />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  const { isLoading } = useLoading()
  const location = useLocation()
  const [initialLoading, setInitialLoading] = useState(true)
  const [appReady, setAppReady] = useState(false)

  // Initialize notifications socket when user is logged in
  // Always call the hook to avoid violating Rules of Hooks
  useNotificationsSocket(user ? { token: (user as any)?.token } : undefined)

  // Show loader on app startup with minimum display time
  useEffect(() => {
    const minDisplayTime = 1500 // 1.5 seconds minimum
    const startTime = Date.now()

    const checkReady = () => {
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minDisplayTime - elapsed)

      if (!loading && !appReady) {
        // Wait for minimum display time before hiding loader
        setTimeout(() => {
          setInitialLoading(false)
          setAppReady(true)
        }, remainingTime)
      }
    }

    checkReady()
  }, [loading, appReady])

  // Redirect logic after initial loading
  useEffect(() => {
    if (!initialLoading && appReady) {
      // If user is authenticated and on login/register, go to dashboard
      if (user && (location.pathname === '/login' || location.pathname === '/register')) {
        // Dashboard will be shown on next render
      }
    }
  }, [initialLoading, appReady, user, location.pathname])

  // Don't show footer on login and register pages
  const showFooter = !['/login', '/register'].includes(location.pathname)

  // Show loading screen on initial app load (always shows first, even with poor connection)
  if (initialLoading) {
    return <LoadingScreen userName={user ? (user as any)?.first_name : undefined} showGreeting={!!user} />
  }

  // Show loading screen when manually triggered (e.g., during navigation)
  if (isLoading) {
    return <LoadingScreen userName={user ? (user as any)?.first_name : undefined} showGreeting={!!user} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallets"
          element={
            <ProtectedRoute>
              <WalletsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invest"
          element={
            <ProtectedRoute>
              <InvestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vip"
          element={
            <ProtectedRoute>
              <VIPPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quantification"
          element={
            <ProtectedRoute>
              <QuantificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <InvestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <MesInvestissementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deposits"
          element={
            <ProtectedRoute>
              <DepositsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <WithdrawPage />
            </ProtectedRoute>
          }
        />
        {/* Root route - redirect based on auth status */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
