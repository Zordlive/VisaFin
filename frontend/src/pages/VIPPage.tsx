import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import logo from '../img/Logo à jour.png'

export default function VIPPage() {
  const notify = useNotify()

  const [vipLevels, setVipLevels] = useState<any[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([])
  const [selectedLevel, setSelectedLevel] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { fetchVIPLevels, fetchUserVIPSubscriptions } = await import('../services/vip')
      
      const levels = await fetchVIPLevels()
      setVipLevels(Array.isArray(levels) ? levels : [])

      const subscriptions = await fetchUserVIPSubscriptions()
      setUserSubscriptions(Array.isArray(subscriptions) ? subscriptions : [])
    } catch (e) {
      console.error('Error loading VIP data:', e)
      notify.error('Erreur lors du chargement des niveaux VIP')
    } finally {
      setPageLoading(false)
    }
  }

  function canPurchaseLevel(level: any): boolean {
    const purchasedLevels = userSubscriptions.map((s: any) => s.vip_level?.level).filter(Boolean)
    if (purchasedLevels.includes(level.level)) return false
    if (level.level === 1) return true
    return purchasedLevels.includes(level.level - 1)
  }

  function isPurchased(level: any): boolean {
    return userSubscriptions.some((s: any) => s.vip_level?.level === level.level)
  }

  function isClosed(level: any): boolean {
    return userSubscriptions.some((s: any) => s.vip_level?.level === level.level && s.active === false)
  }

  function isActive(level: any): boolean {
    return userSubscriptions.some((s: any) => s.vip_level?.level === level.level && s.active === true)
  }

  async function handlePurchase(level: any) {
    if (loading) return
    setLoading(true)

    try {
      const { purchaseVIPLevel } = await import('../services/vip')
      
      await purchaseVIPLevel(level.id)
      
      notify.success(`🎉 Niveau ${level.level} acheté avec succès`)
      setShowModal(false)
      
      // Dispatch wallet refresh event to update balances across all pages
      window.dispatchEvent(new CustomEvent('wallets:refresh'))
      
      await loadData()
    } catch (e: any) {
      notify.error(
        e?.response?.data?.message ||
          'Erreur lors de l\'achat du niveau'
      )
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center" style={{backgroundColor: '#F4EDDE'}}>
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement des niveaux VIP...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-24" style={{backgroundColor: '#F4EDDE'}}>
      {/* HEADER */}
      <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain" />
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold">Niveaux VIP</h1>
          </div>
          <HeaderActions />
        </div>

        {/* INTRO */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
            Adhérez progressivement aux niveaux VIP pour débloquer des gains quotidiens supplémentaires. 
            Achetez les niveaux dans l'ordre.
          </p>
        </div>

        {/* VIP LEVELS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {vipLevels.map((level) => {
            const purchased = isPurchased(level)
            const active = isActive(level)
            const closed = isClosed(level)
            const canPurchase = canPurchaseLevel(level)

            return (
              <div
                key={level.id}
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm transition hover:shadow-md ${
                  active
                    ? 'bg-green-50 border-2 border-green-500'
                    : closed
                    ? 'bg-gray-50 border-2 border-gray-400'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Badge si acheté */}
                {active && (
                  <div className="inline-block mb-2 sm:mb-3 px-2 sm:px-3 py-1 bg-green-500 text-white text-[10px] sm:text-xs rounded-full font-medium">
                    ✓ Actif
                  </div>
                )}
                {closed && (
                  <div className="inline-block mb-2 sm:mb-3 px-2 sm:px-3 py-1 bg-gray-500 text-white text-[10px] sm:text-xs rounded-full font-medium">
                    ⛔ Fermé
                  </div>
                )}

                <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-gray-800">
                  Niveau {level.level}
                </h3>

                {level.title && (
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                    {level.title}
                  </p>
                )}

                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm md:text-base">
                    <span className="text-gray-600">Prix:</span>
                    <strong className="text-gray-900">{Number(level.price).toLocaleString()} USDT</strong>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm md:text-base">
                    <span className="text-gray-600">Gains/jour:</span>
                    <strong className="text-green-600">{Number(level.daily_gains).toLocaleString()} USDT</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedLevel(level)
                    setShowModal(true)
                  }}
                  className="text-xs sm:text-sm md:text-base text-violet-600 mb-2 sm:mb-3 hover:underline font-medium"
                >
                  Voir détails
                </button>

                <button
                  onClick={() => handlePurchase(level)}
                  disabled={!canPurchase || purchased || loading}
                  className={`w-full py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold text-white transition ${
                    purchased
                      ? 'bg-gray-400 cursor-not-allowed'
                      : canPurchase
                      ? 'bg-violet-600 hover:bg-violet-700 active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {purchased
                    ? active
                      ? 'Actif'
                      : 'Fermé'
                    : canPurchase
                    ? loading ? 'Chargement...' : 'Acheter'
                    : 'Niveau précédent requis'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DETAILS */}
      {showModal && selectedLevel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3 sm:px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-[90%] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800">
                  Niveau {selectedLevel.level}
                </h3>
                {selectedLevel.title && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{selectedLevel.title}</p>
                )}
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none p-1 -mt-1"
              >
                ✕
              </button>
            </div>

            {selectedLevel.description && (
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-5 leading-relaxed">
                {selectedLevel.description}
              </p>
            )}

            <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-violet-200">
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Prix d'achat</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-violet-600">
                  {Number(selectedLevel.price).toLocaleString()} USDT
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Gains quotidiens</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  {Number(selectedLevel.daily_gains).toLocaleString()} USDT
                </div>
              </div>

              {selectedLevel.percentage > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Pourcentage bonus</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                    {selectedLevel.percentage}%
                  </div>
                </div>
              )}

              {selectedLevel.delay_days > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">Délai (jours)</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                    {selectedLevel.delay_days} jour{selectedLevel.delay_days > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                handlePurchase(selectedLevel)
              }}
              disabled={loading || isPurchased(selectedLevel)}
              className={`w-full py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl text-white font-bold text-sm sm:text-base md:text-lg transition active:scale-95 ${
                isPurchased(selectedLevel)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              {loading ? 'Traitement en cours...' : isPurchased(selectedLevel) ? (isActive(selectedLevel) ? 'Actif ✓' : 'Fermé ✓') : `Acheter pour ${Number(selectedLevel.price).toLocaleString()} USDT`}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
