import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import logo from '../img/Logo à jour.png'

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
  const calculateDurationDays = (createdAt: string, expiresAt: string | null): number | null => {
    if (!createdAt || !expiresAt) return null
    try {
      const diff = new Date(expiresAt).getTime() - new Date(createdAt).getTime()
      if (diff <= 0) return 0
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    } catch {
      return null
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

      await createInvestment(Number(selectedOffer.price_offered), selectedOffer.id)

      const data = await fetchWallets()
      if (Array.isArray(data) && data.length > 0) {
        setWallet(data[0])
      }

      notify.success('🎉 Investissement approuvé avec succès')
      setSelected(false)
      
      // Dispatch wallet refresh event to update balances across all pages
      window.dispatchEvent(new CustomEvent('wallets:refresh'))
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
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center" style={{backgroundColor: '#F4EDDE'}}>
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement des offres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{backgroundColor: '#F4EDDE'}}>
      {/* HEADER */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => {
              const timeLeft = getTimeLeft(offer.expires_at)
              const durationDays = calculateDurationDays(offer.created_at, offer.expires_at)
              const isSelected = selectedOffer?.id === offer.id

              return (
                <div
                  key={offer.id}
                  className={`group relative rounded-2xl p-4 md:p-5 shadow-sm border transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-violet-400 bg-violet-50/60 shadow-md'
                      : 'border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  onClick={() => setSelectedOffer(offer)}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-violet-50/40 to-transparent"></div>

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                          {offer.status === 'open' ? 'Ouvert' : 'Fermé'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                        {offer.title || 'Offre d\'investissement'}
                      </h3>
                      {offer.description && (
                        <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Prix offert</div>
                      <div className="text-lg md:text-xl font-bold text-violet-700">
                        {Number(offer.price_offered).toLocaleString()} {wallet?.currency || 'USDT'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">{timeLeft}</div>
                    </div>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <span>⏳</span>
                      <span>
                        {durationDays !== null ? `${durationDays} jours` : 'Durée indéfinie'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedOffer(offer)
                          setShowDetails(true)
                        }}
                        className="text-xs md:text-sm text-violet-600 hover:underline"
                      >
                        Détails
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedOffer(offer)
                          setSelected(true)
                        }}
                        className="px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm"
                      >
                        J'investis
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
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
                <b>{calculateDurationDays(selectedOffer.created_at, selectedOffer.expires_at) ?? '—'} jours</b>
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
