import api from './api'

export async function fetchVIPLevels() {
  const res = await api.get('/vip/levels')
  return res.data
}

export async function fetchUserVIPSubscriptions() {
  const res = await api.get('/vip/subscriptions/me')
  return res.data
}

export async function purchaseVIPLevel(levelId: number) {
  const res = await api.post('/vip/subscriptions/purchase', { vip_level_id: levelId })
  return res.data
}

export async function getQuantificationGains() {
  return []
}

export async function claimGains() {
  throw new Error('Quantification endpoints are not available on this backend')
}
