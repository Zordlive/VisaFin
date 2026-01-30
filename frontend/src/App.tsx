import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
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
import { useAuth } from './hooks/useAuth'
import { useNotificationsSocket } from './hooks/useNotificationsSocket'
import HeaderActions from './components/HeaderActions'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const location = useLocation()
  // Initialize notifications socket when user is logged in
  // Always call the hook to avoid violating Rules of Hooks
  useNotificationsSocket(user ? { token: (user as any)?.token } : undefined)

  // Don't show footer on login and register pages
  const showFooter = !['/login', '/register'].includes(location.pathname)

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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
