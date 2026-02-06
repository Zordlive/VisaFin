import api from './api'

export interface BankAccount {
  id: number
  account_type: 'crypto' | 'mobile'
  operator_name?: string
  account_number?: string
  account_holder_name?: string
  crypto_account?: string
  crypto_account_id?: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface CreateBankAccountData {
  account_type: 'crypto' | 'mobile'
  operator_name?: string
  account_number?: string
  account_holder_name?: string
  crypto_account?: string
  crypto_account_id?: string
  is_default?: boolean
}

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  const response = await api.get<BankAccount[] | { results?: BankAccount[] }>('/bank-accounts/')
  if (Array.isArray(response.data)) {
    return response.data
  }
  if (response.data && Array.isArray(response.data.results)) {
    return response.data.results
  }
  return []
}

export async function createBankAccount(data: CreateBankAccountData): Promise<BankAccount> {
  const payload = {
    ...data,
    account_number: data.account_number?.trim(),
    account_holder_name: data.account_holder_name?.trim(),
    operator_name: data.operator_name?.trim(),
    crypto_account: data.crypto_account?.trim(),
    crypto_account_id: data.crypto_account_id?.trim()
  }
  const response = await api.post('/bank-accounts/', payload)
  return response.data
}

export async function updateBankAccount(id: number, data: Partial<CreateBankAccountData>): Promise<BankAccount> {
  const response = await api.patch(`/bank-accounts/${id}/`, data)
  return response.data
}

export async function deleteBankAccount(id: number): Promise<void> {
  await api.delete(`/bank-accounts/${id}/`)
}

export async function setDefaultAccount(id: number): Promise<void> {
  await api.post(`/bank-accounts/${id}/set_default/`)
}
