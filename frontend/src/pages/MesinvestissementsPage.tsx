import React, { useState, useEffect } from 'react'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import api from '../services/api'
import logo from '../img/logo.png'

type Investment = {
  id: number
  title: string
  amount: number
  daily_rate: number
  last_collected_at: string
  description?: string
}

export default function MesInvestissementsPage() {
  const notify = useNotify()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [selectedOffer, setSelectedOffer] = useState<Investment | null>(null)

  const canHarvest = (date: string) =>
    Date.now() - new Date(date).getTime() >= 24 * 60 * 60 * 1000

  useEffect(() => {
    let mounted = true

    Promise.all([
      api.get('/investments').then(res => {
        if (mounted) setInvestments(res.data || [])
      }),
      import('../services/Investments').then(({ fetchWallets }) => {
        fetchWallets().then((data: any) => {
          if (mounted && Array.isArray(data)) setWallet(data[0])
        })
      })
    ]).then(() => {
      if (mounted) setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    return () => { mounted = false }
  }, [])

  const handleCollectGains = async (investmentId: number) => {
    try {
      await api.post(`/investments/${investmentId}/collect`)
      notify.success('Gains collectés avec succès')
      setInvestments(investments.map(inv => 
        inv.id === investmentId 
          ? { ...inv, last_collected_at: new Date().toISOString() }
          : inv
      ))
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Erreur lors de la collecte')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 pb-24">
      {/* HEADER */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-800 p-1" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">Mes Investissements</h1>
          </div>
          <HeaderActions />
        </div>

        {/* INVESTMENTS LIST */}
        {investments.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm text-center">
            <p className="text-sm md:text-base text-gray-600">Aucun investissement actif pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map(investment => {
              const daily = Math.round(investment.amount * investment.daily_rate)
              const canCollect = canHarvest(investment.last_collected_at)

              return (
                <div key={investment.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">
                        {investment.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mt-1">
                        Montant investi : <strong>{investment.amount.toLocaleString()} {wallet?.currency || 'USDT'}</strong>
                      </p>
                      <p className="text-sm md:text-base text-gray-600">
                        Gain journalier : <strong>{daily.toLocaleString()} {wallet?.currency || 'USDT'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleCollectGains(investment.id)}
                      disabled={!canCollect}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm md:text-base transition ${
                        canCollect
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {canCollect ? 'Collecter les gains' : 'Gains collectés'}
                    </button>
                    <button
                      onClick={() => setSelectedOffer(investment)}
                      className="flex-1 py-2 px-4 rounded-lg border border-violet-600 text-violet-600 font-medium text-sm md:text-base hover:bg-violet-50 transition"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DETAILS */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md lg:max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold">{selectedOffer.title}</h3>
              <button
                onClick={() => setSelectedOffer(null)}
                className="text-2xl font-light text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm md:text-base text-gray-600 mb-4">
              {selectedOffer.description || 'Aucune description disponible.'}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                <div className="text-sm md:text-base">📈</div>
                <b className="text-sm md:text-base">{(selectedOffer.daily_rate * 100).toFixed(1)}% / jour</b>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 text-center">
                <div className="text-sm md:text-base">💰</div>
                <b className="text-sm md:text-base">{selectedOffer.amount.toLocaleString()}</b>
              </div>
            </div>

            <button
              onClick={() => setSelectedOffer(null)}
              className="w-full py-2 md:py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition text-sm md:text-base"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
