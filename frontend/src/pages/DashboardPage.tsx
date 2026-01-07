import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchMyReferrals } from '../services/referrals'
import('../services/Investments')
import { useNotify } from '../hooks/useNotify'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import api from '../services/api'

export default function DashboardPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<any>(null)
  const notify = useNotify()
  const navigate = useNavigate()

  const { data } = useQuery(['my_referrals'], fetchMyReferrals)

  const code = data?.code?.code
  const stats = data?.stats || {}

  const inviteLink = code
    ? `${window.location.origin}/register?ref=${code}`
    : ''

  useEffect(() => {
    let mounted = true
    import('../services/Investments').then(({ fetchWallets }) => {
      fetchWallets().then((data: any) => {
        if (!mounted) return
        if (Array.isArray(data) && data.length > 0) setWallet(data[0])
      }).catch(() => {})
      // fetch user's investments as well
      api.get('/investments').then((res: any) => {
        if (!mounted) return
        // API returns list of investments
        setInvestments(res.data || [])
      }).catch(() => {})
    })
    return () => { mounted = false }
  }, [])

  /* ================= STATES ================= */
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [showVipModal, setShowVipModal] = useState(false)
  const [investments, setInvestments] = useState<any[]>([])

  const [loadingComplete, setLoadingComplete] = useState(false)

  /* ================= ACTIONS ================= */
  async function onCopy() {
    if (!inviteLink) {
      notify.error('Aucun code disponible')
      return
    }
    await navigator.clipboard.writeText(inviteLink)
    notify.success('Code copié')
  }

  async function onShare() {
    if (!inviteLink) {
      notify.error('Aucun code disponible')
      return
    }

    if (navigator.share) {
      await navigator.share({
        title: 'Invitation',
        text: 'Rejoins-moi avec ce lien',
        url: inviteLink,
      })
    } else {
      await navigator.clipboard.writeText(inviteLink)
      notify.success('Lien copié pour partage')
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full" />
          <span className="font-semibold">Logo</span>
        </div>
        <h1 className="font-semibold text-lg">Profil</h1>
        <HeaderActions />
      </div>

      {/* PROFIL */}
      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">👤</div>
          <div className="flex-1">
            <div className="font-semibold">{user?.first_name || user?.username}</div>
            <div className="text-sm text-gray-500">{user?.phone ?? '+243 *********'} </div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div>
                Total investi: <strong>{Number(user?.total_invested || 0).toLocaleString()} {wallet?.currency || 'USDT'}</strong>
              </div>
              {wallet && (
                <div>Solde investi: <strong>{Number(wallet.invested || 0).toLocaleString()} {wallet.currency}</strong></div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowVipModal(true)}
            className="px-3 py-1 text-xs rounded-full bg-purple-600 text-white"
          >
            Niveau {user?.vip_level ?? 1}
          </button>
        </div>
      </div>

      {/* COMPLETER INFOS */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-yellow-800 font-medium">
            Veuillez compléter les informations de votre compte
          </p>
          <button
            onClick={() => setShowCompleteModal(true)}
            className="px-4 py-1.5 text-sm rounded-lg bg-yellow-500 text-white"
          >
            Complétez
          </button>
        </div>
      </div>

      {/* MES INVESTISSEMENTS */}
      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Mes Investissements</h2>
          <button
            onClick={() => setShowInvestModal(true)}
            className="text-sm text-purple-600 hover:underline"
          >
            Voir →
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Consultez les investissements auxquels vous avez adhéré.
        </p>
      </div>

      {/* CODE PARRAINAGE */}
      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <div className="text-sm text-gray-500 mb-2">Code Parrainage</div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">{code ?? '—'}</span>
          <div className="flex gap-2">
            <button onClick={onCopy} className="px-3 py-1 border rounded-lg text-sm">Copier</button>
            <button onClick={onShare} className="px-3 py-1 border rounded-lg text-sm">Partager</button>
          </div>
        </div>
      </div>

      {/* MON EQUIPE */}
      <div className="bg-white rounded-2xl p-5 shadow mb-6">
        <h2 className="font-semibold mb-3">Mon équipe</h2>
          <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Niveau 7</span><span>{stats.vip7 ?? 0}</span></div>
          <div className="flex justify-between"><span>Niveau 5</span><span>{stats.vip5 ?? 0}</span></div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* MODAL COMPLETER */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-3">
            <h2 className="font-semibold text-lg">Compléter les informations</h2>

            <select className="w-full border rounded-lg p-2">
              <option>Votre banque</option>
              <option>Orange Money</option>
              <option>M-Pesa</option>
              <option>Airtel Money</option>
            </select>

            <input className="w-full border rounded-lg p-2" placeholder="Numéro de compte" />
            <input className="w-full border rounded-lg p-2" placeholder="Nom enregistré au compte" />

            <div className="bg-yellow-50 text-sm text-yellow-800 p-3 rounded-lg">
              Ces informations sont nécessaires pour vos retraits.
            </div>

            <button
              disabled={loadingComplete}
              onClick={async () => {
                setLoadingComplete(true)
                await new Promise(res => setTimeout(res, 2000))
                setLoadingComplete(false)
                setShowCompleteModal(false)
                notify.success('Informations complétées')
              }}
              className={`w-full py-2 rounded-lg text-white
                ${loadingComplete ? 'bg-yellow-300' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {loadingComplete ? 'Traitement...' : 'Je complète'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL INVESTISSEMENTS */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-lg">Mes investissements</h2>

            {investments.length > 0 ? (
              investments.map((inv: any) => {
                const amt = Number(inv.amount || 0)
                const rate = Number(inv.daily_rate != null ? inv.daily_rate : (user?.vip_level ? 0.025 * Number(user.vip_level) : 0))
                const daily = Math.round((amt * rate) * 100) / 100
                return (
                  <div key={inv.id} className="border p-3 rounded-lg mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{inv.title || 'Investissement'}</div>
                        <div className="text-sm text-gray-500">Investissement sécurisé</div>
                        <div className="text-sm text-yellow-600">★★★★☆</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{new Intl.NumberFormat('fr-FR').format(amt)} {wallet?.currency || 'USDT'}</div>
                        <div className="text-sm text-gray-500">Taux: {(rate * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-700">Gain journalier : <strong>{daily.toLocaleString()} {wallet?.currency || 'USDT'}</strong></div>
                      <div className="text-sm text-green-700">Gains disponibles : <strong>{Number(inv.accrued || 0).toLocaleString()} {wallet?.currency || 'USDT'}</strong></div>
                      <div className="text-xs text-gray-500 mt-1">Les gains sont transférés automatiquement vers le solde principal après 24h.</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="border p-3 rounded-lg">
                <div className="font-semibold">Plan Croissance Or</div>
                <div className="text-sm text-gray-500">Gain journalier : — {wallet?.currency || 'USDT'}</div>
                <button
                  onClick={() => { window.location.href = '/deposits' }}
                  className="mt-2 text-sm text-green-600 underline"
                >
                  J'investis
                </button>
              </div>
            )}

            <button
              onClick={() => setShowInvestModal(false)}
              className="w-full py-2 bg-purple-600 text-white rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Encash removed: transfers happen automatically after 24h */}

      {/* MODAL NIVEAUX */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-3">
            <h2 className="font-semibold text-lg">Niveaux</h2>
            {/* helper: first threshold and doubling each level */}
            {(() => {
              const FIRST = 25000 // must match backend VIP_FIRST_THRESHOLD default
              const fmt = (v: number) => new Intl.NumberFormat('fr-FR').format(v)
              return [...Array(10)].map((_, i) => {
                const level = i + 1
                const amount = FIRST * Math.pow(2, i)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      // navigate to deposits page with prefilled amount
                      try {
                        // close modal then navigate
                        // use window.location to preserve simple behavior
                        window.location.href = `/deposits?amount=${amount}`
                      } catch (e) {
                        // fallback
                        window.location.href = `/deposits?amount=${amount}`
                      }
                    }}
                    className="w-full text-left flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div className="font-medium">Niveau {level}</div>
                    <div className="text-sm text-gray-600">{fmt(amount)} {wallet?.currency || 'USDT'}</div>
                  </button>
                )
              })
            })()}
            <div className="text-sm text-gray-500">Avantages progressifs</div>
            <button
              onClick={() => setShowVipModal(false)}
              className="w-full py-2 bg-purple-600 text-white rounded-lg"
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
