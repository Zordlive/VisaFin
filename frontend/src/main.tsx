import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './contexts/AuthProvider'
import { LoadingProvider } from './contexts/LoadingProvider'
import './styles.css'
import './i18n'
import { NotificationsProvider } from './contexts/NotificationsProvider'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient()

// Hide initial HTML loader when React is ready
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader')
  if (loader) {
    loader.classList.add('hidden')
  }
}

// Small delay to ensure smooth transition
setTimeout(hideInitialLoader, 100)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
          </NotificationsProvider>
        </LoadingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
