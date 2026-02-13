import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  const [loadingId, setLoadingId] = useState<number|null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showFundsModal, setShowFundsModal] = useState(false)
  const [missingAmount, setMissingAmount] = useState(0)
  const [mainWallet, setMainWallet] = useState<any>(null)
  const [wallets, setWallets] = useState<any[]>([])


  useEffect(() => {
    loadData()
    loadWallets()
  }, [])

  async function loadWallets() {
    try {
      const { fetchWallets } = await import('../services/wallets')
      const data = await fetchWallets()
      let ws = Array.isArray(data?.wallets) ? data.wallets : Array.isArray(data) ? data : []
      setWallets(ws)
      setMainWallet(ws[0] || null)
    } catch (e) {
      setWallets([])
      setMainWallet(null)
    }
  }

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

  // Un niveau est accessible si aucun niveau supérieur n'est actif
  function canPurchaseLevel(level: any): boolean {
    // Si déjà acheté, non achetable
    if (isPurchased(level)) return false
    // Si un niveau supérieur est actif, non achetable
    const activeSub = userSubscriptions.find((s: any) => s.active)
    if (activeSub && activeSub.vip_level?.level > level.level) return false
    return true
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
    if (loadingId !== null) return
    setLoadingId(level.id)

    // Calculer la somme manquante à prélever
    const price = Number(level.price)
    const available = Number(mainWallet?.available || 0)
    const gains = Number(mainWallet?.gains || 0)
    // Trouver le niveau VIP actuel
    const activeSub = userSubscriptions.find((s: any) => s.active)
    const previousPrice = Number(activeSub?.vip_level?.price || 0)
    const missing = price - previousPrice

    if (missing <= 0) {
      notify.error('Aucun paiement requis ou niveau déjà atteint')
      setLoadingId(null)
      return
    }

    if (available >= missing) {
      // Achat direct (prélève la différence)
      try {
        const { purchaseVIPLevel } = await import('../services/vip')
        await purchaseVIPLevel(level.id)
        notify.success(`🎉 Niveau ${level.level} acheté avec succès`)
        setShowModal(false)
        window.dispatchEvent(new CustomEvent('wallets:refresh'))
        await loadData()
        await loadWallets()
      } catch (e: any) {
        notify.error(e?.response?.data?.message || 'Erreur lors de l\'achat du niveau')
      } finally {
        setLoadingId(null)
      }
      return
    }
    // Sinon, proposer transfert gains ou recharge
    const total = available + gains
    if (total >= missing) {
      setMissingAmount(missing - available)
      setShowFundsModal(true)
      setLoadingId(null)
      return
    }
    // Sinon, proposer recharge
    setMissingAmount(missing - total)
    setShowFundsModal(true)
    setLoadingId(null)
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

  // Trouver le contrat VIP actif
  const activeSub = userSubscriptions.find((s: any) => s.active)
  let contractEnd = null
  if (activeSub) {
    const start = new Date(activeSub.purchased_at)
    contractEnd = new Date(start.getTime() + 180 * 24 * 60 * 60 * 1000)
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-24" style={{backgroundColor: '#F4EDDE'}}>
      {/* HEADER */}
      <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="sticky top-0 z-40 mb-4 sm:mb-6">
          <div className="bg-[#F4EDDE]/90 backdrop-blur-md border-b border-white/60 rounded-2xl">
            <div className="flex items-center justify-between px-3 sm:px-4 py-3">
              <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
                <img src={logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain" />
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold">Niveaux VIP</h1>
              </Link>
              <HeaderActions />
            </div>
          </div>
        </div>

        {/* INTRO */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
            Chaque niveau VIP acheté produit des gains pendant <b>180 jours</b> (6 mois).<br/>
            Si vous changez de niveau, le contrat repart à zéro avec le nouveau VIP.<br/>
            Vous pouvez utiliser vos <b>gains</b> pour acheter un niveau VIP.<br/>
            Tous les niveaux sont accessibles selon votre capital.<br/>
            <b>Seuls les niveaux inférieurs à votre niveau actif sont bloqués.</b>
          </p>
          {activeSub && contractEnd && (
            <div className="mt-2 text-xs text-green-700">
              Contrat VIP actif&nbsp;: <b>Niveau {activeSub.vip_level?.level}</b> &mdash; Fin le&nbsp;
              {contractEnd.toLocaleDateString()}
            </div>
          )}
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
                className={`group relative rounded-2xl p-4 sm:p-5 md:p-6 border shadow-sm transition-all duration-300 overflow-hidden ${
                  active
                    ? 'border-green-400 bg-gradient-to-br from-green-50 to-white'
                    : closed
                    ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-white'
                    : 'border-violet-200 bg-gradient-to-br from-white to-violet-50/40'
                } hover:shadow-md hover:-translate-y-1`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12),transparent_40%)]" />

                <div className="relative flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-700 flex items-center justify-center font-bold">
                      {level.level}
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900">
                        Niveau VIP
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500">Accès progressif</p>
                    </div>
                  </div>
                  {active && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500 text-white">
                      ✓ Actif
                    </span>
                  )}
                  {closed && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-500 text-white">
                      ⛔ Fermé
                    </span>
                  )}
                </div>

                {level.title && (
                  <p className="relative text-xs sm:text-sm md:text-base text-gray-600 mb-3 line-clamp-2">
                    {level.title}
                  </p>
                )}

                <div className="relative grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                  <div className="rounded-xl bg-white/80 border border-gray-100 p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs text-gray-500">Prix</div>
                    <div className="font-bold text-sm sm:text-base text-gray-900">
                      {Number(level.price).toLocaleString()} USDT
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-gray-100 p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs text-gray-500">Gains/jour</div>
                    <div className="font-bold text-sm sm:text-base text-green-600">
                      {Number(level.daily_gains).toLocaleString()} USDT
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedLevel(level)
                      setShowModal(true)
                    }}
                    className="text-xs sm:text-sm text-violet-600 hover:underline font-medium"
                  >
                    Voir détails
                  </button>

                  <button
                    onClick={() => handlePurchase(level)}
                    disabled={!canPurchase || purchased || loadingId !== null}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white transition-all active:scale-95 ${
                      purchased
                        ? 'bg-gray-400 cursor-not-allowed'
                        : canPurchase
                        ? 'bg-violet-600 hover:bg-violet-700 shadow-sm'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {purchased
                      ? active
                        ? 'Actif'
                        : 'Fermé'
                      : canPurchase
                      ? loadingId === level.id ? 'Chargement...' : 'Acheter'
                      : 'Niveau bloqué'}
                  </button>
                </div>
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
              disabled={loadingId !== null || isPurchased(selectedLevel)}
              className={`w-full py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl text-white font-bold text-sm sm:text-base md:text-lg transition active:scale-95 ${
                isPurchased(selectedLevel)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              {loadingId === selectedLevel.id ? 'Traitement en cours...' : isPurchased(selectedLevel) ? (isActive(selectedLevel) ? 'Actif ✓' : 'Fermé ✓') : `Acheter pour ${Number(selectedLevel.price).toLocaleString()} USDT`}
            </button>
          </div>
        </div>
      )}

      {/* MODAL FONDS INSUFFISANTS */}
      {showFundsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3 sm:px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-[90%] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-3 text-center">
              <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 mb-2">Fonds insuffisants</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Votre solde principal est insuffisant pour acheter ce niveau VIP.<br/>
                <b>Montant manquant&nbsp;: {missingAmount.toLocaleString()} USDT</b>
              </p>
              <ul className="text-xs sm:text-sm text-gray-600 mb-2 text-left list-disc pl-5">
                <li>Vous pouvez transférer vos gains vers le solde principal depuis la page Wallets.</li>
                <li>Si cela ne suffit pas, rechargez la somme manquante.</li>
              </ul>
              <Link to="/wallets">
                <button className="mt-2 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm">Aller à la page Wallets</button>
              </Link>
            </div>
            <button onClick={() => setShowFundsModal(false)} className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm mt-2">Fermer</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
