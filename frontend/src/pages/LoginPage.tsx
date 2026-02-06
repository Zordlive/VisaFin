import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/auth'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../img/Logo à jour.png'

type FormData = {
  identifier: string
  password: string
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>()

  const navigate = useNavigate()
  const { setUser, user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [showError, setShowError] = useState(false)

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const googleOriginHelp = `Google Sign-In bloqué. Ajoute cette origin dans Google Cloud Console → OAuth → Authorized JavaScript origins : ${currentOrigin}`

  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    const initializeGoogle = () => {
      if (!(window as any).google?.accounts?.id) return

      ;(window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleLogin
      })

      const buttonDiv = document.getElementById('google-signin-button')
      if (buttonDiv) {
        buttonDiv.innerHTML = ''
        const containerWidth = buttonDiv.offsetWidth
        const buttonWidth = Math.min(containerWidth, 400)
        ;(window as any).google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: buttonWidth,
          text: 'continue_with',
          locale: 'fr',
          shape: 'pill'
        })
      }

      setGoogleReady(true)
    }

    const timers = [500, 1500, 3000].map((delay) => setTimeout(initializeGoogle, delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  async function handleGoogleLogin(response: any) {
    console.log('Google login response:', response)
    
    if (!response.credential) {
      setErrorMessage('Erreur: pas de credential Google')
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
      return
    }

    setGoogleLoading(true)
    const startTime = Date.now()

    try {
      console.log('Sending token to backend...')
      const res = await authService.loginWithGoogle(response.credential)
      console.log('Backend response:', res)
      
      const elapsed = Date.now() - startTime
      const isSlowConnection = elapsed > 5000
      const minLoadingTime = isSlowConnection ? 15000 : 10000
      const remainingTime = Math.max(0, minLoadingTime - elapsed)

      setTimeout(() => {
        setUser(res.user)
        setGoogleLoading(false)
        navigate('/dashboard')
      }, remainingTime)
    } catch (error: any) {
      console.error('Google login error:', error)
      setGoogleLoading(false)
      const msg = String(error?.message || '')
      if (msg.toLowerCase().includes('origin') && msg.toLowerCase().includes('not allowed')) {
        setErrorMessage(googleOriginHelp)
      } else {
        setErrorMessage(msg || 'Erreur lors de la connexion avec Google')
      }
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    }
  }

  const handleGoogleClick = () => {
    if (googleReady) return
    setErrorMessage('Google Sign-In non disponible. Veuillez recharger la page.')
    setShowError(true)
    setTimeout(() => setShowError(false), 5000)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setShowError(false)
    const startTime = Date.now()

    try {
      const res = await authService.login(data)
      const elapsed = Date.now() - startTime
      
      const isSlowConnection = elapsed > 5000
      const minLoadingTime = isSlowConnection ? 15000 : 10000 // 10s for good, 15s for slow
      const remainingTime = Math.max(0, minLoadingTime - elapsed)

      // Keep loading screen visible for the calculated time
      setTimeout(() => {
        setUser(res.user)
        setLoading(false)
        navigate('/dashboard')
      }, remainingTime)
    } catch (error: any) {
      setLoading(false)
      setErrorMessage(error.message || t('login.failed'))
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    }
  }

  return (
    <>
      {/* Loading Screen Modal */}
      {(loading || googleLoading) && (
        <LoadingScreen isModal={true} userName={(user as any)?.first_name} />
      )}

      {/* Error Notification Toast */}
      {showError && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-start gap-3 max-w-xs sm:max-w-sm">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="flex-shrink-0 text-red-100 hover:text-white ml-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8" style={{backgroundColor: '#F4EDDE'}}>
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-lg">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
            <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain" />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
                {t('login.title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Connectez-vous à votre compte
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Identifier */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('login.identifier')}
              </label>
              <input
                {...register('identifier', {
                  required: "Veuillez saisir votre email ou numéro de téléphone"
                })}
                placeholder="Votre mail ou numéro de téléphone"
                disabled={loading}
                className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base outline-none bg-gray-100
                  ${errors.identifier
                    ? 'ring-2 ring-red-400'
                    : 'focus:ring-2 focus:ring-violet-400'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('login.password')}
              </label>
              <input
                {...register('password', {
                  required: "Le mot de passe est obligatoire",
                  minLength: {
                    value: 8,
                    message: "Le mot de passe doit contenir au moins 8 caractères"
                  }
                })}
                type="password"
                placeholder="••••••••"
                disabled={loading}
                className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base outline-none bg-gray-100
                  ${errors.password
                    ? 'ring-2 ring-red-400'
                    : 'focus:ring-2 focus:ring-violet-400'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 sm:mt-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-xl sm:rounded-full font-medium text-sm sm:text-base transition"
            >
              {loading ? 'Connexion en cours...' : t('login.submit')}
            </button>
          </form>

          {/* Google Sign-In Button */}
          <div className="mt-4 sm:mt-6 w-full px-0">
            <div
              id="google-signin-button"
              className="w-full flex justify-center items-center min-h-[48px]"
              onClick={handleGoogleClick}
            />
            {!googleReady && (
              <p className="mt-2 text-xs text-center text-gray-500">Chargement de Google…</p>
            )}
          </div>

          <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
            Vous n'avez pas de compte ?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-violet-600 hover:underline font-semibold"
            >
              Inscrivez-vous
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

