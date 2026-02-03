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

// Intercept unhandled promise rejections (e.g. from browser extensions)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Cannot set properties of null')) {
    console.warn('Ignoring DOM manipulation error from extension:', event.reason)
    event.preventDefault()
  }
})

// Patch console.error to suppress extension-related errors
const originalError = console.error
console.error = function(...args: any[]) {
  const msg = args[0]?.toString?.() || ''
  if (msg.includes('addDevModeBanner') || msg.includes('Cannot set properties of null')) {
    return
  }
  originalError.apply(console, args)
}

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
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
