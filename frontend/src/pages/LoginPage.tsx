import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../services/auth'
import { useAuth } from '../hooks/useAuth'
import logo from '../img/logo.png'

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
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await authService.login(data)
      setUser(res.user)
      navigate('/dashboard')
    } catch {
      alert(t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-lg">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
          <img src={logo} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-800 p-1" />
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
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base outline-none bg-gray-100
                ${errors.identifier
                  ? 'ring-2 ring-red-400'
                  : 'focus:ring-2 focus:ring-violet-400'}
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
              className={`w-full rounded-xl sm:rounded-full px-4 py-3 sm:py-4 text-sm sm:text-base outline-none bg-gray-100
                ${errors.password
                  ? 'ring-2 ring-red-400'
                  : 'focus:ring-2 focus:ring-violet-400'}
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
            {loading ? 'Connexion...' : t('login.submit')}
          </button>
        </form>

        {/* Google */}
        <button
          type="button"
          className="mt-4 sm:mt-6 w-full flex items-center justify-center gap-3 rounded-xl sm:rounded-full border bg-white py-3 sm:py-4 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continuer avec Google
        </button>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          Vous n'avez pas de compte ?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-violet-500 font-medium hover:underline"
          >
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  )
}
