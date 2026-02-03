import api from './api'

export interface CryptoDepositPayload {
  amount: number
  channel: 'BEP20_USDT' | 'TRC20_USDT' | 'BNB'
  txid: string
  currency?: string
}

export function createCryptoDeposit(payload: CryptoDepositPayload) {
  return api.post('/deposits/initiate', {
    amount: payload.amount,
    currency: payload.currency || 'USDT',
    external_id: payload.txid || null,
    channel: payload.channel,
  })
}
