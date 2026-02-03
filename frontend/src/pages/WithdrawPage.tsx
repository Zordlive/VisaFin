import React, { useState } from 'react'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import { useNotify } from '../hooks/useNotify'
import api from '../services/api'
import logo from '../img/Logo à jour.png'

export default function WithdrawPage() {
  const notify = useNotify()
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = bank && account && Number(amount) > 0

  async function handleWithdraw() {
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      await api.post('/withdrawals', {
        amount: Number(amount)
      })
      notify.success('Demande de retrait effectuée avec succès')
      setAccount('')
      setAmount('')
      setBank('')
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.response?.data?.detail || 'Erreur lors du retrait'
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold">Retrait des fonds</h1>
          </div>
          <HeaderActions />
        </div>

      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4 mb-6">
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Banque/Opérateur</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">-- Sélectionner une banque --</option>
              <option value="orange">Orange Monnaie</option>
              <option value="mpesa">M-pesa</option>
              <option value="airtel">Airtel Money</option>
              <option value="afrimoney">Afri-money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Numéro de compte</label>
            <input
              type="tel"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Ex: 097xxxxxxx"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Montant à retirer</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-red-600 text-sm md:text-base font-medium">{error}</p>}

          <button
            onClick={handleWithdraw}
            disabled={!isValid || loading}
            className={`w-full py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition ${
              loading || !isValid
                ? 'bg-red-300 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading ? 'Traitement...' : 'Effectuer le retrait'}
          </button>
        </div>

      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-3 text-gray-800">Notice de retrait</h2>
        <p className="text-sm md:text-base text-gray-600">
          Le retrait peut prendre quelques minutes selon l'opérateur sélectionné. 
          Assurez-vous que votre numéro de compte est correct avant de confirmer.
        </p>
      </div>
      </div>
      <BottomNav />
    </div>
  )
}
