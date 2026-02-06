import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import logo from '../img/Logo à jour.png';

interface AdminNotification {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  user_phone: string;
  notification_type: string;
  notification_type_display: string;
  amount: number;
  account_info: string;
  is_read: boolean;
  deposit: number | null;
  withdrawal: number | null;
  created_at: string;
}

interface Withdrawal {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  user_phone: string;
  amount: number;
  bank: string;
  account: string;
  status: string;
  reason_rejected: string | null;
  processed_by: number | null;
  processed_by_username: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MarketOffer {
  id: number;
  title: string;
  description: string;
  price_offered: number;
  status: string;
  availability_hours: number | null;
  created_at: string;
  expires_at: string | null;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [processAction, setProcessAction] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerAvailabilityHours, setOfferAvailabilityHours] = useState('');
  const [creatingOffer, setCreatingOffer] = useState(false);

  // Redirect if not staff
  useEffect(() => {
    if (user && !user.is_staff) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load notifications
  useEffect(() => {
    if (!user || !user.is_staff) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [withdrawalsRes, referralsRes, offersRes] = await Promise.all([
          api.get('/withdrawals').catch(() => ({ data: [] })),
          api.get('/referrals/me').catch(() => ({ data: [] })),
          api.get('/market/offers').catch(() => ({ data: [] }))
        ]);
        setNotifications([]);
        setWithdrawals(withdrawalsRes.data.results || withdrawalsRes.data || []);
        setReferrals(referralsRes.data.results || referralsRes.data || []);
        setMarketOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (notificationId: number) => {
    try {
      throw new Error('Admin notifications are not supported on this backend');
    } catch (err) {
      setError('Erreur lors du marquage de la notification');
    }
  };

  const processWithdrawal = async () => {
    if (!selectedWithdrawal || !processAction) return;
    
    try {
      setProcessing(true);
      const payload = {
        action: processAction,
        reason: processAction === 'reject' ? rejectReason : undefined,
      };
      throw new Error('Withdrawal processing is not supported on this backend');
      
      // Update local state
      setWithdrawals(prev =>
        prev.map(w => 
          w.id === selectedWithdrawal.id
            ? { ...w, status: processAction === 'complete' ? 'completed' : 'rejected' }
            : w
        )
      );
      setSelectedWithdrawal(null);
      setProcessAction('');
      setRejectReason('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du traitement du retrait');
    } finally {
      setProcessing(false);
    }
  };

  if (!user || !user.is_staff) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleCreateOffer = async () => {
    if (!offerTitle.trim() || !offerPrice) {
      setError('Titre et prix requis');
      return;
    }

    setCreatingOffer(true);
    setError('');
    try {
      const payload: any = {
        title: offerTitle.trim(),
        description: offerDescription.trim(),
        price_offered: Number(offerPrice),
      };

      if (offerAvailabilityHours) {
        payload.availability_hours = Number(offerAvailabilityHours);
      }

      const res = await api.post('/market/offers', payload);
      setMarketOffers((prev) => [res.data, ...prev]);
      setOfferTitle('');
      setOfferDescription('');
      setOfferPrice('');
      setOfferAvailabilityHours('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'offre');
    } finally {
      setCreatingOffer(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F4EDDE' }} className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50">
        <div className="bg-[#F4EDDE]/90 backdrop-blur-md border-b border-white/60">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-gray-900 text-xl sm:text-2xl font-bold">Tableau de Bord Admin</h1>
            </Link>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white text-violet-700 px-4 py-2 rounded-lg font-semibold hover:bg-violet-50 transition"
            >
              Retour
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="text-blue-600 text-4xl">⏳</div>
            </div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-4 px-4 font-semibold transition ${
                  activeTab === 'notifications'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`pb-4 px-4 font-semibold transition ${
                  activeTab === 'withdrawals'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Retraits à Traiter
                {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white rounded-full px-2 py-1 text-sm">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`pb-4 px-4 font-semibold transition ${
                  activeTab === 'referrals'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Parrainages ({referrals.length})
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`pb-4 px-4 font-semibold transition ${
                  activeTab === 'offers'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Offres
              </button>
            </div>

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="grid gap-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition hover:shadow-lg ${
                        !notification.is_read ? 'border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedNotification(notification);
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              notification.notification_type === 'deposit'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {notification.notification_type_display}
                            </span>
                            {!notification.is_read && (
                              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="mt-2 text-xl font-bold text-blue-600">
                            {notification.amount} USD
                          </p>
                          <p className="text-gray-600 mt-1">
                            {notification.user_username} ({notification.user_email})
                          </p>
                          <p className="text-sm text-gray-500">
                            Compte: {notification.account_info}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          {notification.user_phone && (
                            <p className="text-sm font-semibold text-blue-600">
                              📱 {notification.user_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="grid gap-4">
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-600">Aucun retrait</p>
                  </div>
                ) : (
                  withdrawals.map(withdrawal => (
                    <div
                      key={withdrawal.id}
                      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition hover:shadow-lg border-l-4 ${
                        withdrawal.status === 'pending'
                          ? 'border-orange-500'
                          : withdrawal.status === 'completed'
                          ? 'border-green-500'
                          : 'border-red-500'
                      }`}
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              withdrawal.status === 'pending'
                                ? 'bg-orange-100 text-orange-800'
                                : withdrawal.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </div>
                          <p className="mt-2 text-xl font-bold text-blue-600">
                            {withdrawal.amount} USD
                          </p>
                          <p className="text-gray-600 mt-1">
                            {withdrawal.user_username} ({withdrawal.user_email})
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {withdrawal.bank} - {withdrawal.account}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(withdrawal.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          {withdrawal.user_phone && (
                            <p className="text-sm font-semibold text-blue-600">
                              📱 {withdrawal.user_phone}
                            </p>
                          )}
                          {withdrawal.status === 'completed' && withdrawal.processed_at && (
                            <p className="text-xs text-green-600 mt-2">
                              Traité le {new Date(withdrawal.processed_at).toLocaleString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for withdrawal processing */}
      {selectedWithdrawal && activeTab === 'withdrawals' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              Traiter le Retrait
            </h2>
            
            <div className="space-y-4 mb-6 text-gray-700">
              <p><strong>Utilisateur:</strong> {selectedWithdrawal.user_username}</p>
              <p><strong>Email:</strong> {selectedWithdrawal.user_email}</p>
              {selectedWithdrawal.user_phone && (
                <p><strong>Téléphone:</strong> {selectedWithdrawal.user_phone}</p>
              )}
              <p><strong>Montant:</strong> {selectedWithdrawal.amount} USD</p>
              <p><strong>Banque:</strong> {selectedWithdrawal.bank}</p>
              <p><strong>Compte:</strong> {selectedWithdrawal.account}</p>
              <p><strong>Statut:</strong> {selectedWithdrawal.status}</p>
            </div>

            {selectedWithdrawal.status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Action
                  </label>
                  <select
                    value={processAction}
                    onChange={(e) => setProcessAction(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Sélectionner une action</option>
                    <option value="complete">Approuver</option>
                    <option value="reject">Rejeter</option>
                  </select>
                </div>

                {processAction === 'reject' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Raison du rejet
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Expliquez pourquoi ce retrait est rejeté"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedWithdrawal(null);
                      setProcessAction('');
                      setRejectReason('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                    disabled={processing}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={processWithdrawal}
                    disabled={!processAction || processing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Traitement...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            )}

            {selectedWithdrawal.status !== 'pending' && (
              <div>
                <p className="text-center text-gray-600 mb-4">
                  Ce retrait a déjà été traité.
                </p>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="grid gap-4">
          {referrals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">Aucun parrainage enregistré</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {referrals.map((ref: any) => (
                <div key={ref.id} className="bg-white rounded-lg shadow p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">Filleul</h3>
                      <p className="text-gray-600">{ref.referred_user?.first_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{ref.referred_user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Parrain</h3>
                      <p className="text-gray-600">{ref.code?.referrer?.first_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{ref.code?.referrer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Code</h3>
                      <p className="font-mono text-blue-600">{ref.code?.code}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Statut</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        ref.status === 'used' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ref.status === 'used' ? 'Actif' : 'En attente'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Date d'inscription</h3>
                      <p className="text-gray-600">{ref.used_at ? new Date(ref.used_at).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Bonus accordé</h3>
                      <p className="text-green-600 font-bold">10 USDT</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

            {activeTab === 'offers' && (
              <div className="grid gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Créer une offre</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                      <input
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Ex: Offre VIP 30 jours"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                      <input
                        type="number"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Montant"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={offerDescription}
                        onChange={(e) => setOfferDescription(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        rows={3}
                        placeholder="Description de l'offre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée (heures)</label>
                      <input
                        type="number"
                        value={offerAvailabilityHours}
                        onChange={(e) => setOfferAvailabilityHours(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Ex: 24"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateOffer}
                    disabled={creatingOffer}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingOffer ? 'Création...' : 'Créer l\'offre'}
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Offres existantes</h3>
                  {marketOffers.length === 0 ? (
                    <div className="text-gray-500">Aucune offre</div>
                  ) : (
                    <div className="space-y-3">
                      {marketOffers.map((offer) => (
                        <div key={offer.id} className="border rounded-md p-4">
                          <div className="flex justify-between gap-4">
                            <div>
                              <div className="font-semibold">{offer.title}</div>
                              <div className="text-sm text-gray-600">{offer.description}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                Durée: {offer.availability_hours ? `${offer.availability_hours}h` : '—'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Expire: {offer.expires_at ? new Date(offer.expires_at).toLocaleString('fr-FR') : '—'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">{offer.price_offered} USD</div>
                              <div className="text-xs text-gray-500">{offer.status}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
