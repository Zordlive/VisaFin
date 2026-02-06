import api from './api'

export function createWithdrawal(payload: {
  amount: number
  bank: string
  account: string
}) {
  return api.post('/withdrawals/', {
    amount: payload.amount,
    bank: payload.bank,
    account: payload.account
  })
}
