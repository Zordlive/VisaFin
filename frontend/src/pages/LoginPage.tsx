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

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleLogin,
        })
        console.log('✅ Google Identity Services initialized')
        
        // Render the button with responsive sizing
        const renderGoogleButton = () => {
          const buttonDiv = document.getElementById('google-signin-button')
          if (buttonDiv) {
            // Clear previous button
            buttonDiv.innerHTML = ''
            
            // Calculate responsive width
            const containerWidth = buttonDiv.offsetWidth
            const buttonWidth = Math.min(containerWidth, 400) // Max 400px
            
            ;(window as any).google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              width: buttonWidth,
              text: 'continue_with',
              locale: 'fr',
              shape: 'pill', // Rounded like other buttons
            })
            console.log('✅ Google button rendered with width:', buttonWidth)
          }
        }
        
        // Initial render
        renderGoogleButton()
        
        // Re-render on window resize for responsive behavior
        let resizeTimeout: any
        const handleResize = () => {
          clearTimeout(resizeTimeout)
          resizeTimeout = setTimeout(renderGoogleButton, 300)
        }
        
        window.addEventListener('resize', handleResize)
        
        // Cleanup resize listener
        return () => window.removeEventListener('resize', handleResize)
      } else {
        console.log('⏳ Waiting for Google Identity Services...')
      }
    }

    // Try multiple times with increasing delays
    const timers = [500, 1500, 3000].map((delay) => 
      setTimeout(initializeGoogle, delay)
    )
    
    return () => timers.forEach(clearTimeout)
  }, [])

  async function handleGoogleLogin(response: any) {
    console.log('Google login response:', response)
    
    if (!response.credential) {
      alert('Erreur: pas de credential Google')
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
      alert(error.message || 'Erreur lors de la connexion avec Google')
    }
  }

  const handleGoogleClick = () => {
    console.log('🔘 Google button clicked')
    if ((window as any).google?.accounts?.id) {
      ;(window as any).google.accounts.id.prompt((notification: any) => {
        console.log('Prompt notification:', notification)
        if (notification.isNotDisplayed()) {
          console.log('❌ Prompt not displayed - showing fallback')
          alert('Veuillez configurer votre compte Google. Assurez-vous que localhost:5173 est autorisé dans Google Cloud Console.')
        } else if (notification.isSkippedMoment()) {
          console.log('⏭️ User previously dismissed the prompt')
        }
      })
    } else {
      console.error('❌ Google Identity Services not loaded')
      alert('Google Sign-In non disponible. Veuillez recharger la page.')
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
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
    } catch (error) {
      setLoading(false)
      alert(t('login.failed'))
    }
  }

  return (
    <>
      {/* Loading Screen Modal */}
      {loading && <LoadingScreen isModal={true} userName={(user as any)?.first_name} />}

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

          {/* Google Sign-In Button - Responsive */}
          <div className="mt-4 sm:mt-6 w-full px-0">
            <div 
              id="google-signin-button" 
              className="w-full flex justify-center items-center min-h-[44px] sm:min-h-[48px]"
              style={{ maxWidth: '100%' }}
            ></div>
          </div>

          {/* Footer */}
          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
            Vous n'avez pas de compte ?{' '}
            <button
              onClick={() => navigate('/register')}
              disabled={loading}
              className="text-violet-500 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

