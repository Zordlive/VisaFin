import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/auth'
import { useAuth } from '../hooks/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../img/Logo à jour.png'

/* -------------------- PAYS -------------------- */
const COUNTRIES = [
  { code: '+244', flag: '🇦🇴' },
  { code: '+242', flag: '🇨🇬' },
  { code: '+226', flag: '🇧🇫' },
  { code: '+234', flag: '🇳🇬' },
  { code: '+228', flag: '🇹🇬' },
  { code: '+243', flag: '🇨🇩' },
  { code: '+225', flag: '🇨🇮' },
  { code: '+223', flag: '🇲🇱' },
  { code: '+251', flag: '🇪🇹' },
  { code: '+212', flag: '🇲🇦' },
  { code: '+221', flag: '🇸🇳' },
  { code: '+233', flag: '🇬🇭' },
  { code: '+237', flag: '🇨🇲' },
  { code: '+241', flag: '🇬🇦' },
  { code: '+229', flag: '🇧🇯' },
  { code: '+20',  flag: '🇪🇬' },
  { code: '+255', flag: '🇹🇿' },
  { code: '+216', flag: '🇹🇳' },
  { code: '+27',  flag: '🇿🇦' }
]

/* -------------------- TYPES -------------------- */
type FormData = {
  name: string
  email?: string
  countryCode: string
  phone: string
  referralCode?: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>()

  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const googleOriginHelp = `Google Sign-In bloqué. Ajoute cette origin dans Google Cloud Console → OAuth → Authorized JavaScript origins : ${currentOrigin}`

  const password = watch('password')

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleRegister,
        })

        const renderGoogleButton = () => {
          const buttonDiv = document.getElementById('google-signup-button')
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
              shape: 'pill',
            })
          }
        }

        renderGoogleButton()

        let resizeTimeout: any
        const handleResize = () => {
          clearTimeout(resizeTimeout)
          resizeTimeout = setTimeout(renderGoogleButton, 300)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
      }
    }

    const timers = [500, 1500, 3000].map((delay) => setTimeout(initializeGoogle, delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  async function handleGoogleRegister(response: any) {
    if (!response?.credential) {
      alert('Erreur: pas de credential Google')
      return
    }

    setGoogleLoading(true)
    setLoading(true)

    try {
      const res = await authService.loginWithGoogle(response.credential)
      setUser(res.user)
      navigate('/dashboard')
    } catch (error: any) {
      const msg = String(error?.message || '')
      if (msg.toLowerCase().includes('origin') && msg.toLowerCase().includes('not allowed')) {
        alert(googleOriginHelp)
      } else {
        alert(msg || 'Erreur lors de la connexion avec Google')
      }
    } finally {
      setGoogleLoading(false)
      setLoading(false)
    }
  }

  // Pré-remplir le code de parrainage depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const refFromUrl = params.get('ref')
    if (refFromUrl) {
      setValue('referralCode', refFromUrl)
    }
  }, [location.search, setValue])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const { confirmPassword, ...rest } = data

      const params = new URLSearchParams(location.search)
      const refFromUrl = params.get('ref')

      // Send referral code with both key names for flexibility
      const payload = {
        ...rest,
        referralCode: rest.referralCode || refFromUrl,
        ref: rest.referralCode || refFromUrl  // Also send as 'ref' for backend compatibility
      }

      const result = await authService.register(payload)
      
      // Show referral bonus if applicable
      if (result.referral_bonus && result.referral_bonus > 0) {
        alert(`✅ Inscription réussie! Le parrain a reçu ${result.referral_bonus} USDT de bonus.`)
      }
      
      setLoading(false)
      // Rediriger vers la page de connexion au lieu de connecter automatiquement
      navigate('/login')
    } catch (error: any) {
      setLoading(false)
      const message = error?.response?.data?.message || t('register.failed')
      alert(`❌ Erreur: ${message}`)
    }
  }

  return (
    <>
      {/* Loading Screen Modal */}
      {loading && <LoadingScreen isModal={true} />}

      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{backgroundColor: '#F4EDDE'}}>
      <div className="w-full max-w-sm sm:max-w-md bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-lg">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8 text-center">
          <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain" />
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
              {t('register.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Créez votre compte en quelques étapes
            </p>
          </div>
        </div>

        {/* Google Sign-Up */}
        <div className="mb-4">
          <div id="google-signup-button" className="w-full" />
          {googleLoading && (
            <p className="mt-2 text-xs text-center text-gray-500">Connexion Google en cours…</p>
          )}
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Nom */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('register.name')}
            </label>
            <input
              {...register('name', { required: 'Le nom est obligatoire' })}
              placeholder="Votre nom complet"
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 outline-none
                ${errors.name ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
              `}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('register.email')}
            </label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Adresse e-mail invalide'
                }
              })}
              placeholder="votre.email@exemple.com"
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 outline-none
                ${errors.email ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
              `}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('register.phone')}
            </label>

            <div className="flex gap-2">
              {/* Select pays réduit */}
              <select
                {...register('countryCode', { required: 'Choisissez un pays' })}
                className={`w-[80px] sm:w-[90px] rounded-xl sm:rounded-full bg-gray-100 px-2 py-3 sm:py-2 text-xs sm:text-sm outline-none text-center
                  ${errors.countryCode ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
                `}
              >
                <option value="">🌍</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {/* Numéro */}
              <input
                {...register('phone', {
                  required: 'Numéro obligatoire',
                  pattern: {
                    value: /^[0-9]{6,15}$/,
                    message: 'Numéro invalide'
                  }
                })}
                placeholder="Numéro de téléphone"
                className={`flex-1 rounded-xl sm:rounded-full bg-gray-100 px-4 py-3 sm:py-4 text-sm sm:text-base outline-none
                  ${errors.phone ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
                `}
              />
            </div>

            {(errors.countryCode || errors.phone) && (
              <p className="mt-1 text-xs text-red-500">
                {errors.countryCode?.message || errors.phone?.message}
              </p>
            )}
          </div>

          {/* Code parrainage */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Code de parrainage (optionnel)
            </label>
            <input
              {...register('referralCode')}
              placeholder="Ex: INV12345 (optionnel)"
              className="w-full rounded-xl sm:rounded-full bg-gray-100 px-4 py-3 sm:py-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('register.password')}
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Mot de passe obligatoire',
                minLength: { value: 8, message: 'Minimum 8 caractères' }
              })}
              placeholder="••••••••"
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 outline-none
                ${errors.password ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
              `}
            />
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirmation requise',
                validate: v => v === password || 'Les mots de passe ne correspondent pas'
              })}
              placeholder="••••••••"
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 outline-none
                ${errors.confirmPassword ? 'ring-2 ring-red-400' : 'focus:ring-2 focus:ring-violet-400'}
              `}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-4 sm:mt-2 bg-violet-500 hover:bg-violet-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-full font-medium text-sm sm:text-base transition"
          >
            {t('register.submit')}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-violet-500 font-medium hover:underline"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
    </>
  )
}
