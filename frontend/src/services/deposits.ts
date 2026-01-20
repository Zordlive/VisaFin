import api from './api'

export interface CryptoDepositPayload {
  amount: number
  channel: 'BEP20_USDT' | 'TRC20_USDT' | 'BNB'
  txid: string
  currency?: string
}

export function createCryptoDeposit(payload: CryptoDepositPayload) {
  return api.post('/deposits', {
    ...payload,
    currency: payload.currency || 'USDT',
  })
}
