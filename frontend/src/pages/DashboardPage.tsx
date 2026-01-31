import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchMyReferrals } from '../services/referrals'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import api from '../services/api'
import logo from '../img/Logo à jour.png'
import propos1 from '../img/propos 1.jpeg'
import propos2 from '../img/propos 2.jpeg'
import chatIcon from '../img/chat.png'
import aproposIcon from '../img/a-propos.png'
import reseauxIcon from '../img/resaux.png'
import androidIcon from '../img/icons-android.png'
import appleIcon from '../img/icons-Apple.png'
import whatsappIcon from '../img/icons-whatsapp.png'
import telegramIcon from '../img/icons-télégramme.png'
import { fetchBankAccounts, createBankAccount, deleteBankAccount, setDefaultAccount, type BankAccount } from '../services/bankAccounts'
import { fetchOperateurs } from '../services/operateurs'

export default function DashboardPage() {
  const { user } = useAuth()
  const notify = useNotify()

  const [wallet, setWallet] = useState<any>(null)
  const [investments, setInvestments] = useState<any[]>([])
  const [vipSubscriptions, setVipSubscriptions] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [referrals, setReferrals] = useState<any[]>([])
  const [showReferralsModal, setShowReferralsModal] = useState(false)
  const maxVIPLevel = vipSubscriptions.length > 0 
    ? Math.max(...vipSubscriptions.map((s: any) => s.vip_level?.level || 0))
    : 0

  const [showOfferDetails, setShowOfferDetails] = useState<any>(null)
  const [showWhatsappModal, setShowWhatsappModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const [showIOSModal, setShowIOSModal] = useState(false)
  const [showAndroidModal, setShowAndroidModal] = useState(false)

  // Floating buttons modals
  const [showChatModal, setShowChatModal] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)

  // Chat
  const [chatMessage, setChatMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)

  // PROFIL
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [showCompleteAccount, setShowCompleteAccount] = useState(false)

  // COMPTES BANCAIRES
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [showBankList, setShowBankList] = useState(false)
  const [showOperatorList, setShowOperatorList] = useState(false)
  const [accountType, setAccountType] = useState<'bank' | 'operator'>('bank')
  const [selectedBank, setSelectedBank] = useState('')
  const [selectedOperator, setSelectedOperator] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [operateurs, setOperateurs] = useState<any[]>([])
  const [savingAccount, setSavingAccount] = useState(false)

  // Liste des banques disponibles
  const banks = [
    'TRC-20',
    'BEP-20',
    'BNB',
  ]

  const operators = [
    { id: 'Orange', name: 'Orange Money' },
    { id: 'Airtel', name: 'Airtel Money' },
    { id: 'M-Pesa', name: 'Vodacom M-Pesa' },
  ]

  // Edit profile form
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  })
  const [loadingEdit, setLoadingEdit] = useState(false)

  const { data } = useQuery(['my_referrals'], fetchMyReferrals)
  const code = data?.code?.code
  const stats = data?.stats || {}

  const inviteLink = code
    ? `${window.location.origin}/register?ref=${code}`
    : ''

  const totalExpenses = transactions
    .filter((tx: any) => ['withdraw', 'trade', 'transfer'].includes(tx?.type))
    .reduce((sum: number, tx: any) => sum + Number(tx?.amount || 0), 0)

  useEffect(() => {
    let mounted = true

    Promise.all([
      import('../services/Investments').then(({ fetchWallets }) => {
        return fetchWallets().then((data: any) => {
          if (mounted && Array.isArray(data)) setWallet(data[0])
        })
      }),
      api.get('/investments').then(res => {
        if (mounted) setInvestments(res.data || [])
      }),
      api.get('/transactions').then(res => {
        if (mounted) setTransactions(Array.isArray(res.data) ? res.data : [])
      }),
      import('../services/vip').then(({ fetchUserVIPSubscriptions }) => {
        return fetchUserVIPSubscriptions().then((data: any) => {
          if (mounted) setVipSubscriptions(Array.isArray(data) ? data : [])
        }).catch(() => {})
      }),
      api.get('/referrals/me').then(res => {
        if (mounted && res.data) {
          setReferrals(res.data.referrals || [])
        }
      }).catch(() => {})
    ]).finally(() => {
      if (mounted) setPageLoading(false)
    })

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '',
        confirmPassword: ''
      })
    }
  }, [user])

  // Charger les comptes bancaires et opérateurs
  useEffect(() => {
    loadBankAccounts()
    loadOperateurs()
  }, [])

  async function loadBankAccounts() {
    try {
      const accounts = await fetchBankAccounts()
      setBankAccounts(accounts)
    } catch (e) {
      console.error('Error loading bank accounts:', e)
    }
  }

  async function loadOperateurs() {
    try {
      const ops = await fetchOperateurs()
      setOperateurs(Array.isArray(ops) ? ops : [])
    } catch (e) {
      console.error('Error loading operateurs:', e)
    }
  }

  const canHarvest = (date: string) =>
    Date.now() - new Date(date).getTime() >= 24 * 60 * 60 * 1000

  async function onCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    notify.success('Code copié')
  }

  async function onShare() {
    if (!inviteLink) return
    if (navigator.share) {
      await navigator.share({ url: inviteLink })
    } else {
      await navigator.clipboard.writeText(inviteLink)
      notify.success('Lien copié')
    }
  }

  async function handleEditProfile() {
    if (editForm.password !== editForm.confirmPassword) {
      notify.error('Les mots de passe ne correspondent pas')
      return
    }
    setLoadingEdit(true)
    try {
      const updateData: any = {
        first_name: editForm.first_name,
        phone: editForm.phone,
        email: editForm.email
      }
      if (editForm.password) {
        updateData.password = editForm.password
      }
      await api.put('/user', updateData)
      notify.success('Profil mis à jour')
      setEditProfile(false)
      // Optionally refetch user
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoadingEdit(false)
    }
  }

  async function handleSendChat() {
    if (!chatMessage.trim()) return
    setLoadingChat(true)
    try {
      // Assume there's an API for chat, or just notify
      await api.post('/chat', { message: chatMessage })
      notify.success('Message envoyé')
      setChatMessage('')
      setShowChatModal(false)
    } catch (e: any) {
      notify.error('Erreur envoi message')
    } finally {
      setLoadingChat(false)
    }
  }

  async function handleSaveBankAccount() {
    if (!accountNumber.trim() || !accountHolderName.trim()) {
      notify.error('Veuillez remplir tous les champs')
      return
    }

    if (accountType === 'bank' && !selectedBank) {
      notify.error('Veuillez sélectionner une banque')
      return
    }

    if (accountType === 'operator' && !selectedOperator) {
      notify.error('Veuillez sélectionner un opérateur')
      return
    }

    setSavingAccount(true)
    try {
      await createBankAccount({
        account_type: accountType,
        bank_name: accountType === 'bank' ? selectedBank : undefined,
        operator_name: accountType === 'operator' ? selectedOperator : undefined,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        is_default: bankAccounts.length === 0
      })

      notify.success('Compte ajouté avec succès')
      await loadBankAccounts()
      
      // Reset form
      setAccountNumber('')
      setAccountHolderName('')
      setSelectedBank('')
      setSelectedOperator('')
      setAccountType('bank')
      setShowCompleteAccount(false)
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Erreur lors de l\'ajout du compte')
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleDeleteAccount(id: number) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      return
    }

    try {
      await deleteBankAccount(id)
      notify.success('Compte supprimé')
      await loadBankAccounts()
    } catch (e: any) {
      notify.error('Erreur lors de la suppression')
    }
  }

  async function handleSetDefaultAccount(id: number) {
    try {
      await setDefaultAccount(id)
      notify.success('Compte défini comme défaut')
      await loadBankAccounts()
    } catch (e: any) {
      notify.error('Erreur lors de la mise à jour')
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center" style={{backgroundColor: '#F4EDDE'}}>
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-2xl lg:max-w-4xl px-4 md:px-6 lg:px-8 py-6 min-h-screen" style={{backgroundColor: '#F4EDDE'}}>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <img src={logo} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain" />
        <h1 className="font-semibold text-lg md:text-xl lg:text-2xl">Profil</h1>
        <HeaderActions />
      </div>

      {/* PROFIL SECTION - REDESIGNED */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl shadow-xl overflow-hidden mb-6">
        {/* Header avec arrière-plan */}
        <div className="relative h-24 md:h-32 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        </div>

        {/* Contenu principal */}
        <div className="px-4 md:px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6">
            {/* Avatar avec badge VIP */}
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-lg border-4 border-white transform transition-transform group-hover:scale-105">
                👤
              </div>
              {maxVIPLevel > 0 && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-xl px-3 py-1 flex items-center gap-1 text-xs md:text-sm font-bold shadow-lg border-2 border-white animate-pulse">
                  <span>👑</span>
                  <span>VIP {maxVIPLevel}</span>
                </div>
              )}
            </div>

            {/* Informations utilisateur */}
            <div className="flex-1 text-white">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1">
                {user?.first_name || user?.username || 'Utilisateur'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base opacity-90">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>{user?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>{user?.phone || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <div className="text-white/70 text-xs md:text-sm mb-1">Total dépensé</div>
              <div className="text-white text-lg md:text-xl lg:text-2xl font-bold">
                ${Number(totalExpenses).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <div className="text-white/70 text-xs md:text-sm mb-1">Parrainés</div>
              <div className="text-white text-lg md:text-xl lg:text-2xl font-bold">
                {stats?.total_referred ?? 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
              <div className="text-white/70 text-xs md:text-sm mb-1">Niveau VIP</div>
              <div className="text-white text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-1">
                {maxVIPLevel > 0 ? (
                  <>
                    <span>👑</span>
                    <span>{maxVIPLevel}</span>
                  </>
                ) : (
                  <span>0</span>
                )}
              </div>
            </div>
          </div>

          {/* Badges et accomplissements */}
          <div className="flex flex-wrap gap-2 mb-4">
            {maxVIPLevel >= 5 && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 text-yellow-200 px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1">
                <span>⭐</span>
                <span>VIP Elite</span>
              </div>
            )}
            {stats?.total_referred >= 10 && (
              <div className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1">
                <span>🎯</span>
                <span>Recruteur Pro</span>
              </div>
            )}
            {(user?.total_invested ?? 0) >= 1000 && (
              <div className="bg-green-500/20 border border-green-400/30 text-green-200 px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1">
                <span>💎</span>
                <span>Investisseur</span>
              </div>
            )}
            {investments.length > 0 && (
              <div className="bg-purple-500/20 border border-purple-400/30 text-purple-200 px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1">
                <span>📈</span>
                <span>{investments.length} Investissements actifs</span>
              </div>
            )}
          </div>

          {/* Bouton d'action */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full bg-white text-violet-700 hover:bg-gray-50 font-semibold py-3 md:py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <span>⚙️</span>
            <span>Gérer votre profil</span>
          </button>
        </div>
      </div>

      {/* MES INVESTISSEMENTS */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="font-semibold text-lg md:text-xl mb-2 sm:mb-0">Mes gains quotidiens</h2>
          <a
            href="/quantification"
            className="text-sm md:text-base text-purple-600 hover:underline"
          >
            Réclamer →
          </a>
        </div>
      </div>

      {/* CODE PARRAINAGE */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow mb-5">
        <div className="text-sm md:text-base text-gray-500 mb-2">Code Parrainage</div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="font-bold text-lg md:text-xl">{code ?? '—'}</span>
          <div className="flex gap-2">
            <button onClick={onCopy} className="border px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base">Copier</button>
            <button onClick={onShare} className="border px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base">Partager</button>
          </div>
        </div>
      </div>

      {/* MON EQUIPE */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg md:text-xl">Mon équipe</h2>
          {(stats?.total_referred ?? 0) > 0 && (
            <button
              onClick={() => setShowReferralsModal(true)}
              className="text-xs md:text-sm text-violet-600 hover:underline font-medium"
            >
              Voir tous →
            </button>
          )}
        </div>
        <div className="text-sm md:text-base space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-semibold">Total parrainés</span>
            <span className="text-violet-600 font-bold">{stats?.total_referred ?? 0}</span>
          </div>
          
          {stats?.vip_breakdown && Object.keys(stats.vip_breakdown).length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Répartition par niveau VIP</p>
              {Object.entries(stats.vip_breakdown)
                .sort((a, b) => {
                  const levelA = parseInt(a[0].replace('niveau_', ''))
                  const levelB = parseInt(b[0].replace('niveau_', ''))
                  return levelB - levelA
                })
                .map(([level, count]: [string, any]) => {
                  const levelNum = level.replace('niveau_', '')
                  return (
                    <div key={level} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                        {levelNum === '0' ? 'Sans VIP' : `Niveau VIP ${levelNum}`}
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucun filleul pour le moment. Partagez votre code pour commencer !
            </p>
          )}
        </div>
      </div>

      {/* TELECHARGEMENT */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow mb-24">
        <h2 className="font-semibold text-lg md:text-xl mb-3">Téléchargement de l’application</h2>
        <div className="flex flex-row gap-3">
          <button
            onClick={() => setShowAndroidModal(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-center text-base md:text-lg flex items-center justify-center gap-2 transition"
          >
            <img src={androidIcon} alt="Android" className="w-5 h-5" />
            Android
          </button>
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex-1 bg-black text-white py-3 rounded-xl text-base md:text-lg flex items-center justify-center gap-2"
          >
            <img src={appleIcon} alt="Apple" className="w-5 h-5" />
            Apple
          </button>
        </div>
      </div>

      
      {/* ================= MODAL OFFRE ================= */}
      {showOfferDetails && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-sm md:max-w-md">
            <h3 className="font-semibold text-lg md:text-xl mb-3">
              {showOfferDetails.title}
            </h3>
            <p className="text-sm md:text-base text-gray-600 whitespace-pre-line">
              {showOfferDetails.description || 'Aucune description disponible.'}
            </p>
            <button
              onClick={() => setShowOfferDetails(null)}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg text-base md:text-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL PROFIL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md space-y-3">
            <h3 className="font-semibold text-lg md:text-xl">Profil utilisateur</h3>

            <div className="text-sm md:text-base">Nom : {user?.first_name}</div>
            <div className="text-sm md:text-base">Téléphone : {user?.phone}</div>
            <div className="text-sm md:text-base">Email : {user?.email}</div>

            <button
              onClick={() => setEditProfile(true)}
              className="text-purple-600 text-sm md:text-base underline"
            >
              Modifier vos informations
            </button>

            <button
              onClick={() => setShowCompleteAccount(true)}
              className="text-purple-600 text-sm md:text-base underline"
            >
              Complétez votre compte
            </button>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full border py-2 rounded-lg text-base md:text-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL COMPLETER COMPTE */}
      {showCompleteAccount && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg md:text-xl">Gérer vos comptes</h3>
              <button onClick={() => setShowCompleteAccount(false)} className="text-2xl text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {/* Liste des comptes existants */}
            {bankAccounts.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-base mb-3">Vos comptes enregistrés</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm md:text-base">
                            {account.account_type === 'bank' ? account.bank_name : account.operator_name}
                          </span>
                          {account.is_default && (
                            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded">Par défaut</span>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600">{account.account_holder_name}</div>
                        <div className="text-xs md:text-sm text-gray-500">{account.account_number}</div>
                      </div>
                      <div className="flex gap-2">
                        {!account.is_default && (
                          <button
                            onClick={() => handleSetDefaultAccount(account.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Défaut
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold text-base mb-3">Ajouter un nouveau compte</h4>

              {/* Type de compte */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Type de compte</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAccountType('bank')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      accountType === 'bank'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🏦 Banque
                  </button>
                  <button
                    onClick={() => setAccountType('operator')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      accountType === 'operator'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📱 Opérateur
                  </button>
                </div>
              </div>

              {/* Sélection banque ou opérateur */}
              {accountType === 'bank' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Sélectionnez votre banque</label>
                  <button
                    onClick={() => setShowBankList(true)}
                    className="w-full border border-gray-300 p-3 rounded-lg text-left text-sm md:text-base hover:bg-gray-50"
                  >
                    {selectedBank || 'Choisir une banque...'}
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Sélectionnez votre opérateur</label>
                  <button
                    onClick={() => setShowOperatorList(true)}
                    className="w-full border border-gray-300 p-3 rounded-lg text-left text-sm md:text-base hover:bg-gray-50"
                  >
                    {selectedOperator || 'Choisir un opérateur...'}
                  </button>
                </div>
              )}

              {/* Numéro de compte */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Numéro de compte</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder={accountType === 'bank' ? 'Ex: 0123456789' : 'Ex: +243 XXX XXX XXX'}
                />
              </div>

              {/* Nom du titulaire */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nom du titulaire</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Nom complet tel qu'enregistré"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteAccount(false)}
                  className="flex-1 border border-gray-300 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveBankAccount}
                  disabled={savingAccount}
                  className="flex-1 bg-violet-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium hover:bg-violet-700 disabled:opacity-50"
                >
                  {savingAccount ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTE DES BANQUES */}
      {showBankList && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex justify-center items-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Sélectionnez une banque</h3>
              <button onClick={() => setShowBankList(false)} className="text-2xl text-gray-500">✕</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {banks.map((bank) => (
                <button
                  key={bank}
                  onClick={() => {
                    setSelectedBank(bank)
                    setShowBankList(false)
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-violet-50 transition text-sm md:text-base"
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTE DES OPERATEURS */}
      {showOperatorList && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex justify-center items-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Sélectionnez un opérateur</h3>
              <button onClick={() => setShowOperatorList(false)} className="text-2xl text-gray-500">✕</button>
            </div>
            <div className="space-y-2">
              {operators.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOperator(op.id)
                    setShowOperatorList(false)
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-violet-50 transition text-sm md:text-base"
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITER PROFIL */}
      {editProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md space-y-3">
            <h3 className="font-semibold text-lg md:text-xl">Modifier vos informations</h3>
            <input
              type="text"
              placeholder="Nom"
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base"
            />
            <input
              type="email"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base"
            />
            <input
              type="password"
              placeholder="Nouveau mot de passe (optionnel)"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={editForm.confirmPassword}
              onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base"
            />
            <button
              onClick={handleEditProfile}
              disabled={loadingEdit}
              className="w-full bg-purple-600 text-white py-2 md:py-3 rounded-lg text-base md:text-lg disabled:opacity-50"
            >
              {loadingEdit ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            <button
              onClick={() => setEditProfile(false)}
              className="w-full border py-2 rounded-lg text-base md:text-lg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {/* ================= MODAL IOS ================= */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-4 md:p-5 w-full max-w-sm md:max-w-md space-y-4">
            <h3 className="font-semibold text-lg md:text-xl">Installer sur iPhone</h3>
            <ol className="list-decimal list-inside text-sm md:text-base text-gray-600 space-y-2">
              <li>Ouvre l’application dans <strong>Safari</strong></li>
              <li>Appuie sur <strong>Partager</strong> (icône en haut à droite)</li>
              <li>Sélectionne <strong>Ajouter à l’écran d’accueil</strong></li>
              <li>Confirme avec <strong>Ajouter</strong></li>
            </ol>
            <button onClick={() => setShowIOSModal(false)} className="w-full py-2 border rounded-lg text-base md:text-lg">
              Fermer
            </button>
          </div>
        </div>
      )}
      {/* ================= MODAL ANDROID ================= */}
      {showAndroidModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-sm lg:max-w-md space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header avec icone */}
            <div className="flex items-center gap-3 sm:gap-4 border-b pb-4 sm:pb-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center border-2 border-green-200">
                <img src={androidIcon} alt="Android" className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900 truncate">Application Android</h3>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Bientôt disponible</p>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="space-y-3 sm:space-y-4">
              {/* Message de disponibilité */}
              <div className="bg-gradient-to-br from-green-50 to-green-25 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">📱</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-green-900 mb-1 sm:mb-2">Disponibilité imminente</h4>
                    <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                      Notre application Android sera bientôt disponible sur le <strong>Google Play Store</strong>. Restez à l'écoute !
                    </p>
                  </div>
                </div>
              </div>

              {/* Méthode d'installation alternative */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-25 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>💡</span> <span>En attendant</span>
                </h4>
                <p className="text-xs sm:text-sm text-blue-800 mb-3 sm:mb-4 leading-relaxed">
                  Vous pouvez ajouter notre application directement à l'écran d'accueil de votre téléphone :
                </p>
                <ol className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-blue-800">
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="font-bold flex-shrink-0">1.</span>
                    <span><strong>Ouvrez</strong> l'application dans votre navigateur Chrome</span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="font-bold flex-shrink-0">2.</span>
                    <span>Appuyez sur le <strong>menu (⋮)</strong> en haut à droite</span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="font-bold flex-shrink-0">3.</span>
                    <span>Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="font-bold flex-shrink-0">4.</span>
                    <span>Appuyez sur <strong>"Installer"</strong></span>
                  </li>
                </ol>
              </div>

              {/* Avantages de l'installation */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-25 border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>⭐</span> <span>Avantages</span>
                </h4>
                <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-purple-800">
                  <li className="flex items-center gap-2.5 leading-relaxed">
                    <span className="font-bold text-base flex-shrink-0">✓</span> 
                    <span>Accès rapide depuis l'écran d'accueil</span>
                  </li>
                  <li className="flex items-center gap-2.5 leading-relaxed">
                    <span className="font-bold text-base flex-shrink-0">✓</span> 
                    <span>Fonctionnalité hors ligne partielle</span>
                  </li>
                  <li className="flex items-center gap-2.5 leading-relaxed">
                    <span className="font-bold text-base flex-shrink-0">✓</span> 
                    <span>Notifications de dépôt et retrait</span>
                  </li>
                  <li className="flex items-center gap-2.5 leading-relaxed">
                    <span className="font-bold text-base flex-shrink-0">✓</span> 
                    <span>Expérience fluide et rapide</span>
                  </li>
                </ul>
              </div>

              {/* Notification de suivi */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-25 border border-amber-200 rounded-lg sm:rounded-xl p-3.5 sm:p-4 lg:p-5">
                <p className="text-xs sm:text-sm text-amber-800 text-center leading-relaxed font-medium">
                  <span className="text-lg sm:text-xl">🔔</span> <strong>Notification :</strong> Vous serez averti dès que l'application sera disponible sur le Play Store
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 border-t pt-4 sm:pt-5">
              <button
                onClick={() => setShowAndroidModal(false)}
                className="order-2 sm:order-1 flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 py-3 sm:py-3.5 px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  notify.success('Lien copié !')
                }}
                className="order-1 sm:order-2 flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 sm:py-3.5 px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>Copier le lien</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}

      <BottomNav />

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-40">
        <button
          onClick={() => setShowChatModal(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl"
          title="Chat avec l'admin"
        >
          <img src={chatIcon} alt="Chat" className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowSocialModal(true)}
          className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl"
          title="Réseaux sociaux"
        >
          <img src={reseauxIcon} alt="Réseaux sociaux" className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowAboutModal(true)}
          className="w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl"
          title="À propos"
        >
          <img src={aproposIcon} alt="À propos" className="w-6 h-6" />
        </button>
      </div>

      {/* MODAL CHAT ADMIN */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md">
            <h3 className="font-semibold text-lg md:text-xl mb-3">Chat avec l'administrateur</h3>
            <textarea
              placeholder="Tapez votre message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="w-full border p-2 md:p-3 rounded text-sm md:text-base h-24 resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setShowChatModal(false)}
                className="flex-1 border py-2 rounded-lg text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleSendChat}
                disabled={loadingChat || !chatMessage.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm md:text-base disabled:opacity-50"
              >
                {loadingChat ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESEAUX SOCIAUX */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md">
            <h3 className="font-semibold text-lg md:text-xl mb-4">Nos réseaux sociaux</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.open('https://wa.me/group/example', '_blank')}
                className="w-full bg-green-600 text-white py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center gap-2"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                Groupe WhatsApp
              </button>
              <button
                onClick={() => window.open('https://wa.me/channel/example', '_blank')}
                className="w-full bg-green-500 text-white py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center gap-2"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                Canal WhatsApp
              </button>
              <button
                onClick={() => window.open('https://t.me/example', '_blank')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center gap-2"
              >
                <img src={telegramIcon} alt="Telegram" className="w-5 h-5" />
                Canal Télégram
              </button>
            </div>
            <button
              onClick={() => setShowSocialModal(false)}
              className="w-full border py-2 rounded-lg text-sm md:text-base mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL A PROPOS */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-lg md:text-xl mb-4 text-center">À propos de nous</h3>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <img src={propos1} alt="À propos 1" className="w-full md:w-1/2 h-48 object-cover rounded-lg" />
                <img src={propos2} alt="À propos 2" className="w-full md:w-1/2 h-48 object-cover rounded-lg" />
              </div>
              <div className="text-sm md:text-base text-gray-700 space-y-3">
                <p>
                  <strong>Notre histoire commence en 2020,</strong> lorsque notre équipe visionnaire a identifié une opportunité unique dans le domaine des investissements numériques. Face à la volatilité des marchés traditionnels, nous avons décidé de créer une plateforme qui démocratise l'accès aux investissements rentables pour tous.
                </p>
                <p>
                  <strong>Avec plus de 3 ans d'expérience,</strong> nous avons aidé des milliers d'utilisateurs à atteindre leurs objectifs financiers grâce à nos stratégies d'investissement éprouvées et notre approche transparente. Notre plateforme offre des rendements stables de 5% par jour sur 180 jours, garantissant sécurité et fiabilité.
                </p>
                <p>
                  <strong>Notre mission :</strong> Rendre l'investissement accessible à tous, en éliminant les barrières financières et techniques. Nous croyons que chacun mérite la chance de construire un avenir prospère, et nous nous engageons à fournir les outils et le support nécessaires pour y parvenir.
                </p>
                <p>
                  <strong>Rejoignez notre communauté</strong> et commencez votre voyage vers la liberté financière dès aujourd'hui !
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full border py-2 rounded-lg text-sm md:text-base mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* REFERRALS MODAL */}
      {showReferralsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2 sm:px-4 py-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[88vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base sm:text-lg md:text-xl">Mes filleuls</h3>
              <button onClick={() => setShowReferralsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            {referrals && referrals.length > 0 ? (
              <div className="space-y-3">
                {referrals.map((ref: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base text-gray-900">
                          {ref.referred_user?.first_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          {ref.referred_user?.email || '—'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          Inscrit le: {ref.used_at ? new Date(ref.used_at).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          ref.status === 'used' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ref.status === 'used' ? 'Actif' : 'Attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm md:text-base text-gray-400">
                  Aucun filleul pour le moment
                </p>
              </div>
            )}

            <button
              onClick={() => setShowReferralsModal(false)}
              className="w-full border py-2 sm:py-2.5 rounded-lg text-sm md:text-base mt-4 hover:bg-gray-50 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
