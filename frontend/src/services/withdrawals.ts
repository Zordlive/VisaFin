import api from './api'

export function createWithdrawal(payload: {
  amount: number
  bank: string
  account: string
}) {
  return api.post('/withdrawals/create/', payload)
}
