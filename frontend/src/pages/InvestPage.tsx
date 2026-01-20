import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import logo from '../img/logo.png'

/* =====================
   OFFRE (future Admin)
===================== */
const INVEST_OFFER = {
  id: 1,
  title: 'Plan Rendement Stable',
  price: 10000,
  description: `
Avec cet investissement, vous bénéficiez d’un rendement de
+5% toutes les 24 heures pendant une durée totale de 180 jours.

Les gains sont crédités automatiquement.
Vous pouvez réinvestir ou retirer vos bénéfices à tout moment
après validation de l’investissement.
`,
  durationDays: 180,
}

// durée de disponibilité (exemple : 7 jours)
const OFFER_END_DATE = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
)

export default function InvestPage() {
  const notify = useNotify()

  const [wallet, setWallet] = useState<any>(null)
  const [selected, setSelected] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  /* =====================
     FETCH WALLET
  ===================== */
  useEffect(() => {
    let mounted = true
    import('../services/Investments').then(({ fetchWallets }) => {
      fetchWallets()
        .then((data: any) => {
          if (!mounted) return
          if (Array.isArray(data) && data.length > 0) {
            setWallet(data[0])
          }
        })
        .catch(() => {})
    })
    return () => {
      mounted = false
    }
  }, [])

  /* =====================
     COUNTDOWN
  ===================== */
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = OFFER_END_DATE.getTime() - Date.now()

      if (diff <= 0) {
        setTimeLeft('Offre expirée')
        clearInterval(interval)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)

      setTimeLeft(`${days}j ${hours}h ${minutes}min`)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  /* =====================
     CONFIRM INVEST
  ===================== */
  async function confirmInvestment() {
    if (loading) return
    setLoading(true)

    try {
      const { createInvestment, fetchWallets } =
        await import('../services/Investments')

      await createInvestment(INVEST_OFFER.price)

      const data = await fetchWallets()
      if (Array.isArray(data) && data.length > 0) {
        setWallet(data[0])
      }

      notify.success('🎉 Investissement approuvé avec succès')
      setSelected(false)
    } catch (e: any) {
      notify.error(
        e?.response?.data?.message ||
          'Erreur lors de l’investissement'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 pb-24">

      {/* HEADER */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-800 p-1" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">Invest</h1>
          </div>
          <HeaderActions />
        </div>

        {/* WALLET INFO */}
        {wallet && (
          <p className="text-sm md:text-base text-gray-600 mb-4">
            Solde disponible :{' '}
            <strong>
              {Number(wallet.available).toLocaleString()}{' '}
              {wallet.currency}
            </strong>
            <br />
            Solde investi :{' '}
            <strong>
              {Number(wallet.invested).toLocaleString()}{' '}
              {wallet.currency}
            </strong>
          </p>
        )}

        {/* CARD COMPACTE */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-800 text-base md:text-lg">
              {INVEST_OFFER.title}
            </p>
            <p className="text-sm md:text-base text-gray-500">
              ⏳ {INVEST_OFFER.durationDays} jours
            </p>

            <button
              onClick={() => setShowDetails(true)}
              className="text-xs md:text-sm text-violet-600 mt-1 hover:underline"
            >
              Détails
            </button>
          </div>

          <div className="text-right w-full sm:w-auto">
            <p className="text-lg md:text-xl font-bold text-gray-800">
              {INVEST_OFFER.price.toLocaleString()}{' '}
              {wallet?.currency || 'USDT'}
            </p>

            <button
              onClick={() => setSelected(true)}
              className="mt-2 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-sm md:text-base font-medium
                bg-violet-500 text-white hover:bg-violet-600"
            >
              J’investis
            </button>
           
          </div>
         
        </div>
         {/* COUNTDOWN */}
        <p className="text-center text-sm md:text-base text-red-600 font-medium mt-3">
          ⏰ Offre disponible : {timeLeft}
        </p>
      </div>

      {/* MODAL DETAILS */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md lg:max-w-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg md:text-xl">
                {INVEST_OFFER.title}
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-xl md:text-2xl">✕</button>
            </div>

            <p className="text-sm md:text-base text-gray-600 whitespace-pre-line mb-4">
              {INVEST_OFFER.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm md:text-base mb-4">
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                📈 <br />
                <b>+5% / 24h</b>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                ⏳ <br />
                <b>{INVEST_OFFER.durationDays} jours</b>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetails(false)
                setSelected(true)
              }}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 text-base md:text-lg"
            >
              Investir maintenant
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md">
            <h3 className="font-semibold text-lg md:text-xl mb-3">
              Confirmation d’investissement
            </h3>

            <p className="text-sm md:text-base text-gray-600 mb-4">
              Vous êtes sur le point d’investir{' '}
              <b>
                {INVEST_OFFER.price.toLocaleString()}{' '}
                {wallet?.currency || 'USDT'}
              </b>
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setSelected(false)}
                className="px-4 py-2 rounded border text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                onClick={confirmInvestment}
                disabled={loading}
                className={`px-4 py-2 rounded text-white text-sm md:text-base
                  ${
                    loading
                      ? 'bg-violet-300'
                      : 'bg-violet-600 hover:bg-violet-700'
                  }
                `}
              >
                {loading ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
