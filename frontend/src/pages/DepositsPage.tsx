import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import api from '../services/api'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import logo from '../img/Logo à jour.png'

// fetch user's wallets to determine default currency
let fetchWallets: any = null
try {
  // dynamic import to avoid circular deps
  fetchWallets = require('../services/Investments').fetchWallets
} catch (e) {
  try {
    // fallback dynamic import
    import('../services/Investments').then(m => { fetchWallets = m.fetchWallets })
  } catch (e) {}
}

export default function DepositsPage() {
  const notify = useNotify()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [amountLocked, setAmountLocked] = useState(false)
  const [currency, setCurrency] = useState<string>('USDT')

  const isValid = Number(amount) > 0 && method

  useEffect(() => {
    // read optional ?amount= from query string to prefill
    try {
      const loc = window.location.search
      const p = new URLSearchParams(loc)
      const a = p.get('amount')
      if (a) setAmount(String(a))
    } catch (e) {}
  }, [])

  useEffect(() => {
    let mounted = true
    if (fetchWallets) {
      try {
        fetchWallets().then((data: any) => {
          if (!mounted) return
          if (Array.isArray(data) && data.length > 0) setCurrency(data[0].currency || 'USDT')
        }).catch(() => {})
      } catch (e) {}
    }
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // if amount was provided via query param, lock the field
    try {
      const loc = window.location.search
      const p = new URLSearchParams(loc)
      const a = p.get('amount')
      if (a) setAmountLocked(true)
    } catch (e) {}
  }, [])

  async function initiate() {
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/deposits/initiate', {
        amount: Number(amount),
        method,
        currency: currency || 'USDT',
      })
      setResult(res.data)
      notify.success('Dépôt initié avec succès')
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || 'Erreur lors du dépôt'
      setError(errorMsg)
      notify.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{backgroundColor: '#F4EDDE'}}>
      {/* HEADER */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <div className="sticky top-0 z-40 mb-6">
          <div className="bg-[#F4EDDE]/90 backdrop-blur-md border-b border-white/60 rounded-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <Link to="/dashboard" className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain" />
                <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">Dépôt des fonds</h1>
              </Link>
              <HeaderActions />
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4 mb-6">
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Montant</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { if (!amountLocked) setAmount(e.target.value) }}
              readOnly={amountLocked}
              placeholder="Entrez le montant"
              className={`w-full border border-gray-300 rounded-xl px-4 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                amountLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Méthode de dépôt</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Sélectionner une méthode --</option>
              <option value="orange">Orange Money</option>
              <option value="mpesa">M-pesa</option>
              <option value="airtel">Airtel Money</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm md:text-base font-medium">{error}</p>}

          <button
            onClick={initiate}
            disabled={!isValid || loading}
            className={`w-full py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition ${
              loading || !isValid
                ? 'bg-green-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? 'Traitement...' : 'Effectuer le dépôt'}
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-800">Instructions de dépôt</h2>
            <pre className="text-xs md:text-sm bg-gray-100 p-3 md:p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
