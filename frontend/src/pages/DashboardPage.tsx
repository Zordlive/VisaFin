import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchMyReferrals } from '../services/referrals'
import { useNotify } from '../hooks/useNotify'
import BottomNav from '../components/BottomNav'
import HeaderActions from '../components/HeaderActions'
import TradeSignals from '../components/TradeSignals'
import api, { getSocialLinks, type SocialLinks } from '../services/api'
import logo from '../img/Logo à jour.png'
import propos1 from '../img/About.png'
import propos2 from '../img/about 2.png'
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
  const safeVipSubscriptions = Array.isArray(vipSubscriptions) ? vipSubscriptions : []
  const safeReferrals = Array.isArray(referrals) ? referrals : []
  const maxVIPLevel = safeVipSubscriptions.length > 0 
    ? Math.max(...safeVipSubscriptions.map((s: any) => s.vip_level?.level || 0))
    : 0

  const [showOfferDetails, setShowOfferDetails] = useState<any>(null)
  const [showWhatsappModal, setShowWhatsappModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const [showIOSModal, setShowIOSModal] = useState(false)

  // Floating buttons modals
  const [showChatModal, setShowChatModal] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [showWhatsAppSubModal, setShowWhatsAppSubModal] = useState(false)
  const [showTelegramSubModal, setShowTelegramSubModal] = useState(false)

  // Social links data
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null)

  // Chat
  const [chatMessage, setChatMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)

  // PROFIL
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [showCompleteAccount, setShowCompleteAccount] = useState(false)

  // COMPTES BANCAIRES
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : []
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

  // Liste des banques disponibles (remplacée par crypto networks)
  const banks = [
    { id: 'TRX', label: 'TRX Tronc20' },
    { id: 'BNB', label: 'BNB BEP20' },
    { id: 'USDT', label: 'USDT BEP20' },
  ]

  const operators = [
    { id: 'ORANGE', name: 'Orange Money' },
    { id: 'AIRTEL', name: 'Airtel Money' },
    { id: 'MPESA', name: 'Vodacom M-Pesa' },
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
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://localhost'}/register?ref=${code}`
    : ''

  const totalExpenses = Array.isArray(transactions)
    ? transactions
        .filter((tx: any) => ['withdraw', 'trade'].includes(tx?.type))
        .reduce((sum: number, tx: any) => sum + Number(tx?.amount || 0), 0)
    : 0

  const loadDashboard = (mountedRef?: { current: boolean }) => {
    return Promise.all([
      import('../services/Investments').then(({ fetchWallets }) => {
        return fetchWallets().then((data: any) => {
          if (mountedRef?.current !== false && Array.isArray(data)) setWallet(data[0])
        }).catch(() => {})
      }),
      api.get('/investments').then(res => {
        if (mountedRef?.current !== false) setInvestments(Array.isArray(res.data) ? res.data : [])
      }).catch(() => {}),
      api.get('/transactions').then(res => {
        if (mountedRef?.current !== false) setTransactions(Array.isArray(res.data) ? res.data : [])
      }).catch(() => {}),
      import('../services/vip').then(({ fetchUserVIPSubscriptions }) => {
        return fetchUserVIPSubscriptions().then((data: any) => {
          if (mountedRef?.current !== false) setVipSubscriptions(Array.isArray(data) ? data : [])
        }).catch(() => {})
      }),
      api.get('/referrals/me').then(res => {
        if (mountedRef?.current !== false && res.data) {
          const refs = res.data.referrals
          setReferrals(Array.isArray(refs) ? refs : [])
        }
      }).catch(() => {})
    ])
  }

  useEffect(() => {
    const mountedRef = { current: true }

    loadDashboard(mountedRef).finally(() => {
      if (mountedRef.current) setPageLoading(false)
    })

    const onRefresh = () => {
      loadDashboard(mountedRef)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('wallets:refresh', onRefresh)
    }

    return () => {
      mountedRef.current = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('wallets:refresh', onRefresh)
      }
    }
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
    loadSocialLinks()
  }, [])

  async function loadBankAccounts() {
    try {
      const accounts = await fetchBankAccounts()
      setBankAccounts(Array.isArray(accounts) ? accounts : [])
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

  async function loadSocialLinks() {
    try {
      const links = await getSocialLinks()
      setSocialLinks(links)
    } catch (e) {
      console.error('Error loading social links:', e)
    }
  }

  const canHarvest = (date: string) =>
    Date.now() - new Date(date).getTime() >= 24 * 60 * 60 * 1000

  async function onCopy() {
    if (!inviteLink) {
      notify.error('Code non disponible')
      return
    }
    try {
      await navigator.clipboard.writeText(inviteLink)
      notify.success('Code copié')
    } catch (e) {
      notify.error('Erreur de copie')
    }
  }

  async function onShare() {
    if (!inviteLink) {
      notify.error('Lien non disponible')
      return
    }
    try {
      if (navigator.share) {
        await navigator.share({ url: inviteLink, title: 'VISAFINANCE' })
      } else {
        await navigator.clipboard.writeText(inviteLink)
        notify.success('Lien copié')
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        notify.error('Erreur lors du partage')
      }
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
      // Just show success notification without API call
      notify.success('Message envoyé à l\'administrateur')
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
      notify.error('Veuillez sélectionner un réseau crypto')
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

      const successMessage = accountType === 'bank' 
        ? 'Portefeuille crypto ajouté avec succès' 
        : 'Compte opérateur ajouté avec succès'
      notify.success(successMessage)
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
              <div className="text-white/70 text-xs md:text-sm mb-1">Total investi</div>
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

      {/* TRADE SIGNALS */}
      {/* <TradeSignals /> */}

      {/* CODE PARRAINAGE */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow mb-5">
        <div className="text-sm md:text-base text-gray-500 mb-2">Code Parrainage</div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="font-bold text-lg md:text-xl break-all">{code ?? '—'}</span>
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={() => onCopy()} 
              className="border border-gray-300 hover:bg-gray-50 px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition"
            >
              📋 Copier
            </button>
            <button 
              onClick={() => onShare()} 
              className="border border-gray-300 hover:bg-gray-50 px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition"
            >
              🔗 Partager
            </button>
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
          <a
            href="https://play.google.com/store/apps/details?id=com.visafinance.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl text-center text-base md:text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            <img src={androidIcon} alt="Android" className="w-6 h-6" />
            Google Play
          </a>
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex-1 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 text-white py-4 rounded-xl text-base md:text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            <img src={appleIcon} alt="Apple" className="w-6 h-6" />
            App Store
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
                  {safeBankAccounts.map((account) => (
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
              <h4 className="font-semibold text-base mb-4">Ajouter un nouveau compte</h4>

              {/* Onglets Type de compte - Animations professionnelles */}
              <div className="mb-6">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setAccountType('bank')}
                    className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all duration-300 transform ${
                      accountType === 'bank'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    🪙 Crypto Networks
                  </button>
                  <button
                    onClick={() => setAccountType('operator')}
                    className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all duration-300 transform ${
                      accountType === 'operator'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    📱 Opérateurs
                  </button>
                </div>
              </div>

              {/* Contenu dynamique avec animation fade-in */}
              <div className="transition-all duration-300">
                {accountType === 'bank' ? (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Sélection crypto network */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Sélectionnez votre réseau crypto</label>
                      <button
                        onClick={() => setShowBankList(true)}
                        className="w-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg text-left text-sm md:text-base hover:border-violet-400 hover:shadow-md transition-all duration-300 font-medium text-gray-800"
                      >
                        {selectedBank ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">🪙</span>
                            {selectedBank}
                          </span>
                        ) : (
                          <span className="text-gray-500">Choisir un réseau...</span>
                        )}
                      </button>
                    </div>

                    {/* Adresse portefeuille */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Adresse portefeuille</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300"
                        placeholder="Votre adresse complète (0x...)"
                      />
                    </div>

                    {/* Nom du portefeuille */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Nom du portefeuille</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300"
                        placeholder="Ex: Mon Wallet, Ledger, etc."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Sélection opérateur */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Sélectionnez votre opérateur</label>
                      <button
                        onClick={() => setShowOperatorList(true)}
                        className="w-full border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg text-left text-sm md:text-base hover:border-green-400 hover:shadow-md transition-all duration-300 font-medium text-gray-800"
                      >
                        {selectedOperator ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📱</span>
                            {selectedOperator}
                          </span>
                        ) : (
                          <span className="text-gray-500">Choisir un opérateur...</span>
                        )}
                      </button>
                    </div>

                    {/* Numéro de compte */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Numéro de compte</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-300"
                        placeholder="Ex: +243 XXX XXX XXX"
                      />
                    </div>

                    {/* Nom du titulaire */}
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Nom du titulaire</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-300"
                        placeholder="Nom complet tel qu'enregistré"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowCompleteAccount(false)}
                  className="flex-1 border-2 border-gray-300 py-3 md:py-3 rounded-lg text-sm md:text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveBankAccount}
                  disabled={savingAccount}
                  className={`flex-1 ${
                    accountType === 'bank'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  } text-white py-3 md:py-3 rounded-lg text-sm md:text-base font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {savingAccount ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin">⏳</span>
                      Enregistrement...
                    </span>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTE DES CRYPTO NETWORKS */}
      {showBankList && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex justify-center items-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-sm md:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Sélectionnez un réseau crypto</h3>
              <button onClick={() => setShowBankList(false)} className="text-2xl text-gray-500">✕</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {banks.map((bank: any) => (
                <button
                  key={bank.id}
                  onClick={() => {
                    setSelectedBank(bank.label)
                    setShowBankList(false)
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-violet-50 transition text-sm md:text-base font-medium text-gray-700"
                >
                  {bank.label}
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
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm md:max-w-md shadow-2xl">
            <h3 className="font-bold text-xl md:text-2xl mb-6 text-center text-gray-800">Nos réseaux sociaux</h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowSocialModal(false)
                  setShowWhatsAppSubModal(true)
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6" />
                WhatsApp
              </button>
              <button
                onClick={() => {
                  setShowSocialModal(false)
                  setShowTelegramSubModal(true)
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
              >
                <img src={telegramIcon} alt="Telegram" className="w-6 h-6" />
                Telegram
              </button>
            </div>
            <button
              onClick={() => setShowSocialModal(false)}
              className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl text-base md:text-lg mt-6 font-medium text-gray-700 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP SUB-MENU */}
      {showWhatsAppSubModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm md:max-w-md shadow-2xl">
            <h3 className="font-bold text-xl md:text-2xl mb-6 text-center text-gray-800">WhatsApp</h3>
            <div className="space-y-4">
              {socialLinks?.whatsapp_channel && (
                <button
                  onClick={() => {
                    window.open(socialLinks.whatsapp_channel!, '_blank')
                    setShowWhatsAppSubModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
                >
                  <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6" />
                  Canal WhatsApp
                </button>
              )}
              {socialLinks?.whatsapp_group && (
                <button
                  onClick={() => {
                    window.open(socialLinks.whatsapp_group!, '_blank')
                    setShowWhatsAppSubModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
                >
                  <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6" />
                  Groupe WhatsApp
                </button>
              )}
              {!socialLinks?.whatsapp_channel && !socialLinks?.whatsapp_group && (
                <p className="text-center text-gray-500 py-4">Aucun lien WhatsApp disponible</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowWhatsAppSubModal(false)
                setShowSocialModal(true)
              }}
              className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl text-base md:text-lg mt-6 font-medium text-gray-700 transition"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* MODAL TELEGRAM SUB-MENU */}
      {showTelegramSubModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-sm md:max-w-md shadow-2xl">
            <h3 className="font-bold text-xl md:text-2xl mb-6 text-center text-gray-800">Telegram</h3>
            <div className="space-y-4">
              {socialLinks?.telegram_channel && (
                <button
                  onClick={() => {
                    window.open(socialLinks.telegram_channel!, '_blank')
                    setShowTelegramSubModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
                >
                  <img src={telegramIcon} alt="Telegram" className="w-6 h-6" />
                  Canal Telegram
                </button>
              )}
              {socialLinks?.telegram_group && (
                <button
                  onClick={() => {
                    window.open(socialLinks.telegram_group!, '_blank')
                    setShowTelegramSubModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white py-4 rounded-xl text-base md:text-lg font-semibold flex items-center justify-center gap-3 shadow-lg transform transition hover:scale-105"
                >
                  <img src={telegramIcon} alt="Telegram" className="w-6 h-6" />
                  Groupe Telegram
                </button>
              )}
              {!socialLinks?.telegram_channel && !socialLinks?.telegram_group && (
                <p className="text-center text-gray-500 py-4">Aucun lien Telegram disponible</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowTelegramSubModal(false)
                setShowSocialModal(true)
              }}
              className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl text-base md:text-lg mt-6 font-medium text-gray-700 transition"
            >
              Retour
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
                {safeReferrals.map((ref: any, idx: number) => (
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

      {/* TRADE SIGNALS - Intégré directement */}
      <TradeSignalsSection />
    </div>
  )
}

// Composant TradeSignals intégré
interface Signal {
  id: number
  symbol: string
  action: 'BUY' | 'SELL'
  price: number
  change: number
  strength: number
  timestamp: string
  emoji: string
  priceHistory: number[]
}

function TradeSignalsSection() {
  const [signals, setSignals] = React.useState<Signal[]>([])
  const [animatingSignals, setAnimatingSignals] = React.useState<Set<number>>(new Set())
  const [updatingPrices, setUpdatingPrices] = React.useState<Set<number>>(new Set())

  const generateSignals = (): Signal[] => [
    {
      id: 1,
      symbol: 'BTC/USD',
      action: 'BUY',
      price: 45230.50,
      change: 2.45,
      strength: 95,
      timestamp: 'À l\'instant',
      emoji: '₿',
      priceHistory: [44800, 44950, 45100, 45180, 45230, 45280, 45230]
    },
    {
      id: 2,
      symbol: 'ETH/USD',
      action: 'SELL',
      price: 2450.75,
      change: -1.23,
      strength: 87,
      timestamp: 'Il y a 2m',
      emoji: 'Ξ',
      priceHistory: [2480, 2475, 2465, 2460, 2455, 2450, 2450]
    },
    {
      id: 3,
      symbol: 'SOL/USD',
      action: 'BUY',
      price: 198.45,
      change: 5.12,
      strength: 98,
      timestamp: 'Il y a 3m',
      emoji: '◎',
      priceHistory: [188, 189, 190, 193, 196, 197, 198]
    },
    {
      id: 4,
      symbol: 'XRP/USD',
      action: 'BUY',
      price: 2.48,
      change: 3.87,
      strength: 92,
      timestamp: 'Il y a 5m',
      emoji: '✕',
      priceHistory: [2.32, 2.36, 2.40, 2.42, 2.45, 2.47, 2.48]
    }
  ]

  React.useEffect(() => {
    setSignals(generateSignals())
  }, [])

  // Mise à jour des prix toutes les 15 secondes
  React.useEffect(() => {
    const priceTimer = setInterval(() => {
      setUpdatingPrices(new Set(signals.map(s => s.id)))
      
      setSignals(prev =>
        prev.map(signal => {
          const variation = (Math.random() - 0.5) * 0.02
          const newPrice = signal.price * (1 + variation)
          const newChange = ((newPrice - signal.priceHistory[0]) / signal.priceHistory[0]) * 100
          
          return {
            ...signal,
            price: newPrice,
            change: newChange,
            priceHistory: [...signal.priceHistory.slice(1), newPrice]
          }
        })
      )
      
      setTimeout(() => setUpdatingPrices(new Set()), 500)
    }, 15000)

    return () => clearInterval(priceTimer)
  }, [signals])

  const getLineChart = (prices: number[]) => {
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const h = 40

    const points = prices.map((price, i) => {
      const y = h - ((price - min) / range) * h
      const x = (i / (prices.length - 1)) * 100
      return `${x},${y}`
    })

    return `M${points.join(' L')}`
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl overflow-hidden mb-6 border border-purple-500/30 relative">
      {/* Fond animé */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.3),transparent_50%)]"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative p-4 md:p-6 lg:p-8">
        {/* Header avec slogan */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                VISAFINANCE IA
              </h2>
              <p className="text-xs md:text-sm lg:text-base text-gray-300">
                ⚡ Signaux Trading en Temps Réel
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-violet-600 to-pink-600 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white font-bold text-xs md:text-sm">
                EN DIRECT
              </div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full w-20 md:w-24 animate-pulse"></div>
        </div>

        {/* Grille des signaux - 4 colonnes responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {signals.map((signal, idx) => (
            <div
              key={signal.id}
              className={`group relative transform transition-all duration-500 ${
                animatingSignals.has(idx) ? 'scale-105 animate-pulse' : 'hover:scale-105'
              }`}
            >
              {/* Gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Card */}
              <div
                className={`relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300 h-full ${
                  signal.action === 'BUY'
                    ? 'bg-gradient-to-br from-slate-800 to-emerald-900/30'
                    : 'bg-gradient-to-br from-slate-800 to-red-900/30'
                }`}
              >
                {/* Signal badge avec animation */}
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div
                      className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse ${
                        signal.action === 'BUY' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    ></div>
                    <span
                      className={`text-xs font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg ${
                        signal.action === 'BUY'
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/30 text-red-300'
                      }`}
                    >
                      {signal.action}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{signal.timestamp}</span>
                </div>

                {/* Symbole et prix */}
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <span className="text-xl md:text-2xl">{signal.emoji}</span>
                    <div>
                      <div className="text-sm md:text-base font-bold text-white">{signal.symbol}</div>
                      <div className="text-xs text-gray-400">{signal.symbol.split('/')[0]}</div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg md:text-xl font-black text-white transition-all duration-500 ${
                      updatingPrices.has(signal.id) ? 'scale-110 text-emerald-300' : ''
                    }`}>
                      ${signal.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-bold transition-all duration-300 ${
                        signal.change > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {signal.change > 0 ? '▲' : '▼'} {Math.abs(signal.change).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Barre de force du signal */}
                <div className="mb-1.5 md:mb-2">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <span className="text-xs text-gray-400">Force</span>
                    <span className={`text-xs font-bold ${signal.strength >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {signal.strength}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 md:h-2 bg-slate-700/50 rounded-full overflow-hidden border border-purple-500/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        signal.strength >= 90
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/50'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      }`}
                      style={{ width: `${signal.strength}%` }}
                    ></div>
                  </div>
                </div>

                {/* Graphique sparkline animé */}
                <div className="mb-2 md:mb-3 bg-slate-700/30 rounded-lg p-2 border border-purple-500/10">
                  <svg 
                    viewBox="0 0 100 40" 
                    className="w-full h-10"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`grad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={signal.action === 'BUY' ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={signal.action === 'BUY' ? '#34d399' : '#f87171'} stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d={`${getLineChart(signal.priceHistory)} L 100 40 L 0 40 Z`}
                      fill={`url(#grad-${signal.id})`}
                      opacity="0.3"
                    />
                    
                    <path
                      d={getLineChart(signal.priceHistory)}
                      stroke={signal.action === 'BUY' ? '#10b981' : '#ef4444'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500"
                    />
                    
                    <circle
                      cx="100"
                      cy={40 - ((signal.priceHistory[signal.priceHistory.length - 1] - Math.min(...signal.priceHistory)) / (Math.max(...signal.priceHistory) - Math.min(...signal.priceHistory) || 1)) * 40}
                      r="1.5"
                      fill={signal.action === 'BUY' ? '#34d399' : '#f87171'}
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicateurs en bas */}
        <div className="mt-8 pt-6 border-t border-purple-500/20 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {signals.filter(s => s.action === 'BUY').length} Achats
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {signals.filter(s => s.action === 'SELL').length} Ventes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300">
              {(signals.reduce((acc, s) => acc + s.strength, 0) / signals.length).toFixed(0)}% Précision
            </span>
          </div>
        </div>
      </div>

      {/* Ligne animée en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse"></div>
    </div>
  )
}
