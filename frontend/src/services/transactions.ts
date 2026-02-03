import api from './api'

export async function createSellTransaction(payload: { offer_id: string; amount: number; currency: string; otp?: string }) {
  throw new Error('createSellTransaction is not available on this backend')
}

export async function fetchTransactions(params?: any) {
  const res = await api.get('/transactions', { params })
  return res.data
}

export async function fetchTransaction(id: string) {
  throw new Error('fetchTransaction is not available on this backend')
}
