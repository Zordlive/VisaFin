import api from './api'

export async function fetchWallets() {
  const res = await api.get('/wallets')
  return res.data
}

export async function transferFunds(walletId: number | string, amount: number | string, source: 'gains' | 'sale' = 'gains') {
  const res = await api.post(`/wallets/${walletId}/transfer_gains`, { amount, source })
  return res.data
}
