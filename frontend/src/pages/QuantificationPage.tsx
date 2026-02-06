import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import api from '../services/api'
import { Link } from 'react-router-dom'
import logo from '../img/Logo à jour.png'

export default function QuantificationPage() {
  const notify = useNotify()
  const quantificationEnabled = true

  const [gains, setGains] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [claimingGains, setClaimingGains] = useState(false)
  const [canClaim, setCanClaim] = useState(true)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>('')
  const [pageLoading, setPageLoading] = useState(true)

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && loading) {
      // Finished countdown, now show modal
      loadGains()
      setLoading(false)
      setShowModal(true)
    }
  }, [countdown, loading])

  // Check if user can claim gains
  useEffect(() => {
    if (!quantificationEnabled) {
      setCanClaim(false)
      setTimeUntilNextClaim('Indisponible')
      setPageLoading(false)
      return
    }
    loadGains()
    checkClaimAvailability()
    setPageLoading(false)
    // Update timer every second
    const timer = setInterval(() => {
      checkClaimAvailability()
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function checkClaimAvailability() {
    try {
      const lastClaimedStr = localStorage.getItem('lastClaimedAt')
      if (!lastClaimedStr) {
        setCanClaim(true)
        setTimeUntilNextClaim('')
        return
      }

      const lastClaimed = new Date(lastClaimedStr).getTime()
      const now = new Date().getTime()
      const diffMs = now - lastClaimed
      const twentyFourHoursMs = 24 * 60 * 60 * 1000

      if (diffMs >= twentyFourHoursMs) {
        setCanClaim(true)
        setTimeUntilNextClaim('')
      } else {
        setCanClaim(false)
        const remainingMs = twentyFourHoursMs - diffMs
        const hours = Math.floor(remainingMs / (60 * 60 * 1000))
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000)
        setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`)
      }
    } catch (e) {
      console.error('Error checking claim availability:', e)
    }
  }

  async function handleClaimClick() {
    if (!quantificationEnabled) {
      notify.error('La quantification n’est pas disponible sur ce backend.')
      return
    }
    if (countdown > 0 || !canClaim) return // Already counting or cannot claim
    
    setLoading(true)
    setCountdown(10) // Start 10 second countdown
  }

  async function loadGains() {
    try {
      const { data } = await api.get('/quantification/gains')
      setGains(data)
    } catch (e: any) {
      console.error('Error loading gains:', e)
      notify.error('Erreur lors du chargement des gains')
    }
  }

  async function handleEncash() {
    if (!quantificationEnabled) {
      notify.error('La quantification n’est pas disponible sur ce backend.')
      return
    }
    if (claimingGains) return
    setClaimingGains(true)

    try {
      const { data: result } = await api.post('/quantification/claim')

      // Save the current time to localStorage
      localStorage.setItem('lastClaimedAt', new Date().toISOString())
      
      notify.success(`✅ ${Number(result.amount).toLocaleString()} USDT encaissés`)
      setShowModal(false)
      setGains(result)
      checkClaimAvailability()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wallets:refresh'))
      }
    } catch (e: any) {
      notify.error(
        e?.response?.data?.message ||
          'Erreur lors de l\'encaissement'
      )
    } finally {
      setClaimingGains(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center px-3 sm:px-4" style={{backgroundColor: '#F4EDDE'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-b-2 border-violet-600 mx-auto mb-4 sm:mb-5"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement de vos gains...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-28" style={{backgroundColor: '#F4EDDE'}}>
      {/* HEADER */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="sticky top-0 z-40 mb-5 sm:mb-6">
          <div className="bg-[#F4EDDE]/90 backdrop-blur-md border-b border-white/60 rounded-2xl">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3">
              <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
                <img src={logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain flex-shrink-0" />
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 truncate">Quantification</h1>
              </Link>
              <HeaderActions />
            </div>
          </div>
        </div>

        {/* MAIN SECTION */}
        <div className="space-y-4 sm:space-y-6">
          {/* INFO CARD */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4">
              Réclame tes gains quotidiens de tes niveaux VIP et de tes investissements.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              ⏱️ Clic sur le bouton pour initialiser le chargement (10 secondes)
            </p>
          </div>

          {/* MAIN BUTTON */}
          <div className="flex justify-center px-2 sm:px-0">
            <div className="w-full sm:w-96">
              <button
                onClick={handleClaimClick}
                disabled={countdown > 0 || loading || !canClaim}
                className={`relative w-full py-5 sm:py-6 md:py-8 rounded-xl sm:rounded-2xl text-white font-bold text-base sm:text-lg md:text-2xl transition ${
                  !canClaim
                    ? 'bg-gray-400 cursor-not-allowed'
                    : countdown > 0 || loading
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                }`}
              >
                {countdown > 0 ? (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{countdown}</div>
                    <div className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">Chargement en cours...</div>
                  </div>
                ) : !canClaim ? (
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base">Prochaine réclamation</div>
                    <div className="text-base sm:text-lg md:text-xl font-bold mt-1 sm:mt-2">{timeUntilNextClaim}</div>
                  </div>
                ) : (
                  'Réclame tes gains'
                )}
              </button>
              {!canClaim && (
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
                  💡 Vous pouvez réclamer vos gains une fois toutes les 24 heures
                </p>
              )}
            </div>
          </div>

          {/* LOADING BAR */}
          {countdown > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm">
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 md:h-3 overflow-hidden">
                <div
                  className="bg-violet-600 h-full transition-all"
                  style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                />
              </div>
              <p className="text-center text-xs sm:text-sm md:text-base text-gray-600 mt-2 sm:mt-3">
                {10 - countdown}/10 secondes
              </p>
            </div>
          )}

          {/* INFO CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Gains VIP quotidiens</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-violet-600">
                ~{Number(gains?.vip_gains_total || 0).toLocaleString()} USDT
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                À partir de tes niveaux VIP
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Gains investissements quotidiens</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-violet-600">
                ~{Number(gains?.investment_gains?.total || 0).toLocaleString()} USDT
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                À partir de tes investissements
              </p>
            </div>
          </div>

          {/* HELP */}
          <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-200">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 text-blue-900">Comment ça marche?</h3>
            <ul className="text-xs sm:text-sm md:text-base text-blue-800 space-y-1 sm:space-y-2">
              <li>✓ Clique sur "Réclame tes gains" pour initialiser</li>
              <li>✓ Attends 10 secondes pour le chargement</li>
              <li>✓ Clique sur "J'encaisse mes gains" dans la modal</li>
              <li>✓ Tes gains seront ajoutés à ta zone "Gains"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL GAINS */}
      {showModal && gains && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2 sm:px-4 py-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-[95vw] sm:max-w-sm md:max-w-md max-h-[88vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-3 sm:mb-4">Tes gains quotidiens</h3>

            {/* VIP GAINS */}
            {Object.keys(gains.vip_gains || {}).length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-sm sm:text-base md:text-lg mb-2 sm:mb-3 text-violet-600">Gains VIP</h4>
                <div className="space-y-2">
                  {Object.entries(gains.vip_gains).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between bg-gray-50 p-2 sm:p-3 rounded-lg">
                      <span className="text-xs sm:text-sm md:text-base text-gray-700">{key.replace('VIP_Level_', 'Niveau ')}</span>
                      <strong className="text-xs sm:text-sm md:text-base">{Number(value).toLocaleString()} USDT</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INVESTMENT GAINS */}
            {gains.investment_gains?.total > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-sm sm:text-base md:text-lg mb-2 sm:mb-3 text-violet-600">Gains Investissements</h4>
                <div className="flex justify-between bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <span className="text-xs sm:text-sm md:text-base text-gray-700">Investissements actifs</span>
                  <strong className="text-xs sm:text-sm md:text-base">{Number(gains.investment_gains.total).toLocaleString()} USDT</strong>
                </div>
              </div>
            )}

            {/* TOTAL */}
            <div className="border-t pt-3 sm:pt-4 mb-4 sm:mb-6">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm sm:text-base md:text-lg font-semibold">Total à encaisser</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                  {Number(gains.total_gains || 0).toLocaleString()} USDT
                </span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-xs sm:text-sm md:text-base font-medium transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleEncash}
                disabled={claimingGains}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-white text-xs sm:text-sm md:text-base font-medium transition ${
                  claimingGains
                    ? 'bg-green-400'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {claimingGains ? 'Encaissement...' : 'J\'encaisse mes gains'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
