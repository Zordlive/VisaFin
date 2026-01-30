import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import logo from '../img/logo.png'

export default function InvestPage() {
  const notify = useNotify()

  const [wallet, setWallet] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [selected, setSelected] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [offersLoading, setOffersLoading] = useState(true)

  /* =====================
     FETCH WALLET & OFFERS
  ===================== */
  useEffect(() => {
    let mounted = true
    import('../services/Investments').then(({ fetchWallets, fetchMarketOffers }) => {
      // Fetch wallet
      fetchWallets()
        .then((data: any) => {
          if (!mounted) return
          if (Array.isArray(data) && data.length > 0) {
            setWallet(data[0])
          }
        })
        .catch(() => {})

      // Fetch market offers
      fetchMarketOffers()
        .then((data: any) => {
          if (!mounted) return
          if (Array.isArray(data)) {
            // Filter open offers and map to compatible format
            const openOffers = data
              .filter((offer: any) => offer.status === 'open')
              .map((offer: any) => ({
                id: offer.id,
                title: offer.title,
                price_offered: offer.price_offered,
                description: offer.description,
                created_at: offer.created_at,
                expires_at: offer.expires_at,
              }))
            setOffers(openOffers)
            if (openOffers.length > 0) {
              setSelectedOffer(openOffers[0])
            }
          }
          setOffersLoading(false)
        })
        .catch(() => {
          setOffersLoading(false)
        })
    })
    return () => {
      mounted = false
    }
  }, [])

  /* =====================
     CALCULATE DURATION DAYS
  ===================== */
  const calculateDurationDays = (createdAt: string): number => {
    // Default to 180 days if not calculable
    if (!createdAt) return 180
    try {
      // Assuming a standard 180 day duration or calculate from created_at
      return 180
    } catch {
      return 180
    }
  }

  /* =====================
     GET TIME LEFT FOR OFFER
  ===================== */
  const getTimeLeft = (expiresAt: string | null): string => {
    if (!expiresAt) return 'Durée indéfinie'
    try {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) return 'Offre expirée'

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)

      return `${days}j ${hours}h ${minutes}min`
    } catch {
      return 'Durée indéfinie'
    }
  }

  /* =====================
     CONFIRM INVEST
  ===================== */
  async function confirmInvestment() {
    if (loading || !selectedOffer) return
    setLoading(true)

    try {
      const { createInvestment, fetchWallets } =
        await import('../services/Investments')

      await createInvestment(Number(selectedOffer.price_offered))

      const data = await fetchWallets()
      if (Array.isArray(data) && data.length > 0) {
        setWallet(data[0])
      }

      notify.success('🎉 Investissement approuvé avec succès')
      setSelected(false)
    } catch (e: any) {
      notify.error(
        e?.response?.data?.message ||
          'Erreur lors de l\'investissement'
      )
    } finally {
      setLoading(false)
    }
  }

  if (offersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 pb-20 sm:pb-24 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement des offres...</p>
        </div>
      </div>
    )
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

        {/* OFFERS LIST */}
        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-gray-600">Aucune offre d'investissement disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedOffer(offer)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-base md:text-lg">
                    {offer.title}
                  </p>
                  <p className="text-sm md:text-base text-gray-500">
                    ⏳ {calculateDurationDays(offer.created_at)} jours
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOffer(offer)
                      setShowDetails(true)
                    }}
                    className="text-xs md:text-sm text-violet-600 mt-1 hover:underline"
                  >
                    Détails
                  </button>
                </div>

                <div className="text-right w-full sm:w-auto">
                  <p className="text-lg md:text-xl font-bold text-gray-800">
                    {Number(offer.price_offered).toLocaleString()}{' '}
                    {wallet?.currency || 'USDT'}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOffer(offer)
                      setSelected(true)
                    }}
                    className="mt-2 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-sm md:text-base font-medium
                      bg-violet-500 text-white hover:bg-violet-600"
                  >
                    J'investis
                  </button>
                </div>
              </div>
            ))}

            {/* COUNTDOWN */}
            {selectedOffer && (
              <p className="text-center text-sm md:text-base text-red-600 font-medium">
                ⏰ Offre disponible : {getTimeLeft(selectedOffer.expires_at)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODAL DETAILS */}
      {showDetails && selectedOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md lg:max-w-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg md:text-xl">
                {selectedOffer.title}
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-xl md:text-2xl">✕</button>
            </div>

            <p className="text-sm md:text-base text-gray-600 whitespace-pre-line mb-4">
              {selectedOffer.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm md:text-base mb-4">
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                💰 <br />
                <b>{Number(selectedOffer.price_offered).toLocaleString()} {wallet?.currency || 'USDT'}</b>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                ⏳ <br />
                <b>{calculateDurationDays(selectedOffer.created_at)} jours</b>
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
      {selected && selectedOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md">
            <h3 className="font-semibold text-lg md:text-xl mb-3">
              Confirmation d'investissement
            </h3>

            <p className="text-sm md:text-base text-gray-600 mb-4">
              Vous êtes sur le point d'investir{' '}
              <b>
                {Number(selectedOffer.price_offered).toLocaleString()}{' '}
                {wallet?.currency || 'USDT'}
              </b>
              {' '}dans <b>{selectedOffer.title}</b>
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
