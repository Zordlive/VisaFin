import React, { useState, useEffect } from 'react'
import { useWallets } from '../hooks/useWallets'
import { transferFunds } from '../services/wallets'
import { useNotify } from '../hooks/useNotify'
import HeaderActions from '../components/HeaderActions'
import BottomNav from '../components/BottomNav'
import { createCryptoDeposit } from '../services/deposits'
import { createWithdrawal } from '../services/withdrawals'
import api, { getCryptoAddresses, type CryptoAddress } from '../services/api'
import { fetchOperateurs } from '../services/operateurs'
import logo from '../img/Logo à jour.png'
import orangeLogo from '../img/Orange Monnaie.png'
import airtelLogo from '../img/Airtel-Money-Logo-PNG.png'
import mpesaLogo from '../img/M-pesa-logo.png'
import { fetchBankAccounts, type BankAccount } from '../services/bankAccounts'

export default function PortefeuillePage() {
  const { data, isLoading, error, refetch } = useWallets()
  const notify = useNotify()

  // Style personnalisé pour le select mobile
  const selectStyle = {
    textAlign: 'center' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundPosition: 'right 10px center' as const,
    backgroundRepeat: 'no-repeat' as const,
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")' as const,
  }

  // CSS personnalisé pour mobile
  const mobileSelectCSS = `
    @media (max-width: 640px) {
      select:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }
      select option {
        text-align: center;
        padding: 12px;
        background-color: white;
        color: #374151;
      }
    }
  `

  /* ===================== STATES ===================== */
  const [loadingTransfer, setLoadingTransfer] = useState(false)

  const operators = [
    { id: 'ORANGE', label: 'Orange', logo: orangeLogo },
    { id: 'AIRTEL', label: 'Airtel', logo: airtelLogo },
    { id: 'MPESA', label: 'M-Pesa', logo: mpesaLogo },
  ] as const

  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<'gains' | 'sale'>('gains')

  /* ===== RETRAIT ===== */
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [bank, setBank] = useState('')
  const [account, setAccount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loadingWithdraw, setLoadingWithdraw] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)

  /* ===== DEPOT ===== */
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositType, setDepositType] = useState<'FIAT' | 'CRYPTO'>('FIAT')

  const [fiatCurrency, setFiatCurrency] = useState<'CDF' | 'USD'>('CDF')
  const [fiatOperator, setFiatOperator] = useState<any>('')
  const [fiatPhone, setFiatPhone] = useState('')
  const [fiatAmount, setFiatAmount] = useState('')
  const [loadingFiat, setLoadingFiat] = useState(false)
  const [operateurs, setOperateurs] = useState<any[]>([])
  const [selectedOperateurData, setSelectedOperateurData] = useState<any>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(20)

  const [cryptoChannel, setCryptoChannel] = useState<any>('')
  const [depositAmount, setDepositAmount] = useState('')
  const [txid, setTxid] = useState('')
  const [loadingDeposit, setLoadingDeposit] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState('')

  // Réseaux crypto avec leurs adresses
  const cryptoNetworks = [
    { id: 'usdt-bep20', name: 'USDT BEP20', address: '0x7ee2ebefab063aac29f9a941bbf924cbd448ad3a' },
    { id: 'bnb-bep20', name: 'BNB BEP20', address: '0x7ee2ebefab063aac29f9a941bbf924cbd448ad3a' },
    { id: 'trx-tronc20', name: 'TRX Tronc20', address: 'TUUCK4H63D9bz1S4e1EVbJHKHxEwsYNDzM' }
  ]

  /* ===== TRANSACTIONS ===== */
  const [transactions, setTransactions] = useState<any[]>([])
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)

  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([])
  const [loadingCryptoAddresses, setLoadingCryptoAddresses] = useState(false)


  /* ===================== VALIDATIONS ===================== */
  const isValidDeposit = cryptoChannel && depositAmount && txid.trim()

  // Injecter le CSS personnalisé pour mobile
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = mobileSelectCSS
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Charger les transactions
  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    const onRefresh = () => {
      refetch()
      loadTransactions()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('wallets:refresh', onRefresh)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('wallets:refresh', onRefresh)
      }
    }
  }, [refetch])

  // Charger les opérateurs au démarrage
  useEffect(() => {
    loadOperateurs()
    loadBankAccounts()
    loadCryptoAddresses()
  }, [])

  async function loadCryptoAddresses() {
    setLoadingCryptoAddresses(true)
    try {
      const addresses = await getCryptoAddresses()
      setCryptoAddresses(addresses)
    } catch (e) {
      console.error('Error loading crypto addresses:', e)
    } finally {
      setLoadingCryptoAddresses(false)
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

  async function loadBankAccounts() {
    try {
      const accounts = await fetchBankAccounts()
      setBankAccounts(accounts)
      
      // Auto-sélectionner le compte par défaut s'il existe
      const defaultAccount = accounts.find(acc => acc.is_default)
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id)
      }
    } catch (e) {
      console.error('Error loading bank accounts:', e)
    }
  }

  // Gestion du compteur 20 secondes
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showConfirmationModal && countdownSeconds > 0) {
      timer = setTimeout(() => {
        setCountdownSeconds(countdownSeconds - 1)
      }, 1000)
    } else if (countdownSeconds === 0 && showConfirmationModal) {
      // Auto-confirmer après 20 secondes
      handleFiatConfirm()
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showConfirmationModal, countdownSeconds])

  async function loadTransactions() {
    setLoadingTransactions(true)
    try {
      const response = await api.get('/transactions')
      setTransactions(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      console.error('Error loading transactions:', e)
    } finally {
      setLoadingTransactions(false)
    }
  }

  async function clearHistory() {
    if (!window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique des transactions ?')) {
      return
    }
    
    setClearingHistory(true)
    try {
      await api.delete('/transactions/clear')
      setTransactions([])
      notify.success('Historique effacé avec succès')
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Erreur lors de l\'effacement')
    } finally {
      setClearingHistory(false)
    }
  }

  /* ===================== DATA ===================== */
  const wallets = data?.wallets || data || []
  const mainWallet = wallets[0]

  const totalAvailable = wallets.reduce((a: number, w: any) => a + Number(w.available || 0), 0)
  const totalGains = wallets.reduce((a: number, w: any) => a + Number(w.gains || 0), 0)
  const totalExpenses = transactions
    .filter((tx: any) => ['withdraw', 'trade'].includes(tx?.type))
    .reduce((sum: number, tx: any) => sum + Number(tx?.amount || 0), 0)

  if (isLoading)
    return (
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center" style={{backgroundColor: '#131E3A'}}>
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-violet-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Chargement de votre portefeuille...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen pb-20 sm:pb-24 flex items-center justify-center" style={{backgroundColor: '#F4EDDE'}}>
        <div className="text-center px-4">
          <p className="text-sm sm:text-base text-red-600 font-semibold">Erreur de chargement</p>
        </div>
      </div>
    )

  /* ===================== ACTIONS ===================== */
  const handleTransfer = async () => {
    if (!amount) return notify.error('Montant invalide')
    setLoadingTransfer(true)
    try {
      await transferFunds(mainWallet.id, amount, source)
      notify.success('Transfert réussi')
      setAmount('')
      refetch()
      loadTransactions()
    } catch {
      notify.error('Erreur transfert')
    } finally {
      setLoadingTransfer(false)
    }
  }

  const handleWithdraw = async () => {
    if (!selectedAccountId) {
      notify.error('Veuillez sélectionner un compte')
      return
    }

    setLoadingWithdraw(true)
    try {
      const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId)
      if (!selectedAccount) {
        notify.error('Compte invalide')
        return
      }

      await createWithdrawal({
        amount: Number(withdrawAmount),
        bank: selectedAccount.account_type === 'bank' ? selectedAccount.bank_name! : selectedAccount.operator_name!,
        account: selectedAccount.account_number
      })
    } catch (e: any) {
      // Ne pas afficher d'erreur, la demande est toujours transférée à l'admin
      console.log('Demande de retrait envoyée à l\'admin pour validation')
    } finally {
      // Toujours afficher le succès et fermer le modal
      notify.success('Votre demande de retrait a été envoyée. L\'administrateur la traitera dans les plus brefs délais.')
      setShowWithdraw(false)
      setWithdrawAmount('')
      setSelectedAccountId(null)
      setWithdrawError(null)
      setLoadingWithdraw(false)
      refetch()
      loadTransactions()
    }
  }

  const handleDeposit = async () => {
    // Validation TXID: minimum 15 caractères
    if (txid.trim().length < 15) {
      notify.error('Le TXID doit contenir au minimum 15 caractères')
      return
    }
    
    setLoadingDeposit(true)
    try {
      await createCryptoDeposit({ amount: Number(depositAmount), channel: cryptoChannel, txid })
      notify.success('Demande de dépôt crypto envoyée avec succès')
      // Fermer automatiquement le modal et réinitialiser
      setShowDeposit(false)
      setCryptoChannel('')
      setDepositAmount('')
      setTxid('')
      setSelectedCryptoNetwork('')
      setDepositError(null)
      refetch()
      loadTransactions()
    } catch (e: any) {
      setDepositError(e?.response?.data?.message || 'Erreur lors de la demande de dépôt')
      notify.error(e?.response?.data?.message || 'Erreur lors de la demande de dépôt')
    } finally {
      setLoadingDeposit(false)
    }
  }

  const handleFiatOperatorChange = (operatorType: string) => {
    setFiatOperator(operatorType)
    const operateur = operateurs.find(o => o.operateur === operatorType.toLowerCase())
    setSelectedOperateurData(operateur)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify.success('Numéro copié !')
    } catch (e) {
      notify.error('Erreur de copie')
    }
  }

  const handleCopyCryptoAddress = async () => {
    const network = cryptoNetworks.find(n => n.id === selectedCryptoNetwork)
    if (!network) return
    
    try {
      await navigator.clipboard.writeText(network.address)
      notify.success('Adresse copiée !')
    } catch (e) {
      notify.error('Erreur de copie')
    }
  }

  const handleFiatSubmit = () => {
    if (!fiatPhone.trim() || !fiatAmount) {
      notify.error('Téléphone et montant requis')
      return
    }
    
    // Validation téléphone: exactement 10 chiffres
    if (fiatPhone.replace(/\D/g, '').length !== 10) {
      notify.error('Le numéro de téléphone doit contenir exactement 10 chiffres')
      return
    }
    
    // Validation montant minimum
    const amount = Number(fiatAmount)
    if (fiatCurrency === 'USD' && amount < 3) {
      notify.error('Le montant minimum est de 3 USD')
      return
    }
    if (fiatCurrency === 'CDF' && amount < 5000) {
      notify.error('Le montant minimum est de 5000 CDF')
      return
    }
    
    setCountdownSeconds(20)
    setShowConfirmationModal(true)
  }

  const handleFiatConfirm = async () => {
    setShowConfirmationModal(false)
    setLoadingFiat(true)
    try {
      // Créer le dépôt FIAT
      await api.post('/deposits/initiate', {
        amount: Number(fiatAmount),
        currency: fiatCurrency,
        operateur: fiatOperator,
        phone: fiatPhone,
        type: 'FIAT'
      })
      notify.success('Demande de dépôt envoyée avec succès')
      // Fermer automatiquement le modal de dépôt et réinitialiser les champs
      setShowDeposit(false)
      setFiatPhone('')
      setFiatAmount('')
      setFiatOperator('')
      setSelectedOperateurData(null)
      refetch()
      loadTransactions()
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Erreur lors de la demande de dépôt')
      // Fermer le modal même en cas d'erreur
      setShowDeposit(false)
      setFiatPhone('')
      setFiatAmount('')
      setFiatOperator('')
      setSelectedOperateurData(null)
    } finally {
      setLoadingFiat(false)
    }
  }
  return (
    <div
      className="
        mx-auto w-full
        max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-4xl
        px-3 sm:px-4 md:px-6 lg:px-8
        py-3 sm:py-4 md:py-6
      "
    >
      {/* HEADER */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain" />
        </div>
        <h1 className="font-bold text-sm sm:text-base md:text-lg flex-1 text-center">
          Portefeuille
        </h1>
        <div className="flex-shrink-0">
          <HeaderActions />
        </div>
      </header>

      {/* GRID PRINCIPALE */}
      <div className="space-y-3 sm:space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* MES FONDS */}
        <section className="bg-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Mes Fonds</h3>

          <div className="mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            {totalAvailable.toLocaleString()} {mainWallet?.currency || 'USDT'}
            <div className="text-xs text-gray-500 mt-1">Solde principal</div>
          </div>

          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <div className="text-gray-500 text-xs">Gains</div>
              <div className="font-bold text-sm sm:text-base">
                {totalGains.toLocaleString()} {mainWallet?.currency || 'USDT'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Solde investi</div>
              <div className="font-bold text-sm sm:text-base">
                {totalExpenses.toLocaleString()} {mainWallet?.currency || 'USDT'}
              </div>
            </div>
          </div>
        </section>

        {/* GESTION DES FONDS */}
        <section className="bg-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-3">
            Gestion des fonds
          </h3>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 py-2.5 sm:py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium transition"
            >
              Retrait
            </button>
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 py-2.5 sm:py-3 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-medium transition"
            >
              Dépôt
            </button>
          </div>
        </section>
      </div>

      {/* TRANSFERT */}
      <section className="bg-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm mt-3 sm:mt-4">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-3">
          Transfert des fonds
        </h3>

        <div className="flex flex-col gap-2 sm:gap-3">
          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value as 'gains' | 'sale')
            }
            className="w-full rounded-lg sm:rounded-xl border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="gains">Gains</option>
            <option value="sale">Solde investi</option>
          </select>

          <input
            type="number"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <button
            onClick={handleTransfer}
            disabled={loadingTransfer}
            className="w-full px-4 py-2.5 sm:py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-medium transition"
          >
            {loadingTransfer ? 'Transfert...' : 'Transférer'}
          </button>
        </div>
      </section>

      {/* HISTORIQUE */}
      <section className="bg-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm mt-3 sm:mt-4 md:mt-6 mb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">
            Historique des transactions
          </h3>
          
          {transactions.length > 0 && (
            <button
              onClick={clearHistory}
              disabled={clearingHistory}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {clearingHistory ? 'Suppression...' : '🗑️ Vider l\'historique'}
            </button>
          )}
        </div>

        {loadingTransactions ? (
          <div className="text-sm text-gray-400 text-center py-8">
            Chargement...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            Aucune transaction pour le moment
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              {transactions.slice(0, 5).map((tx: any) => (
                <div 
                  key={tx.id} 
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl">
                        {tx.type === 'deposit' ? '💰' : 
                         tx.type === 'withdraw' ? '💸' : 
                         tx.type === 'trade' ? '📈' : 
                         tx.type === 'transfer' ? '🔄' : 
                         tx.type === 'encash' ? '💵' : '📊'}
                      </span>
                      <div>
                        <div className="font-semibold text-sm sm:text-base">
                          {tx.type === 'deposit' ? 'Dépôt' : 
                           tx.type === 'withdraw' ? 'Retrait' : 
                           tx.type === 'trade' ? 'Investissement' : 
                           tx.type === 'transfer' ? 'Transfert' : 
                           tx.type === 'encash' ? 'Encaissement' : 
                           tx.type === 'referral' ? 'Parrainage' : 'Transaction'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`font-bold text-sm sm:text-base ${
                    tx.type === 'deposit' || tx.type === 'encash' || tx.type === 'referral'
                      ? 'text-green-600' 
                      : tx.type === 'withdraw' || tx.type === 'trade'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'encash' || tx.type === 'referral' ? '+' : '-'}
                    {Number(tx.amount).toLocaleString()} USDT
                  </div>
                </div>
              ))}
            </div>

            {transactions.length > 5 && (
              <button
                onClick={() => setShowAllTransactions(true)}
                className="w-full mt-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base text-violet-600 hover:text-violet-700 font-medium hover:underline"
              >
                Voir toutes les transactions ({transactions.length})
              </button>
            )}
          </>
        )}
      </section>
      {showDeposit && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2 sm:px-4 py-4">
    <div
      className="
        bg-white rounded-2xl w-full
        max-w-[95vw] sm:max-w-md md:max-w-lg
        max-h-[88vh] sm:max-h-[90vh] overflow-y-auto
        p-3 sm:p-5 md:p-6
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="font-semibold text-base sm:text-lg md:text-xl">Dépôt</h2>
        <button onClick={() => setShowDeposit(false)} className="text-xl md:text-2xl">✕</button>
      </div>

      {/* TABS */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-3 sm:mb-4">
        <button
          onClick={() => setDepositType('FIAT')}
          className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-medium
            ${depositType === 'FIAT' ? 'bg-white shadow' : 'text-gray-500'}
          `}
        >
          💵 Fiat
        </button>
        <button
          onClick={() => setDepositType('CRYPTO')}
          className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-medium
            ${depositType === 'CRYPTO' ? 'bg-white shadow' : 'text-gray-500'}
          `}
        >
          ₿ Crypto
        </button>
      </div>

      {/* ================= FIAT ================= */}
      {depositType === 'FIAT' && (
        <div className="space-y-3 sm:space-y-4">
          <select
            className="w-full bg-gray-100 rounded-xl px-3 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm"
            value={fiatCurrency}
            onChange={(e) =>
              setFiatCurrency(e.target.value as 'CDF' | 'USD')
            }
          >
            <option value="CDF">Franc Congolais (CDF)</option>
            <option value="USD">Dollar (USD)</option>
          </select>

          {/* Sélection d'opérateur */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
              Sélectionnez un opérateur
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => handleFiatOperatorChange('orange')}
                className={`rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-xs sm:text-sm font-bold
                  flex flex-col items-center gap-1 sm:gap-2 transition duration-200
                  ${fiatOperator === 'orange'
                    ? 'bg-orange-100 border-2 border-orange-500 shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}
                `}
              >
                <img src={orangeLogo} alt="Orange" className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
                <span className="text-xs sm:text-sm">Orange</span>
              </button>
              <button
                onClick={() => handleFiatOperatorChange('airtel')}
                className={`rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-xs sm:text-sm font-bold
                  flex flex-col items-center gap-1 sm:gap-2 transition duration-200
                  ${fiatOperator === 'airtel'
                    ? 'bg-red-100 border-2 border-red-500 shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}
                `}
              >
                <img src={airtelLogo} alt="Airtel" className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
                <span className="text-xs sm:text-sm">Airtel</span>
              </button>
              <button
                onClick={() => handleFiatOperatorChange('mpesa')}
                className={`rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-xs sm:text-sm font-bold
                  flex flex-col items-center gap-1 sm:gap-2 transition duration-200
                  ${fiatOperator === 'mpesa'
                    ? 'bg-green-100 border-2 border-green-500 shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}
                `}
              >
                <img src={mpesaLogo} alt="M-Pesa" className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
                <span className="text-xs sm:text-sm">M-Pesa</span>
              </button>
            </div>
          </div>

          {/* Guide de processus */}
          {selectedOperateurData && (
            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
              <div className="flex justify-between items-start gap-2 sm:gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">
                    Numéro de l'agent
                  </p>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-blue-600 mt-1.5 break-all">
                    {selectedOperateurData.numero_agent}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedOperateurData.numero_agent)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition flex-shrink-0"
                >
                  📋 Copier
                </button>
              </div>

              <div className="border-t border-blue-200 pt-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2.5">
                  Guide USSD
                </p>
                <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 font-medium">
                  {fiatOperator === 'orange' && (
                    <>
                      <p><b>1.</b> Composez <b>*144#</b></p>
                      <p><b>2.</b> Sélectionnez <b>1 pour USD et 2 pour CDF</b></p>
                      <p><b>3.</b> Sélectionnez <b>3 Je retire l'argent</b></p>
                      <p><b>3.</b> Sélectionnez <b>1 Retrait Agent</b></p>
                      <p><b>4.</b> Entrez <b>le numéro de l'agent</b></p>
                      <p><b>5.</b> Entrez <b>le montant</b> à retirer</p>
                      <p><b>6.</b> Entrez votre <b>code PIN</b> puis <b>confirmez</b></p>
                    </>
                  )}
                  {fiatOperator === 'airtel' && (
                    <>
                      <p><b>1.</b> Composez <b>*501#</b></p>
                      <p><b>2.</b> Sélectionnez <b>1 pour USD et 2 pour CDF</b></p>
                      <p><b>3.</b> Sélectionnez <b>2 Je retire l'argent</b></p>
                      <p><b>3.</b> Sélectionnez <b>1 Après d'un Agent</b></p>
                      <p><b>4.</b> Entrez <b>le numéro de l'agent</b></p>
                      <p><b>5.</b> Entrez <b>le montant</b></p>
                      <p><b>6.</b> Entrez votre <b>PIN de sécurité</b> puis <b>confirmez</b></p>
                    </>
                  )}
                  {fiatOperator === 'mpesa' && (
                    <>
                      <p><b>1.</b> Composez <b>*1122#</b></p>
                      <p><b>2.</b> Sélectionnez <b>3 Je retire l'argent</b></p>
                      <p><b>3.</b> Sélectionnez <b>Vers numéro de téléphone</b></p>
                      <p><b>4.</b> Entrez <b>le numéro de l'agent</b></p>
                      <p><b>5.</b> Entrez <b>le montant</b> à rétirer</p>
                      <p><b>6.</b> Entrez votre <b>code secret M-Pesa</b> puis <b>confirmez</b></p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Champs de saisie */}
          <input
            placeholder="Téléphone (10 chiffres)"
            value={fiatPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              if (value.length <= 10) {
                setFiatPhone(value)
              }
            }}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg sm:rounded-xl px-3 py-2.5 sm:py-2.5 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            maxLength={10}
            required
          />
          {fiatPhone && fiatPhone.length !== 10 && (
            <p className="text-xs text-red-500 mt-1">Le numéro doit contenir exactement 10 chiffres</p>
          )}

          <input
            placeholder={`Montant (min: ${fiatCurrency === 'USD' ? '3 USD' : '5000 CDF'})`}
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg sm:rounded-xl px-3 py-2.5 sm:py-2.5 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            min={fiatCurrency === 'USD' ? 3 : 5000}
            required
          />
          {fiatAmount && ((fiatCurrency === 'USD' && Number(fiatAmount) < 3) || (fiatCurrency === 'CDF' && Number(fiatAmount) < 5000)) && (
            <p className="text-xs text-red-500 mt-1">
              Le montant minimum est de {fiatCurrency === 'USD' ? '3 USD' : '5000 CDF'}
            </p>
          )}

          <p className="text-xs sm:text-sm text-gray-500">
            Vielleux à bien recopier le numéro du compte <b>l'erreur est humaine pas technologique !</b>
            <br />
            ℹ️ Dépôt converti automatiquement en <b>USDT</b>.
          </p>

          <button
            onClick={handleFiatSubmit}
            disabled={!fiatOperator || !fiatPhone || fiatPhone.length !== 10 || !fiatAmount || Number(fiatAmount) < (fiatCurrency === 'USD' ? 3 : 5000) || loadingFiat}
            className={`w-full py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-bold text-white transition duration-200 text-xs sm:text-sm
              ${!fiatOperator || !fiatPhone || fiatPhone.length !== 10 || !fiatAmount || Number(fiatAmount) < (fiatCurrency === 'USD' ? 3 : 5000) || loadingFiat
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 shadow-md'}
            `}
          >
            {loadingFiat ? 'Traitement...' : '✓ Confirmé votre Transaction'}
          </button>
        </div>
      )}

      {/* ================= CRYPTO ================= */}
      {depositType === 'CRYPTO' && (
        <div className="space-y-4">
          <select
            value={selectedCryptoNetwork}
            onChange={(e) => setSelectedCryptoNetwork(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-3 py-3 sm:px-3 sm:py-2 text-sm sm:text-sm min-h-[44px] sm:min-h-[40px]"
            style={selectStyle}
          >
            <option value="">Sélectionner le réseau</option>
            {cryptoNetworks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>

          {selectedCryptoNetwork && (
            <div className="space-y-2">
              <div className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-3 text-xs sm:text-sm md:text-base break-all font-mono">
                <div className="text-gray-600 text-xs mb-1">Adresse de dépôt:</div>
                {cryptoNetworks.find(n => n.id === selectedCryptoNetwork)?.address}
              </div>
              <button
                onClick={handleCopyCryptoAddress}
                className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition"
              >
                📋 Copier l'adresse
              </button>
            </div>
          )}

          <input
            placeholder="TXID / Hash (min 15 caractères)"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm md:text-base"
            minLength={15}
          />
          {txid && txid.trim().length < 15 && (
            <p className="text-xs text-red-500 mt-1">Le TXID doit contenir au minimum 15 caractères</p>
          )}

          <button
            onClick={handleDeposit}
            disabled={!isValidDeposit || txid.trim().length < 15 || loadingDeposit}
            className={`w-full py-3 rounded-xl text-white font-semibold transition
              ${!isValidDeposit || txid.trim().length < 15 || loadingDeposit ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
            `}
          >
            {loadingDeposit ? '...' : 'Valider'}
          </button>

          {depositError && (
            <p className="text-red-600 text-sm">{depositError}</p>
          )}
        </div>
      )}
    </div>
  </div>
)}
    {showWithdraw && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-3 sm:px-4">
    <div
      className="
        bg-white rounded-2xl w-full
        max-w-sm sm:max-w-md md:max-w-lg
        max-h-[90vh] overflow-y-auto
        p-4 sm:p-6
      "
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-base sm:text-lg md:text-xl">Retrait</h2>
        <button onClick={() => setShowWithdraw(false)} className="text-xl md:text-2xl">✕</button>
      </div>

      <div className="space-y-4">
        {/* Sélection du compte */}
        {bankAccounts.length > 0 ? (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Sélectionnez un compte</label>
            <div className="space-y-2">
              {bankAccounts.filter(acc => acc.is_active).map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedAccountId === account.id
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm md:text-base">
                          {account.account_type === 'bank' ? account.bank_name : account.operator_name}
                        </span>
                        {account.is_default && (
                          <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded">Défaut</span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">{account.account_holder_name}</div>
                      <div className="text-xs md:text-sm text-gray-500">{account.account_number}</div>
                    </div>
                    {selectedAccountId === account.id && (
                      <div className="text-violet-600 text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-2">Aucun compte enregistré</p>
            <p className="text-xs">Veuillez d'abord ajouter un compte dans votre profil (Dashboard → Compléter votre compte)</p>
          </div>
        )}

        {/* Montant du retrait */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Montant du retrait</label>
          <input
            type="number"
            placeholder="Entrez le montant"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm md:text-base focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        {withdrawError && (
          <p className="text-red-600 text-sm">{withdrawError}</p>
        )}

        <button
          onClick={handleWithdraw}
          disabled={!selectedAccountId || !withdrawAmount || Number(withdrawAmount) <= 0 || loadingWithdraw}
          className={`w-full py-3 rounded-xl font-semibold text-white text-sm md:text-base
            ${loadingWithdraw || !selectedAccountId || !withdrawAmount || Number(withdrawAmount) <= 0
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'}
          `}
        >
          {loadingWithdraw ? 'Traitement...' : 'Confirmer le retrait'}
        </button>

        {bankAccounts.length === 0 && (
          <button
            onClick={() => {
              setShowWithdraw(false)
              window.location.href = '/dashboard'
            }}
            className="w-full py-3 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 text-white text-sm md:text-base"
          >
            Aller au profil
          </button>
        )}
      </div>
    </div>
  </div>
)}

      {/* MODAL TOUTES LES TRANSACTIONS */}
      {showAllTransactions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3 sm:px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-5 md:p-6 border-b">
              <h2 className="font-bold text-base sm:text-lg md:text-xl">
                Historique complet ({transactions.length})
              </h2>
              <button 
                onClick={() => setShowAllTransactions(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body scrollable */}
            <div className="overflow-y-auto p-4 sm:p-5 md:p-6">
              <div className="space-y-2 sm:space-y-3">
                {transactions.map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl">
                          {tx.type === 'deposit' ? '💰' : 
                           tx.type === 'withdraw' ? '💸' : 
                           tx.type === 'trade' ? '📈' : 
                           tx.type === 'transfer' ? '🔄' : 
                           tx.type === 'encash' ? '💵' : '📊'}
                        </span>
                        <div>
                          <div className="font-semibold text-sm sm:text-base">
                            {tx.type === 'deposit' ? 'Dépôt' : 
                             tx.type === 'withdraw' ? 'Retrait' : 
                             tx.type === 'trade' ? 'Investissement' : 
                             tx.type === 'transfer' ? 'Transfert' : 
                             tx.type === 'encash' ? 'Encaissement' : 
                             tx.type === 'referral' ? 'Parrainage' : 'Transaction'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`font-bold text-sm sm:text-base ${
                      tx.type === 'deposit' || tx.type === 'encash' || tx.type === 'referral'
                        ? 'text-green-600' 
                        : tx.type === 'withdraw' || tx.type === 'trade'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'encash' || tx.type === 'referral' ? '+' : '-'}
                      {Number(tx.amount).toLocaleString()} USDT
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 sm:p-5">
              <button
                onClick={() => setShowAllTransactions(false)}
                className="w-full py-2.5 sm:py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - 20 SECONDES */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-sm p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-4">⏱️</div>
            
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-800 mb-2">
                Confirmez votre Transaction
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 break-words">
                Montant: <b>{fiatAmount}</b> {fiatCurrency} {fiatOperator && `via ${fiatOperator.toUpperCase()}`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-blue-200">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 mb-1 sm:mb-2 font-mono">
                {String(countdownSeconds).padStart(2, '0')}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                Confirmation automatique
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 py-2 sm:py-2.5 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleFiatConfirm}
                disabled={loadingFiat}
                className="flex-1 py-2 sm:py-2.5 md:py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base transition duration-200"
              >
                {loadingFiat ? '...' : '✓ Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
